export type ReportStatus = "جديد" | "قيد المعالجة" | "بانتظار الاعتماد" | "مغلق";
export type ReportPriority = "عاجل" | "متوسط" | "منخفض";
export type AssetCriticality = "A - حفظ الحياة (Life Support)" | "B - تشخيص وتحليل حرج" | "C - أجهزة ومرافق عامة";

export interface LockoutDetails {
  reason: string;
  lockedBy: string;
  lockedAt: string;
  dangerLevel: "حظر كامل - خطر كهربائي/إشعاعي" | "خارج الخدمة بانتظار قطع غيار" | "معايرة دورية حرجة";
  warningNote: string;
  targetReleaseDate?: string;
}

export interface Asset {
  id: string;
  name: string;
  model: string;
  serial: string;
  location: string;
  vendor: string;
  qrCode: string;
  department: string;
  status: "يعمل بكفاءة" | "يحتاج صيانة" | "خارج الخدمة";
  imageUri?: string;
  updatedAt: string;
  lastMaintenance?: string;
  nextPpmDueDate?: string;
  notes?: string;
  // Professional HTM & CBAHI Enhancements
  criticality?: AssetCriticality;
  warrantyExpiry?: string;
  serviceContractVendor?: string;
  isLockedOut?: boolean;
  lockoutDetails?: LockoutDetails;
  mtbfDays?: number; // Mean Time Between Failures in Days
  mttrHours?: number; // Mean Time To Repair in Hours
  uptimeRate?: number; // % Operational Availability e.g. 98.5
}

export interface InventoryItem {
  id: string;
  name: string;
  partNumber?: string;
  unitPrice: number;
  category?: string;
  stock?: number;
}

export interface UsedPartItem {
  inventoryItemId?: string;
  productId?: number;
  partName?: string;
  partNumber?: string;
  productCode?: string;
  productName?: string;
  quantity?: number;
  quantityUsed: number;
  unitCost: number;
  unitPrice?: number;
  totalCost?: number;
  addedAt?: string;
}

export interface Report {
  responseDueAt?: string;
  version?: number;
  assignedTo?: string;
  assignedEngineer?: string;
  startedAt?: string;
  closedAt?: string;
  serviceRestored?: boolean;
  id: string;
  title: string;
  location: string;
  category: string;
  priority: ReportPriority;
  status: ReportStatus;
  description: string;
  imageUri?: string;
  createdAt: string;
  assetId?: string;
  technicianNotes?: string;
  // Professional HTM & CBAHI Enhancements
  usedParts?: UsedPartItem[];
  downtimeHours?: number;
  technicianSignOff?: {
    engineerName: string;
    completedAt: string;
    workOrderCategory: string;
  };
  handoverSignatures?: {
    technician: string;
    departmentSupervisor?: string;
    signedAt: string;
  };
}

export interface SfdaSafetyAlert {
  id: string;
  alertNumber: string;
  source: "SFDA / NCMDR" | "الشركة المصنعة" | "وزارة الصحة";
  issueDate: string;
  deviceName: string;
  affectedModels: string[];
  manufacturer: string;
  riskClass: "حرج (سحب فوري)" | "متوسط (تحديث برمجي)" | "منخفض (فحص وقائي)";
  actionRequired: string;
  status: "مفتوح" | "تم اتخاذ الإجراء" | "مغلق";
  matchedHospitalAssetIds: string[];
  actionNote?: string;
  actionTakenBy?: string;
  actionDate?: string;
  referenceUrl?: string;
}

export interface Product {
  batches?: { lotNumber: string; expiryDate: string; quantity: number }[];
  id: number;
  productCode: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  minStockAlert: number;
  supplierId: string;
  supplierName: string;
  approvalStatus: "معتمد" | "قيد المراجعة" | "مرفوض";
}

export interface InventoryMovement {
  lotNumber?: string;
  expiryDate?: string;
  id: string;
  productId: number;
  productName: string;
  movementType: "استلام" | "بيع" | "تعديل" | "حجز" | "إلغاء حجز" | "صرف داخلي";
  quantity: number;
  referenceCode?: string;
  notes?: string;
  timestamp: string;
  performedBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  status: "معتمد" | "قيد المراجعة";
  balance: number;
  ordersCount: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  branch: string;
  manager: string;
  stockAlerts: number;
  status: "نشطة" | "تحتاج مراجعة";
  phone: string;
}

