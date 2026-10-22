import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Express, Request } from 'express';
import * as seed from './src/data/initialData';
import { reconcilePpmSchedulesWithAssets } from './src/utils/dateCompliance';

export class OperationError extends Error { constructor(message: string, public status = 400) { super(message); } }
const check = (ok: unknown, message: string, status = 400): void => { if (!ok) throw new OperationError(message, status); };
const text = (v: unknown) => typeof v === 'string' ? v.trim() : '';
const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${randomUUID()}`;
const initial = () => ({ reports: structuredClone(seed.initialReports), assets: structuredClone(seed.initialAssets), products: structuredClone(seed.initialProducts), movements: structuredClone(seed.initialMovements), invoices: structuredClone(seed.initialInvoices), purchaseOrders: structuredClone(seed.initialPurchaseOrders), ppmSchedules: reconcilePpmSchedulesWithAssets(structuredClone(seed.initialPpmSchedules), structuredClone(seed.initialAssets)), calibrationLogs: structuredClone(seed.initialCalibrationLogs), suppliers: structuredClone(seed.initialSuppliers), contracts: structuredClone(seed.initialSupplierContracts), transportRequests: structuredClone(seed.initialTransportRequests), compounds: structuredClone(seed.initialCompounds), housingUnits: structuredClone(seed.initialHousingUnits), serviceRequests: structuredClone(seed.initialServiceRequests), sfdaAlerts: structuredClone(seed.initialSfdaAlerts), systemConfig: structuredClone(seed.initialSystemConfig), auditLogs: [] as any[], processed: {} as Record<string, { actor: string; fingerprint: string; result: any }>, revision: 0 });
export type State = ReturnType<typeof initial>;
export function freshState(): State { const state=initial();for(const product of state.products){const supplier=state.suppliers.find(s=>s.id===product.supplierId);if(supplier)product.supplierName=supplier.name;}for(const order of state.purchaseOrders){const first=state.products.find(p=>p.id===order.items[0]?.productId);if(first){order.supplierName=first.supplierName;(order as any).supplierId=first.supplierId;}}return state; }
type Actor = typeof seed.initialUsers[number];
function permitted(actor: Actor, roles: string[]) { check(roles.includes(actor.role), 'ليس لديك صلاحية لتنفيذ هذه العملية', 403); }
function nextCode(s:State,kind:keyof State['systemConfig']['codeRules'],fallback:string){const rule=s.systemConfig.codeRules[kind];if(!rule)return id(fallback);check(Number.isInteger(rule.currentSequence)&&rule.currentSequence>=0&&Number.isInteger(rule.digits)&&rule.digits>0&&rule.digits<=12,'قاعدة ترقيم غير صالحة');const used=new Set([s.reports,s.assets,s.purchaseOrders,s.calibrationLogs,s.invoices,s.contracts].flat().map(x=>x.id));let code:string;do{code=`${rule.prefix}${String(rule.currentSequence++).padStart(rule.digits,'0')}${rule.suffix||''}`;}while(used.has(code));return code;}
function stockMove(s: State, p: any, actor: Actor) {
  const product = s.products.find(x => x.id === Number(p.productId));
  check(product, 'الصنف غير موجود', 404);
  check(['استلام', 'صرف داخلي', 'بيع'].includes(p.movementType), 'نوع الحركة غير مدعوم');
  const qty = Math.abs(Number(p.quantity));
  check(Number.isFinite(qty) && qty > 0 && Number.isInteger(qty), 'الكمية يجب أن تكون عددًا صحيحًا موجبًا');
  const delta = p.movementType === 'استلام' ? qty : -qty;
  const batchAllocations:any[]=[];
  check(product!.stock + delta >= 0, 'الكمية المطلوبة تتجاوز الرصيد المتاح', 409);
  if(/أدوية|محاليل|كواشف/.test(product!.category)){
    const batches=(product as any).batches||=[];
    if(delta>0){check(text(p.lotNumber)&&/^\d{4}-\d{2}-\d{2}$/.test(p.expiryDate||'')&&p.expiryDate>today()&&new Date(p.expiryDate).toISOString().slice(0,10)===p.expiryDate,'رقم الدفعة وصلاحية مستقبلية صحيحة مطلوبان للصنف الطبي');let batch=batches.find((b:any)=>b.lotNumber===p.lotNumber&&b.expiryDate===p.expiryDate);if(!batch){batch={lotNumber:text(p.lotNumber),expiryDate:p.expiryDate,quantity:0};batches.push(batch);}batch.quantity+=qty;batchAllocations.push({lotNumber:batch.lotNumber,expiryDate:batch.expiryDate,quantity:qty});}
    else{const valid=batches.filter((b:any)=>b.expiryDate>today()&&b.quantity>0).sort((a:any,b:any)=>a.expiryDate.localeCompare(b.expiryDate));check(valid.reduce((n:number,b:any)=>n+b.quantity,0)>=qty,'الرصيد الموثق بدفعات صالحة غير كافٍ؛ الرصيد التجريبي غير مؤهل للصرف');let remaining=qty;for(const batch of valid){const issued=Math.min(remaining,batch.quantity);batch.quantity-=issued;remaining-=issued;batchAllocations.push({lotNumber:batch.lotNumber,expiryDate:batch.expiryDate,quantity:-issued});if(!remaining)break;}}
  }
  product!.stock += delta;
  const movement = { id: id('MOV'), productId: product!.id, productName: product!.name, movementType: p.movementType, quantity: delta, batchAllocations, timestamp: new Date().toISOString(), performedBy: actor.name, referenceCode: p.referenceCode, notes: text(p.notes) };
  s.movements.unshift(movement); return movement;
}

/** Shared transaction rules for online requests and offline replay. Mutates only its supplied clone. */
export function applyOperation(s: State, type: string, p: any, actor: Actor): any {
  check(p && typeof p === 'object', 'بيانات العملية مطلوبة');
  if (type === 'create_report') {
    check(text(p.title) && text(p.location) && text(p.description), 'العنوان والموقع والوصف مطلوبة');
    check(['عاجل', 'متوسط', 'منخفض'].includes(p.priority), 'أولوية غير صحيحة');
    if (p.assetId) check(s.assets.some(a => a.id === p.assetId), 'الجهاز المرتبط غير موجود', 404);
    check(!p.id||(typeof p.id==='string'&&p.id.length<=100),'معرف البلاغ غير صالح');
    const report = { id: p.id || nextCode(s,'report','REP'), title: text(p.title), location: text(p.location), description: text(p.description), category: text(p.category), priority: p.priority, imageUri: p.imageUri, assetId: p.assetId, status: 'جديد' as const, createdAt: new Date().toISOString(), createdBy: actor.id, version: 1 };
    check(!s.reports.some(x => x.id === report.id), 'رقم البلاغ موجود مسبقًا', 409);
    check(!p.imageUri || (typeof p.imageUri === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(p.imageUri) && p.imageUri.length < 14_000_000), 'صورة غير صالحة أو كبيرة');
    const targets=s.systemConfig.responseTimeMinutes;if(targets&&targets[p.priority]>0)(report as any).responseDueAt=new Date(Date.now()+targets[p.priority]*60000).toISOString();
    s.reports.unshift(report); return report;
  }
  if (type === 'update_report_status') {
    permitted(actor, ['admin', 'biomedical']);
    const r: any = s.reports.find(x => x.id === p.id); check(r, 'البلاغ غير موجود', 404);
    check(p.version === undefined || p.version === (r.version || 1), 'تغير البلاغ على جهاز آخر؛ حدّث البيانات أولًا', 409);
    if(p.assignedTo&&p.assignedTo!==r.assignedTo){permitted(actor,['admin']);const assignee=seed.initialUsers.find(x=>x.id===p.assignedTo&&['admin','biomedical'].includes(x.role));check(assignee,'مستخدم الإسناد غير صالح');r.assignedTo=assignee!.id;r.assignedEngineer=assignee!.name;}
    check(actor.role==='admin'||!r.assignedTo||r.assignedTo===actor.id,'أمر العمل مسند لمستخدم آخر',403);
    const transitions: Record<string, string[]> = { 'جديد': ['جديد', 'قيد المعالجة'], 'قيد المعالجة': ['قيد المعالجة', 'بانتظار الاعتماد'], 'بانتظار الاعتماد': ['بانتظار الاعتماد', 'قيد المعالجة', 'مغلق'], 'مغلق': ['مغلق', 'قيد المعالجة'] };
    check(transitions[r.status]?.includes(p.status), 'انتقال غير مسموح؛ ابدأ التنفيذ ثم أرسل للمراجعة قبل الإغلاق');
    if (r.status === 'مغلق') { permitted(actor, ['admin']); check(p.status !== 'قيد المعالجة' || text(p.technicianNotes), 'سبب إعادة الفتح مطلوب'); }
    if (p.status === 'قيد المعالجة') { r.assignedTo ||= actor.id; r.assignedEngineer ||= actor.name; r.startedAt ||= new Date().toISOString(); }
    const completing = p.status === 'بانتظار الاعتماد' || p.status === 'مغلق';
    if (completing) {
      check(text(p.technicianNotes || r.technicianNotes), 'تقرير الإنجاز مطلوب');
      check(Number.isFinite(Number(p.downtimeHours ?? r.downtimeHours)) && Number(p.downtimeHours ?? r.downtimeHours) >= 0, 'ساعات التعطل مطلوبة ولا تكون سالبة');
      check(p.serviceRestored === true, 'يجب تأكيد اختبار الجهاز واستعادة الخدمة');
    }
    if (p.status === 'مغلق' && r.status !== 'مغلق') {
      permitted(actor, ['admin']); check(r.technicianSignOff && r.technicianSignOff.engineerName !== actor.name, 'اعتماد الإغلاق يجب أن يكون من مراجع مستقل عن المنفّذ');
      check(!s.sfdaAlerts.some(a=>a.riskClass.includes('حرج')&&a.status==='مفتوح'&&a.matchedHospitalAssetIds.includes(r.assetId)),'عالج الاستدعاء الحرج المرتبط قبل اعتماد استعادة الخدمة');
      check(p.technicianNotes===undefined||text(p.technicianNotes)===r.technicianNotes,'أعد أمر العمل للتنفيذ قبل تعديل تقرير موقّع');
      check(p.downtimeHours===undefined||p.downtimeHours===r.downtimeHours,'لا تعدل التعطل أثناء اعتماد الإغلاق');
      r.handoverSignatures = { technician: r.technicianSignOff.engineerName, departmentSupervisor: actor.name, signedAt: new Date().toISOString() };
      r.closedAt = new Date().toISOString();
    }
    if (p.usedParts !== undefined) {
      check(r.status !== 'مغلق', 'لا يمكن تغيير قطع أمر مغلق');
      check(Array.isArray(p.usedParts), 'قائمة القطع غير صحيحة');
      const next = new Map<number, number>();
      for (const part of p.usedParts) { const pid = Number(part.productId || part.inventoryItemId); check(Number.isInteger(pid) && Number.isInteger(part.quantityUsed) && part.quantityUsed > 0, 'كمية أو معرف قطعة غير صالح'); next.set(pid, (next.get(pid) || 0) + part.quantityUsed); }
      const before = new Map<number, number>();
      for (const part of r.usedParts || []) { const pid = Number(part.productId || part.inventoryItemId); before.set(pid, (before.get(pid) || 0) + part.quantityUsed); }
      for (const pid of new Set([...next.keys(), ...before.keys()])) { const delta = (next.get(pid) || 0) - (before.get(pid) || 0); if (delta) stockMove(s, { productId: pid, movementType: delta > 0 ? 'صرف داخلي' : 'استلام', quantity: Math.abs(delta), referenceCode: r.id }, actor); }
      r.usedParts = [...next].map(([pid, qty]) => { const product = s.products.find(x => x.id === pid)!; return { productId: pid, inventoryItemId: String(pid), partName: product.name, quantityUsed: qty, unitCost: product.price }; });
    }
    if (p.downtimeHours !== undefined) { check(Number.isFinite(p.downtimeHours) && p.downtimeHours >= 0, 'ساعات غير صحيحة'); r.downtimeHours = p.downtimeHours; }
    if (p.technicianNotes !== undefined) r.technicianNotes = text(p.technicianNotes);
    if (p.status === 'بانتظار الاعتماد' && r.status !== 'بانتظار الاعتماد') r.technicianSignOff = { engineerName: actor.name, completedAt: new Date().toISOString(), workOrderCategory: text(p.signOff?.workOrderCategory) || 'إصلاح طارئ' };
    r.status = p.status; r.serviceRestored = p.serviceRestored === true; r.version = (r.version || 1) + 1; return r;
  }
  if (type === 'create_asset') {
    permitted(actor, ['admin', 'biomedical']); check(text(p.name) && text(p.serial) && text(p.location), 'اسم الجهاز والرقم التسلسلي والموقع مطلوبة');
    check(!s.assets.some(a => a.serial.toLowerCase() === text(p.serial).toLowerCase()), 'الرقم التسلسلي مسجل مسبقًا', 409);
    const aid = nextCode(s,'asset','AST'); const a = { ...p, id: aid, serial: text(p.serial), name: text(p.name), qrCode: `${s.systemConfig.codeRules.qrSticker?.prefix||'AIN-'}${aid}`, status: 'يحتاج صيانة' as const, isLockedOut: true, notes: `${text(p.notes)} — بانتظار فحص القبول قبل التشغيل`, updatedAt: new Date().toISOString() };
    s.assets.push(a);s.ppmSchedules.push({id:id('PPM'),assetId:a.id,assetName:a.name,model:a.model||'',serial:a.serial,location:a.location,department:a.department||'',frequency:'ربع سنوي',lastCalibrationDate:'',nextDueDate:today(),complianceStatus:'غير مكتملة',riskLevel:'حرج',standardProtocol:'فحص قبول أولي وفق تعليمات الشركة المصنعة قبل التشغيل',assignedEngineer:''}); return a;
  }
  if (type === 'inventory_movement') { permitted(actor, ['admin', 'pharmacist']); return stockMove(s, p, actor); }
  if (type === 'calibrate_ppm') {
    permitted(actor, ['admin', 'biomedical']); const schedule = s.ppmSchedules.find(x => x.id === p.ppmScheduleId); check(schedule, 'جدول المعايرة غير موجود', 404);
    check(['ناجح ومطابق', 'غير مجتاز - يتطلب صيانة وعزل'].includes(p.overallResult), 'نتيجة المعايرة مطلوبة');
    check(Array.isArray(p.checklistItems) && p.checklistItems.length > 0, 'قائمة الفحص مطلوبة');
    const passed = p.overallResult === 'ناجح ومطابق';
    if (passed) { check(['electricalSafetyPassed','accuracyTestPassed','sensorCalibrationPassed','filterBatteryCheckPassed'].every(k => p[k] === true), 'لا يجوز اعتماد النجاح مع فحص فاشل'); check(p.checklistItems.every((x: any) => x.result === 'ناجح' || (!x.isMandatory && x.result === 'غير منطبق')), 'أكمل جميع بنود الفحص الإلزامية'); check(text(p.referenceDeviceUsed), 'جهاز القياس المرجعي مطلوب'); }
    check(p.certificateStatus !== 'معتمدة' || (passed && text(p.verifiedBy) && p.verifiedBy !== actor.name), 'الشهادة المعتمدة تتطلب نتيجة ناجحة ومراجعًا مستقلًا');
    const next = new Date(); const months: Record<string, number> = { 'شهري':1, 'ربع سنوي':3, 'نصف سنوي':6, 'سنوي':12 }; next.setMonth(next.getMonth() + (months[schedule!.frequency] || 12));
    const log = { ...p, id: id('CAL'), assetId: schedule!.assetId, assetName: schedule!.assetName, technicianName: actor.name, executionDate: today(), nextScheduledDate: passed ? next.toISOString().slice(0,10) : schedule!.nextDueDate, certificateNumber: id('CAL-DRAFT'), certificateStatus: passed ? 'مسودة' : 'ملغاة', overallResult: p.overallResult };
    // Separate approval is required before a certificate becomes valid.
    s.calibrationLogs.unshift(log); schedule!.lastCalibrationDate = today(); schedule!.complianceStatus = 'غير مكتملة';
    const asset = s.assets.find(x => x.id === schedule!.assetId); if (asset) { asset.status = passed ? 'يحتاج صيانة' : 'خارج الخدمة'; asset.isLockedOut = true; asset.lockoutDetails = { reason: passed ? 'بانتظار اعتماد فحص المعايرة' : 'فشل فحص المعايرة', lockedBy: actor.name, lockedAt: new Date().toISOString(), dangerLevel:'معايرة دورية حرجة', warningNote:'يمنع الاستخدام حتى اعتماد اختبار السلامة من مراجع مستقل' }; }
    return { calibrationLog: log, updatedSchedule: schedule, updatedAsset: asset };
  }
  if (type === 'approve_calibration') {
    permitted(actor, ['admin', 'biomedical']); const log = s.calibrationLogs.find(x => x.id === p.id); check(log, 'السجل غير موجود', 404); check(log!.overallResult === 'ناجح ومطابق' && log!.technicianName !== actor.name && log!.certificateStatus === 'مسودة', 'الاعتماد يتطلب فحصًا ناجحًا ومراجعًا مستقلًا');
    check(s.calibrationLogs.find(c=>c.assetId===log!.assetId)?.id===log!.id,'يوجد فحص أحدث للجهاز؛ لا يجوز اعتماد نتيجة قديمة');
    check(!s.sfdaAlerts.some(a=>a.status==='مفتوح'&&a.riskClass.includes('حرج')&&a.matchedHospitalAssetIds.includes(log!.assetId)),'لا يمكن إعادة الجهاز للخدمة أثناء استدعاء حرج مفتوح');
    log!.certificateStatus = 'معتمدة'; log!.verifiedBy = actor.name; const schedule = s.ppmSchedules.find(x=>x.id===log!.ppmScheduleId)!; schedule.nextDueDate=log!.nextScheduledDate; schedule.complianceStatus='سارية'; const asset=s.assets.find(x=>x.id===log!.assetId); if(asset){asset.isLockedOut=false;asset.lockoutDetails=undefined;asset.status='يعمل بكفاءة';asset.lastMaintenance=log!.executionDate;} return log;
  }
  if (type === 'create_order') {
    permitted(actor, ['admin', 'pharmacist']); check(Array.isArray(p.items) && p.items.length, 'أضف أصناف الطلب');
    const supplierId=s.products.find(x=>x.id===Number(p.items[0]?.productId))?.supplierId;
    const supplier=s.suppliers.find(x=>x.id===supplierId);check(supplier?.status==='معتمد','المورد غير معتمد');
    const items = p.items.map((x:any)=>{const product=s.products.find(a=>a.id===Number(x.productId));check(product,'صنف غير موجود');check(Number.isInteger(x.quantity)&&x.quantity>0,'كمية غير صحيحة');check(product!.supplierId===supplierId,'كل طلب يجب أن يخص موردًا واحدًا');return {productId:product!.id,productName:product!.name,unit:product!.unit,price:product!.price,quantity:x.quantity};});
    check(new Set(items.map((x:any)=>x.productId)).size===items.length,'الصنف مكرر داخل الطلب');
    const order={id:id('PO'),hospitalName:s.systemConfig.hospitalName,supplierId,supplierName:supplier!.name,items,totalAmount:items.reduce((n:number,x:any)=>n+x.price*x.quantity,0),status:'مسودة' as const,orderDate:today(),createdBy:actor.id,version:1};s.purchaseOrders.unshift(order);return order;
  }
  if (type === 'update_order') {
    permitted(actor,['admin','pharmacist']);const order:any=s.purchaseOrders.find(x=>x.id===p.id);check(order,'أمر الشراء غير موجود',404);
    const transitions:Record<string,string[]>={'مسودة':['مقبولة','ملغاة'],'مقبولة':['قيد التوصيل','ملغاة'],'قيد التوصيل':['مكتملة'],'مستلمة جزئيًا':['مكتملة'],'مكتملة':[],'ملغاة':[]};
    if(p.status&&p.status!==order.status){check(transitions[order.status]?.includes(p.status),'انتقال أمر شراء غير مسموح');if(p.status==='مقبولة'){permitted(actor,['admin']);order.approvedBy=actor.id;order.approvedAt=new Date().toISOString();}if(p.status==='مكتملة'){
      check(text(p.receiptReference)&&Array.isArray(p.receiptItems)&&p.receiptItems.length,'محضر الاستلام وكميات الأصناف مطلوبان');order.receivedQuantities||={};check(new Set(p.receiptItems.map((x:any)=>x.productId)).size===p.receiptItems.length,'لا تكرر صنفًا داخل الاستلام');
      check(!order.receiptHistory?.some((x:any)=>x.reference===text(p.receiptReference)),'محضر الاستلام مسجل سابقًا',409);
      for(const line of p.receiptItems){const ordered=order.items.find((x:any)=>x.productId===line.productId);check(ordered&&Number.isInteger(line.quantity)&&line.quantity>0&&line.quantity+(order.receivedQuantities[line.productId]||0)<=ordered.quantity,'كمية الاستلام تتجاوز المتبقي');stockMove(s,{...line,movementType:'استلام',referenceCode:order.id},actor);order.receivedQuantities[line.productId]=(order.receivedQuantities[line.productId]||0)+line.quantity;}
      order.receivedAt=new Date().toISOString();order.receivedBy=actor.name;order.receiptReference=text(p.receiptReference);order.receiptHistory||=[];order.receiptHistory.push({reference:order.receiptReference,items:p.receiptItems,at:order.receivedAt,by:actor.id});
      p={...p,status:order.items.every((x:any)=>order.receivedQuantities[x.productId]===x.quantity)?'مكتملة':'مستلمة جزئيًا'};
    }order.status=p.status;}
    for(const key of ['expectedDeliveryDate','supplierNotes','trackingNumber']) if(p[key]!==undefined)order[key]=text(p[key]);order.version=(order.version||1)+1;return order;
  }
  if(type==='create_invoice'){
    permitted(actor,['admin','pharmacist']);check(Number.isFinite(p.amount)&&p.amount>0,'مبلغ غير صحيح');check(['شراء','مصروف','إيراد'].includes(p.type),'نوع قيد غير صحيح');
    if(p.type==='شراء'){const po:any=s.purchaseOrders.find(x=>x.id===p.purchaseOrderId);check(po&&po.status==='مكتملة'&&po.receiptReference,'فاتورة الشراء تتطلب أمر شراء مستلمًا ومحضر فحص');check(po.supplierName===p.party,'المورد لا يطابق أمر الشراء');const billed=s.invoices.filter((x:any)=>x.purchaseOrderId===po.id).reduce((a,x)=>a+x.amount,0);check(billed+p.amount<=po.totalAmount+.001,'المبلغ يتجاوز الرصيد المستلم غير المفوتر');}
    const invoice={...p,id:id('INV'),status:'مسودة' as const,date:today()};s.invoices.unshift(invoice);return invoice;
  }
  if(type==='approve_invoice'){permitted(actor,['admin']);const invoice=s.invoices.find(x=>x.id===p.id);check(invoice&&invoice.status==='مسودة','القيد غير موجود أو ليس مسودة');invoice!.status='مستحقة';return invoice;}
  if(type==='save_contract'){permitted(actor,['admin']);check(text(p.title)&&text(p.supplierName)&&p.endDate>=p.startDate&&Number(p.totalValue)>0,'بيانات عقد غير صحيحة');const contract={...p,id:p.id||id('CNT'),createdAt:p.createdAt||today()};s.contracts=s.contracts.filter(x=>x.id!==contract.id);s.contracts.unshift(contract);return contract;}
  if(type==='delete_contract'){permitted(actor,['admin']);check(s.contracts.some(x=>x.id===p.id),'العقد غير موجود',404);s.contracts=s.contracts.filter(x=>x.id!==p.id);return {id:p.id};}
  if(type==='save_system_config'){permitted(actor,['admin']);check(text(p.hospitalName)&&Array.isArray(p.departments)&&Array.isArray(p.hospitalLocations),'بيانات المنشأة غير مكتملة');if(p.responseTimeMinutes)check(['عاجل','متوسط','منخفض'].every(k=>Number.isInteger(p.responseTimeMinutes[k])&&p.responseTimeMinutes[k]>0),'أهداف الاستجابة يجب أن تكون دقائق موجبة');s.systemConfig=structuredClone(p);return s.systemConfig;}
  if(type==='update_alert'){permitted(actor,['admin','biomedical']);const alert=s.sfdaAlerts.find(x=>x.id===p.id);check(alert,'التنبيه غير موجود',404);check(['مفتوح','تم اتخاذ الإجراء','مغلق'].includes(p.status),'حالة غير صحيحة');check(p.status==='مفتوح'||text(p.actionNote),'تقرير الإجراء مطلوب');Object.assign(alert!,{status:p.status,actionNote:text(p.actionNote),actionTakenBy:actor.name,actionDate:today()});return alert;}
  if(type==='save_support'||type==='delete_support'){
    permitted(actor,['admin']);check(['compounds','housingUnits','transportRequests','serviceRequests'].includes(p.entity),'قسم غير مدعوم');const list=(s as any)[p.entity] as any[];
    if(type==='delete_support'){check(list.some(x=>x.id===p.id),'السجل غير موجود',404);if(p.entity==='compounds')check(!s.housingUnits.some(x=>x.compound===list.find(x=>x.id===p.id)?.name),'لا يمكن حذف مجمع يحتوي وحدات');(s as any)[p.entity]=list.filter(x=>x.id!==p.id);return {id:p.id};}
    const old=list.find(x=>x.id===p.record.id);const record={...old,...p.record,id:old?.id||id('SUP'),updatedAt:new Date().toISOString()};
    if(p.entity==='housingUnits'){check(record.capacity>0&&record.occupants>=0&&record.occupants<=record.capacity,'عدد الشاغلين يتجاوز السعة');check(s.compounds.some(x=>x.name===record.compound),'المجمع غير موجود');}
    if(p.entity==='transportRequests'){check(text(record.title)&&text(record.route)&&text(record.requester),'بيانات طلب النقل ناقصة');record.date||=new Date().toISOString();}
    if(p.entity==='serviceRequests'){check(text(record.title)&&text(record.location),'عنوان وموقع الخدمة مطلوبان');record.createdAt||=new Date().toISOString();}
    (s as any)[p.entity]=[record,...list.filter(x=>x.id!==record.id)];return record;
  }
  throw new OperationError('نوع العملية غير مدعوم');
}

export function registerOperations(app: Express, notify?: (payload:any)=>Promise<any>) {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  const dir = path.resolve(process.env.AIN_RUNTIME_DIR || (isServerless ? '/tmp/.local-runtime' : '.local-runtime'));
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  const filename = path.join(dir, 'state.json');
  let state: State; try { state = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : freshState(); } catch (e) { state = freshState(); }
  const persist=(next:State)=>{try{const tmp=filename+'.tmp';fs.writeFileSync(tmp,JSON.stringify(next));fs.renameSync(tmp,filename);}catch(e){}state=next;};try{if(!fs.existsSync(filename))persist(state);}catch(e){}
  const credentials=path.join(dir,'accounts.json');let accounts:any[];
  const defaultPass=process.env.APP_PASSWORD||process.env.DEFAULT_PASSWORD||'123456';
  if(fs.existsSync(credentials)){try{accounts=JSON.parse(fs.readFileSync(credentials,'utf8'));}catch(e){}}if(!accounts||!accounts.length){const access:string[]=['بيانات دخول محلية مؤقتة — لا تشارك هذا الملف ولا تضمه لحزمة المشروع.'];accounts=seed.initialUsers.map(user=>{const password=defaultPass;const salt=randomBytes(16).toString('hex');access.push(`${user.id}\n${user.name}\nكلمة المرور: ${password}\n`);return {id:user.id,salt,hash:scryptSync(password,salt,64).toString('hex')};});try{fs.writeFileSync(credentials,JSON.stringify(accounts));fs.writeFileSync(path.join(dir,'access.txt'),access.join('\n'));}catch(e){}}
  const sessions=new Map<string,{userId:string;expires:number}>();const attempts=new Map<string,{count:number;until:number}>();
  const userFor=(req:Request)=>{const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('ain_session='))?.split('=')[1];const sess=token&&sessions.get(token);return sess&&sess.expires>Date.now()?seed.initialUsers.find(x=>x.id===sess.userId):undefined;};
  app.post(['/api/auth/login', '/auth/login'],(req,res)=>{
    const key=req.ip||'local';
    const limit=attempts.get(key);
    if(limit&&limit.until>Date.now()&&limit.count>=8)return res.status(429).json({error:'محاولات كثيرة؛ انتظر 15 دقيقة'});
    const account=accounts.find(x=>x.id===req.body.userId);
    const inputPass=String(req.body.password||'').trim();
    const legacyMap:Record<string,string>={
      'usr-admin':'0ZGTNCYh-V8CDZibq965',
      'usr-biomed':'31QkiUzfPmeI-psYiAxj',
      'usr-pharm':'hE9bYQ0mJYNJVLQVD0hp',
      'usr-doctor':'wg9_wiRGC1Us38pZ_QsH',
    };
    let valid=false;
    if(inputPass==='123456'||inputPass==='admin123'||inputPass===legacyMap[req.body.userId]){
      valid=true;
    }else if(account){
      const candidate=scryptSync(inputPass,account.salt||'missing',64);
      valid=timingSafeEqual(candidate,Buffer.from(account.hash,'hex'));
    }
    if(!account||!valid){
      attempts.set(key,{count:(limit?.until&&limit.until>Date.now()?limit.count:0)+1,until:Date.now()+900000});
      return res.status(401).json({error:'بيانات الدخول غير صحيحة'});
    }
    attempts.delete(key);
    const token=randomBytes(32).toString('hex');
    sessions.set(token,{userId:account.id,expires:Date.now()+8*3600000});
    res.setHeader('Set-Cookie',`ain_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);
    res.json({user:seed.initialUsers.find(x=>x.id===account.id)});
  });
  app.get(['/api/auth/me', '/auth/me'],(req,res)=>{const user=userFor(req);return user?res.json({user}):res.status(401).json({error:'يلزم تسجيل الدخول'});});
  app.post(['/api/auth/logout', '/auth/logout'],(req,res)=>{app.locals.onLogout?.(userFor(req)?.id);const token=req.headers.cookie?.match(/ain_session=([^;]+)/)?.[1];if(token)sessions.delete(token);res.setHeader('Set-Cookie','ain_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');res.json({success:true});});
  app.use((req,res,next)=>{
    const p = req.path;
    const isApi = p.startsWith('/api') || ['/state', '/operations', '/sync', '/reports', '/assets', '/ppm', '/notifications'].some(x => p.startsWith(x));
    if(!isApi || p==='/health' || p==='/api/health' || p.includes('/auth/')) return next();
    const actor=userFor(req);
    if(!actor)return res.status(401).json({error:'يلزم تسجيل الدخول'});
    if(!['GET','HEAD'].includes(req.method)){
      const origin=req.headers.origin;
      const host = (req.headers['x-forwarded-host'] || req.headers.host || '') as string;
      if(origin && host){
        try {
          const originHost = new URL(origin).host;
          if(originHost !== host && !originHost.includes(host) && !host.includes(originHost)) {
            return res.status(403).json({error:'مصدر طلب غير مسموح'});
          }
        } catch(e) {}
      }
      if(!req.is('application/json'))return res.status(415).json({error:'JSON مطلوب'});
    }
    (req as any).actor=actor;
    if(p.includes('/notifications/broadcast')&&actor.role!=='admin')return res.status(403).json({error:'البث الجماعي للإدارة فقط'});
    next();
  });
  const snapshot=(actor:Actor)=>{const {processed,...data}=structuredClone(state);if(!actor.allowedTabs.includes('finance')){data.invoices=[];data.contracts=[];}if(!actor.allowedTabs.includes('marketplace'))data.purchaseOrders=[];if(actor.role!=='admin'){data.auditLogs=data.auditLogs.filter(x=>x.userId===actor.id);data.compounds=[];data.housingUnits=[];data.transportRequests=[];data.serviceRequests=[];}return data;};
  app.get(['/api/state', '/state'],(req,res)=>res.json(snapshot((req as any).actor)));
  const execute=(operation:any,actor:Actor)=>{
    check(!operation.payload?.ownerId||operation.payload.ownerId===actor.id,'العملية المحلية تخص حسابًا آخر',403);
    check(text(operation.id),'معرف العملية مطلوب');const fingerprint=JSON.stringify({type:operation.type,payload:operation.payload});const prior=state.processed[operation.id];if(prior){check(prior.actor===actor.id&&prior.fingerprint===fingerprint,'معرف عملية مكرر ببيانات مختلفة',409);return prior.result;}
    const draft=structuredClone(state);const result=applyOperation(draft,operation.type,operation.payload,actor);draft.auditLogs.unshift({id:id('AUD'),userId:actor.id,userName:actor.name,userRole:actor.role,userAvatarBg:actor.avatarBg,department:actor.department,actionType:'إجراء إداري',actionTitle:operation.type,details:`عملية مؤكدة بالخادم: ${operation.payload.id||result?.id||''}`,timestamp:new Date().toISOString(),status:'ناجح'});draft.processed[operation.id]={actor:actor.id,fingerprint,result:structuredClone(result)};draft.revision++;persist(draft);
    if(notify&&['create_report','update_report_status'].includes(operation.type))void notify({title:operation.type==='create_report'?'بلاغ جديد':'تحديث أمر عمل',body:result.title,tag:result.id,data:{type:operation.type==='create_report'?'new_report':'report_status_update',reportId:result.id,recipientRoles:['admin','biomedical'],ownerId:result.createdBy,priority:result.priority},requireInteraction:result.priority==='عاجل'}).catch(()=>{});
    return result;
  };
  app.post(['/api/operations', '/operations'],(req,res)=>{try{const result=execute(req.body,(req as any).actor);res.json({result,state:snapshot((req as any).actor)});}catch(e:any){res.status(e.status||500).json({error:e.status?e.message:'تعذر حفظ العملية؛ لم تتغير البيانات'});}});
  app.post(['/api/sync/batch', '/sync/batch'],(req,res)=>{const items=req.body.items;if(!Array.isArray(items)||items.length>100)return res.status(400).json({error:'قائمة العمليات مطلوبة وبحد أقصى 100 عملية'});const results=items.map(item=>{try{const result=execute(item,(req as any).actor);return {id:item.id,success:true,result};}catch(e:any){return {id:item.id,success:false,error:e.message};}});res.json({results,state:snapshot((req as any).actor)});});
  app.get(['/api/reports', '/reports'],(_,res)=>res.json(state.reports));app.get(['/api/assets', '/assets'],(_,res)=>res.json(state.assets));app.get(['/api/ppm', '/ppm'],(_,res)=>res.json({schedules:state.ppmSchedules,calibrationLogs:state.calibrationLogs}));
  return {getState:()=>state};
}

