import { initialUsers } from "../data/initialData";
import React, { useState } from "react";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Building2,
  Wrench,
  Package,
  Plus,
  Trash2,
  FileCheck2,
  Timer,
} from "lucide-react";
import { Report, ReportStatus, Asset, InventoryItem, UsedPartItem, UserProfile } from "../types";

export interface ReportDetailContentProps {
  report: Report;
  currentUser?: UserProfile;
  assets: Asset[];
  inventory?: InventoryItem[];
  onClose?: () => void;
  onUpdateStatus: (
    id: string,
    newStatus: ReportStatus,
    notes?: string,
    downtimeHours?: number,
    usedParts?: UsedPartItem[],
    signOff?: Report["technicianSignOff"],
    serviceRestored?: boolean,
    assignedTo?: string,
    expectedVersion?: number
  ) => Promise<boolean> | void;
  onOpenAsset: (asset: Asset) => void;
  isTabMode?: boolean;
}

export const ReportDetailContent: React.FC<ReportDetailContentProps> = ({
  report,
  currentUser,
  assets,
  inventory = [],
  onClose,
  onUpdateStatus,
  onOpenAsset,
  isTabMode = false,
}) => {
  const [notes, setNotes] = useState(report.technicianNotes || "");
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(report.status);
  const [downtime, setDowntime] = useState<number>(report.downtimeHours ?? 0);
  const [usedParts, setUsedParts] = useState<UsedPartItem[]>(report.usedParts || []);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [partQty, setPartQty] = useState<number>(1);
  const [engineerName, setEngineerName] = useState<string>(
    report.technicianSignOff?.engineerName || currentUser?.name || ""
  );
  const [workType, setWorkType] = useState<string>(report.technicianSignOff?.workOrderCategory || "إصلاح طارئ");
  const [assignedTo,setAssignedTo]=useState(report.assignedTo||"");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [serviceRestored,setServiceRestored]=useState(report.serviceRestored || false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  const linkedAsset = report.assetId ? assets.find((a) => a.id === report.assetId) : null;

  const handleAddPart = () => {
    if (!selectedInventoryId) return;
    const invItem = inventory.find((i) => i.id === selectedInventoryId);
    if (!invItem) return;
    if(!Number.isInteger(partQty)||partQty<=0){setError("أدخل كمية صحيحة موجبة");return;}
    const already=usedParts.find(p=>p.inventoryItemId===invItem.id)?.quantityUsed||0;
    if(partQty+already>(invItem.stock||0)+(report.usedParts?.find(p=>p.inventoryItemId===invItem.id)?.quantityUsed||0)){setError("الكمية تتجاوز الرصيد");return;}

    const existingIndex = usedParts.findIndex((p) => p.inventoryItemId === invItem.id);
    if (existingIndex >= 0) {
      const updated = [...usedParts];
      updated[existingIndex].quantityUsed += Number(partQty);
      setUsedParts(updated);
    } else {
      const newPart: UsedPartItem = {
        inventoryItemId: invItem.id,
        partName: invItem.name,
        partNumber: invItem.partNumber,
        quantityUsed: Number(partQty),
        unitCost: invItem.unitPrice,
      };
      setUsedParts([...usedParts, newPart]);
    }
    setSelectedInventoryId("");
    setPartQty(1);
  };

  const handleRemovePart = (index: number) => {
    setUsedParts(usedParts.filter((_, i) => i !== index));
  };

  const totalPartsCost = usedParts.reduce(
    (sum, p) => sum + p.quantityUsed * p.unitCost,
    0
  );

  const handleSave = async () => {
    setError("");if(["بانتظار الاعتماد","مغلق"].includes(selectedStatus)&&(!notes.trim()||!serviceRestored)){setError("أكمل تقرير الإنجاز وأكد اختبار استعادة الخدمة");return;}
    setSaving(true);try {
    const signOff: Report["technicianSignOff"] = {
      engineerName: engineerName || "مهندس أجهزة طبية",
      completedAt: new Date().toISOString().split("T")[0],
      workOrderCategory: workType,
    };

    const saved = await onUpdateStatus(
      report.id,
      selectedStatus,
      notes,
      downtime,
      usedParts,
      ["بانتظار الاعتماد","مغلق"].includes(selectedStatus) ? signOff : report.technicianSignOff,
      serviceRestored,
      assignedTo||undefined,
      report.version||1
    );
    if(saved===false){setError("لم تحفظ العملية؛ راجع رسالة النظام وحاول بعد التصحيح");return;}

    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);

    if (onClose && !isTabMode) {
      onClose();
    }
    } finally {setSaving(false);}
  };

  return (
    <div className="space-y-4 text-xs">
      {error&&<p role="alert" className="text-red-700 bg-red-50 p-3 rounded-xl">{error}</p>}
      {currentUser?.role==="admin"&&<label className="block">إسناد أمر العمل<select className="w-full p-3 border rounded-xl" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}><option value="">إسناد تلقائي عند بدء العمل</option>{initialUsers.filter(u=>["admin","biomedical"].includes(u.role)).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}
      <p className="text-sm">التنفيذ ← إرسال للمراجعة ← اعتماد مراجع مستقل. صرف القطع يتم عند تأكيد الحفظ.</p>
      <label className="flex gap-2 items-center"><input type="checkbox" checked={serviceRestored} onChange={e=>setServiceRestored(e.target.checked)} />أؤكد إجراء اختبار استعادة الخدمة بنجاح</label>
      {/* Title & metadata bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#E1EBE8] dark:border-[#1F423E]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-black bg-[#E9F5F2] dark:bg-[#1D3C38] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md">
              {report.id}
            </span>
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">{report.category}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                report.priority === "عاجل"
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
                  : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              أولوية {report.priority}
            </span>
          </div>
          <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4] mt-1.5">{report.title}</h3>
          <div className="flex items-center gap-3 text-[#788C88] dark:text-[#9DBBB4] mt-1 text-[11px] flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
              {report.location}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(report.createdAt).toLocaleString("ar-SA")}
            </span>
          </div>
        </div>

        {isSavedRecently && (
          <div className="flex items-center gap-1.5 text-xs text-[#2B7A3D] font-bold bg-[#E5F5E8] dark:bg-[#1E432A] px-3 py-1.5 rounded-xl self-start sm:self-center animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم حفظ التحديثات بنجاح</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="p-3.5 bg-white dark:bg-[#122624] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-1">
        <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">وصف البلاغ:</span>
        <p className="text-xs text-[#45615D] dark:text-[#C4D9D4] leading-relaxed">{report.description}</p>
      </div>

      {/* Image if present */}
      {report.imageUri && (
        <div className="rounded-2xl overflow-hidden border border-[#DCE8E5] dark:border-[#1F423E] max-h-56 bg-black/5 flex items-center justify-center">
          <img src={report.imageUri} alt="مرفق البلاغ" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Linked Asset */}
      {linkedAsset && (
        <div className="p-3.5 bg-[#E9F5F2] dark:bg-[#152F2B] rounded-2xl border border-[#CDE5DF] dark:border-[#1F4C45] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#126B68] text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#0C756C] dark:text-[#4ECDC4] font-bold block">
                الجهاز الطبي المرتبط:
              </span>
              <span className="text-xs font-extrabold text-[#193B3A] dark:text-[#EDF7F4]">
                {linkedAsset.name} ({linkedAsset.id})
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpenAsset(linkedAsset)}
            className="text-xs font-bold text-[#126B68] dark:text-[#4ECDC4] bg-white dark:bg-[#1A3833] px-3 py-1.5 rounded-lg border border-[#CDE5DF] dark:border-[#285750] hover:bg-[#DDF4F0] cursor-pointer"
          >
            معاينة الجهاز
          </button>
        </div>
      )}

      {/* Technician Action Section */}
      <div className="p-4 bg-[#F9FBFA] dark:bg-[#152E2B] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4]" />
            <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">
              إجراءات الفريق الهندسي والفني
            </span>
          </div>
          <span className="text-[10px] text-[#6B8581] dark:text-[#9DBBB4] font-bold">
            أمر عمل #WO-{report.id}
          </span>
        </div>

        {/* Status Selector */}
        <div className="space-y-1">
          <label className="font-bold text-[#526B66] dark:text-[#9DBBB4] block">حالة البلاغ:</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["جديد", "قيد المعالجة", "بانتظار الاعتماد", ...(currentUser?.role === "admin" ? ["مغلق"] : [])] as ReportStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedStatus === st
                    ? st === "جديد"
                      ? "bg-[#FFF2D6] text-[#B86B00] border-[#F4DCAB]"
                      : st === "قيد المعالجة"
                      ? "bg-[#126B68] text-white border-[#126B68]"
                      : "bg-[#2B7A3D] text-white border-[#2B7A3D]"
                    : "bg-white dark:bg-[#183633] text-[#526B66] dark:text-[#9DBBB4] border-[#DCE8E5] dark:border-[#1F423E] hover:bg-gray-50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Downtime Hours Field */}
        <div className="flex items-center justify-between bg-white dark:bg-[#183633] p-2.5 rounded-xl border border-[#DCE8E5] dark:border-[#1F423E]">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">
              ساعات توقف الجهاز (Downtime):
            </span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              step="0.5"
              value={downtime}
              onChange={(e) => setDowntime(parseFloat(e.target.value) || 0)}
              className="w-16 bg-[#F6FAF8] dark:bg-[#122624] border border-[#DCE8E5] dark:border-[#244C47] rounded-lg p-1 text-center font-bold text-[#193B3A] dark:text-[#EDF7F4]"
            />
            <span className="text-[#556E69] dark:text-[#9DBBB4] font-bold">ساعة</span>
          </div>
        </div>

        {/* Spare Parts Consumption Section */}
        <div className="space-y-2 border-t border-[#EDF4F2] dark:border-[#1E3F3B] pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#193B3A] dark:text-[#EDF7F4]">
              <Package className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4]" />
              <span>قطع الغيار المستهلكة في أمر الإصلاح:</span>
            </div>
            {totalPartsCost > 0 && (
              <span className="font-bold text-[11px] text-[#126B68] dark:text-[#4ECDC4]">
                إجمالي التكلفة: {totalPartsCost.toLocaleString()} ر.س
              </span>
            )}
          </div>

          {/* Add Part Picker */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedInventoryId}
              onChange={(e) => setSelectedInventoryId(e.target.value)}
              className="flex-1 bg-white dark:bg-[#183633] border border-[#DCE8E5] dark:border-[#1F423E] rounded-xl p-2 text-[11px] text-[#193B3A] dark:text-[#EDF7F4]"
            >
              <option value="">-- اختر قطعة غيار من المخزون الطبي --</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.partNumber}) - متوفر: {item.stock} - {item.unitPrice} ر.س
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="50"
              value={partQty}
              onChange={(e) => setPartQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 bg-white dark:bg-[#183633] border border-[#DCE8E5] dark:border-[#1F423E] rounded-xl p-2 text-center text-[11px] font-bold text-[#193B3A] dark:text-[#EDF7F4]"
              title="الكمية"
            />
            <button
              type="button"
              onClick={handleAddPart}
              disabled={!selectedInventoryId}
              className="p-2 bg-[#126B68] hover:bg-[#0d5553] disabled:opacity-40 text-white rounded-xl cursor-pointer"
              title="إضافة لأمر العمل — الخصم عند الحفظ"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Used Parts List */}
          {usedParts.length > 0 && (
            <div className="space-y-1 bg-white dark:bg-[#122624] p-2 rounded-xl border border-[#DCE8E5] dark:border-[#1F423E]">
              {usedParts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1 px-1.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0 text-[11px]"
                >
                  <div>
                    <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">{p.partName}</span>
                    <span className="text-[10px] text-gray-500 font-mono mr-1.5">({p.partNumber})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#E9F5F2] dark:bg-[#1E3F3B] text-[#126B68] dark:text-[#4ECDC4] px-1.5 py-0.5 rounded font-bold text-[10px]">
                      × {p.quantityUsed}
                    </span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 text-[10px]">
                      {p.quantityUsed * p.unitCost} ر.س
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Engineer Sign-Off Box */}
        <div className="space-y-2 border-t border-[#EDF4F2] dark:border-[#1E3F3B] pt-3">
          <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4] flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>اعتماد وتوقيع إغلاق أمر العمل (Sign-Off):</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">المهندس المنفّذ:</label>
              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                placeholder="م. فهد العتيبي"
                className="w-full bg-white dark:bg-[#183633] border border-[#DCE8E5] dark:border-[#1F423E] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#EDF7F4]"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">تصنيف التدخل:</label>
              <select
                value={workType}
                onChange={(e: any) => setWorkType(e.target.value)}
                className="w-full bg-white dark:bg-[#183633] border border-[#DCE8E5] dark:border-[#1F423E] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#EDF7F4]"
              >
                <option value="إصلاح طارئ">إصلاح طارئ</option>
                <option value="استبدال قطع غيار">استبدال قطع غيار</option>
                <option value="معايرة دورية">معايرة دورية</option>
                <option value="فحص أمان">فحص أمان كهربائي</option>
              </select>
            </div>
          </div>
        </div>

        {/* Technician Notes */}
        <div className="space-y-1">
          <label className="font-bold text-[#526B66] dark:text-[#9DBBB4] block">
            تقرير الإنجاز الفني والملاحظات:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="اكتب الإجراءات الميدانية المتخذة، القطع المستبدلة، أو التوصيات..."
            className="w-full bg-white dark:bg-[#183633] border border-[#DCE8E5] dark:border-[#1F423E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end gap-2">
        {onClose && !isTabMode && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#DCE8E5] dark:border-[#1F423E] text-[#526B66] dark:text-[#9DBBB4] font-bold cursor-pointer"
          >
            إغلاق
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
              disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>حفظ وتحديث أمر العمل</span>
        </button>
      </div>
    </div>
  );
};