export interface Invoice {
  purchaseOrderId?: string;
  id: string;
  party: string;
  type: "شراء" | "مصروف" | "إيراد";
  amount: number;
  status: "مدفوعة" | "مستحقة" | "مسودة";
  date: string;
  description?: string;
}

export type ContractStatus = "ساري" | "قريب الانتهاء" | "منتهي" | "معلق" | "مجدد";
export type ContractCategory =
  | "أجهزة طبية وصيانة"
  | "أدوية ومحاليل"
  | "مستلزمات جراحية"
  | "نظافة وتعقيم"
  | "غازات طبية وشبكات"
  | "تقنية ومعلومات (IT)"
  | "صيانة مرافق وبنية تحتية"
  | "أخرى";

export interface SupplierContract {
  id: string;
  contractNumber: string;
  title: string;
  supplierId?: string;
  supplierName: string;
  category: ContractCategory;
  startDate: string;
  endDate: string;
  totalValue: number;
  paymentTerms: "شهري" | "ربع سنوي" | "نصف سنوي" | "سنوي" | "دفعة واحدة" | "عند الإنجاز";
  status: ContractStatus;
  autoRenew: boolean;
  renewalAlertDays: number;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  scopeOfWork?: string;
  slaTerms?: string;
  penaltyTerms?: string;
  signedByHospital?: string;
  signedBySupplier?: string;
  notes?: string;
  createdAt: string;
  lastRenewedDate?: string;
}

export interface TransportRequest {
  id: string;
  title: string;
  requester: string;
  route: string;
  date: string;
  priority: "عاجل" | "مجدول" | "منخفض";
  status: "جديد" | "مخصص" | "مكتمل";
  driver?: string;
  passengers?: number;
}

export interface Compound {
  id: string;
  name: string;
  address: string;
  units: number;
  occupied: number;
  manager: string;
  phone?: string;
  status: "نشط" | "يحتاج متابعة" | "ممتلئ" | string;
  notes?: string;
}

export interface HousingUnit {
  id: string;
  compound: string;
  unit: string;
  type: "شقة" | "استوديو" | "فيلا" | "جناح أطباء" | "غرفة فردية" | string;
  occupants: number;
  capacity: number;
  status: "مشغولة" | "شاغرة" | "صيانة" | "محجوزة" | string;
  employee?: string;
  department?: string;
  phone?: string;
  monthlyRent?: number;
  notes?: string;
  updatedAt?: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  location: string;
  category: "نظافة" | "صيانة" | "أمن" | "تموين" | string;
  status: "جديد" | "قيد التنفيذ" | "مكتمل" | string;
  priority: "عاجل" | "عادي" | string;
  createdAt: string;
  notes?: string;
  assignedStaff?: string;
}

export interface CodeRuleConfig {
  key: string;
  name: string;
  prefix: string;
  suffix?: string;
  digits: number;
  currentSequence: number;
  rationale: string; // على أي أساس كُتب هذا الكود
  standardRef: string; // المرجع المعياري e.g. SFDA, CBAHI, ISO 55000, ZATCA
  example: string;
}

export interface SystemFlexibilityConfig {
  responseTimeMinutes?: Record<ReportPriority, number>;
  hospitalName: string;
  hospitalBranch: string;
  codeRules: {
    asset: CodeRuleConfig;
    report: CodeRuleConfig;
    purchaseOrder: CodeRuleConfig;
    calibration: CodeRuleConfig;
    housingUnit: CodeRuleConfig;
    qrSticker: CodeRuleConfig;
    invoice: CodeRuleConfig;
    contract: CodeRuleConfig;
    transport: CodeRuleConfig;
  };
  departments: string[];
  hospitalLocations: string[];
  reportCategories: string[];
  assetCategories: string[];
  assetStatuses: string[];
  housingUnitTypes: string[];
  housingStatuses: string[];
}

export type UserRole = "admin" | "biomedical" | "pharmacist" | "doctor";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatarBg: string;
  allowedTabs: string[];
  description: string;
  email?: string;
  badgeNumber?: string;
}

export type AuditActionType =
  | "إنشاء بلاغ"
  | "تحديث حالة بلاغ"
  | "حركة مخزون"
  | "أمر شراء"
  | "صيانة ومعايرة"
  | "تسجيل أصل"
  | "تبديل هوية"
  | "استشارة ذكية"
  | "إجراء إداري";

export interface UserAuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatarBg?: string;
  department?: string;
  actionType: AuditActionType;
  actionTitle: string;
  details: string;
  targetEntityId?: string;
  targetEntityType?: "report" | "asset" | "inventory" | "order" | "ppm" | "auth" | "general";
  timestamp: string;
  status: "ناجح" | "مكتمل" | "معتمد" | "قيد المتابعة" | "تنبيه";
  ipAddress?: string;
  deviceInfo?: string;
}

export type PpmComplianceStatus = "سارية" | "مستحقة قريباً" | "متأخرة" | "غير مكتملة";
export type PpmFrequency = "شهري" | "ربع سنوي" | "نصف سنوي" | "سنوي";
export type CalibrationItemResult = "ناجح" | "فاشل" | "غير منطبق";

export interface CalibrationCheckItem {
  id: string;
  name: string;
  standardRef: string;
  result: CalibrationItemResult;
  measuredValue?: string;
  unit?: string;
  acceptanceLimit?: string;
  notes?: string;
  isMandatory: boolean;
}

export interface PpmSchedule {
  id: string;
  assetId: string;
  assetName: string;
  department: string;
  model: string;
  serial?: string;
  location?: string;
  frequency: PpmFrequency;
  lastCalibrationDate: string;
  nextDueDate: string;
  complianceStatus: PpmComplianceStatus;
  riskLevel: "حرج" | "متوسط" | "منخفض";
  standardProtocol: string;
  assignedEngineer: string;
}

export interface CalibrationWorkOrder {
  id: string;
  ppmScheduleId: string;
  assetId: string;
  assetName: string;
  model?: string;
  department?: string;
  technicianName: string;
  technicianRole?: string;
  verifiedBy?: string;
  executionDate: string;
  referenceDeviceUsed?: string;
  electricalSafetyPassed: boolean;
  accuracyTestPassed: boolean;
  sensorCalibrationPassed: boolean;
  filterBatteryCheckPassed: boolean;
  overallResult: "ناجح ومطابق" | "غير مجتاز - يتطلب صيانة وعزل";
  certificateNumber?: string;
  certificateStatus: "معتمدة" | "ملغاة" | "مسودة";
  checklistItems?: CalibrationCheckItem[];
  notes?: string;
  nextScheduledDate: string;
}

export interface PurchaseOrder {
  supplierId?: string;
  receivedQuantities?: Record<number, number>;
  receiptReference?: string;
  receivedAt?: string;
  receivedBy?: string;
  approvedBy?: string;
  version?: number;
  id: string;
  hospitalName: string;
  supplierName: string;
  items: {
    productId: number;
    productName: string;
    unit: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: "مقبولة" | "قيد التوصيل" | "مكتملة" | "ملغاة" | "مسودة" | "مستلمة جزئيًا";
  orderDate: string;
  expectedDeliveryDate?: string;
  supplierNotes?: string;
  trackingNumber?: string;
  dispatchDate?: string;
  autoReplenished?: boolean;
}

export interface ManarMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  meta?: {
    confidence?: string;
    disclaimer?: string;
    emergency?: boolean;
    sources?: string[];
  };
}

export type SyncStatus = "synced" | "syncing" | "pending" | "offline";

export interface OfflineQueueItem {
  id: string;
  type:
    | "create_report"
    | "update_report_status"
    | "create_asset"
    | "calibrate_ppm"
    | "inventory_movement"
    | "auto_replenish";
  payload: any;
  timestamp: string;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
  error?: string;
  description: string;
}

export interface PushSubscriber {
  endpoint?: string;
  id: string;
  staffName?: string;
  role?: string;
  department?: string;
  device?: string;
  subscribedAt: string;
}

export interface PushNotificationLog {
  id: string;
  title: string;
  body: string;
  tag: string;
  type: string;
  sentAt: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
}

export interface PushNotificationPreferences {
  urgentReports: boolean;
  statusUpdates: boolean;
  lifeSupportAlerts: boolean;
  sfdaRecalls: boolean;
  soundEnabled: boolean;
}

