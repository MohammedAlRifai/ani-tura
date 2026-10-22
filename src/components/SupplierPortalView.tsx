import React, { useState, useMemo } from "react";
import {
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Search,
  Filter,
  Save,
  X,
  FileText,
  Boxes,
  Store,
  ChevronDown,
  CalendarClock,
  Phone,
  ShieldCheck,
  Package,
  RefreshCw,
} from "lucide-react";
import { Supplier, PurchaseOrder } from "../types";

export interface SupplierPortalViewProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onUpdateOrder: (
    orderId: string,
    updates: {
      expectedDeliveryDate?: string;
      status?: PurchaseOrder["status"];
      supplierNotes?: string;
      trackingNumber?: string;
    receiptReference?: string;
    receiptItems?: any[];
    }
  ) => Promise<boolean> | void;
  onBackToMarketplace?: () => void;
  initialSupplierId?: string;
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  suppliers,
  purchaseOrders,
  onUpdateOrder,
  onBackToMarketplace,
  initialSupplierId,
}) => {
  // Selected registered supplier
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    if (initialSupplierId && suppliers.some((s) => s.id === initialSupplierId)) {
      return initialSupplierId;
    }
    return suppliers[0]?.id || "SUP-001";
  });

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_transit" | "completed">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Delivery Date Modal / Inline State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [receiptReference,setReceiptReference]=useState("");
  const [receiptItems,setReceiptItems]=useState<Record<number,{quantity:number;lotNumber:string;expiryDate:string}>>({});
  const [saveBusy,setSaveBusy]=useState(false);
  const [editDeliveryDate, setEditDeliveryDate] = useState<string>("");
  const [editStatus, setEditStatus] = useState<PurchaseOrder["status"]>("مقبولة");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editTrackingNumber, setEditTrackingNumber] = useState<string>("");
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  // Active supplier object
  const activeSupplier = useMemo(() => {
    return (
      suppliers.find((s) => s.id === selectedSupplierId) ||
      suppliers[0] || {
        id: "SUP-001",
        name: "الشركة الوطنية للأدوية والمستلزمات",
        category: "أدوية ومحاليل وريدية",
        contact: "050 123 8841",
        status: "معتمد" as const,
        balance: 184500,
        ordersCount: 42,
      }
    );
  }, [suppliers, selectedSupplierId]);

  // Orders belonging to active supplier
  const supplierOrders = useMemo(() => {
    return purchaseOrders.filter(
      (order) =>
        order.supplierId === activeSupplier.id || order.supplierName.trim().toLowerCase() === activeSupplier.name.trim().toLowerCase()
    );
  }, [purchaseOrders, activeSupplier.name]);

  // Pending orders: "مقبولة" or "قيد التوصيل"
  const pendingOrders = useMemo(() => {
    return supplierOrders.filter(
      (po) => po.status === "مقبولة" || po.status === "قيد التوصيل"
    );
  }, [supplierOrders]);

  const completedOrders = useMemo(() => {
    return supplierOrders.filter((po) => po.status === "مكتملة");
  }, [supplierOrders]);

  const pendingTotalValue = useMemo(() => {
    return pendingOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [pendingOrders]);

  const unassignedDeliveryDateCount = useMemo(() => {
    return pendingOrders.filter((po) => !po.expectedDeliveryDate).length;
  }, [pendingOrders]);

  // Filtered orders list based on status & search
  const displayedOrders = useMemo(() => {
    return supplierOrders.filter((po) => {
      // Status filter
      if (statusFilter === "pending" && po.status !== "مقبولة") return false;
      if (statusFilter === "in_transit" && po.status !== "قيد التوصيل") return false;
      if (statusFilter === "completed" && po.status !== "مكتملة") return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = po.id.toLowerCase().includes(query);
        const matchesHospital = po.hospitalName.toLowerCase().includes(query);
        const matchesItems = po.items.some((it) =>
          it.productName.toLowerCase().includes(query)
        );
        const matchesTracking = po.trackingNumber?.toLowerCase().includes(query);
        if (!matchesId && !matchesHospital && !matchesItems && !matchesTracking) {
          return false;
        }
      }

      return true;
    });
  }, [supplierOrders, statusFilter, searchQuery]);

  // Handle open edit delivery date modal
  const handleStartEdit = (order: PurchaseOrder) => {
    setReceiptReference("");setReceiptItems(Object.fromEntries(order.items.map(x=>[x.productId,{quantity:Math.max(0,x.quantity-(order.receivedQuantities?.[x.productId]||0)),lotNumber:"",expiryDate:""}])));
    setEditingOrderId(order.id);
    setEditDeliveryDate(order.expectedDeliveryDate || "");
    setEditStatus(order.status);
    setEditNotes(order.supplierNotes || "");
    setEditTrackingNumber(order.trackingNumber || "");
  };

  const handleSaveEdit = async (orderId: string) => {
    if(saveBusy)return;
    if(editStatus==="مكتملة"&&!receiptReference?.trim())return;
    setSaveBusy(true);
    const saved=await onUpdateOrder(orderId, {
      receiptItems:editStatus==="مكتملة"?Object.entries(receiptItems).filter(([_,line])=>line.quantity>0).map(([pid,line])=>({...line,productId:Number(pid)})):undefined,
      receiptReference:receiptReference||undefined,
      expectedDeliveryDate: editDeliveryDate || undefined,
      status: editStatus,
      supplierNotes: editNotes.trim() || undefined,
      trackingNumber: editTrackingNumber.trim() || undefined,
    });

    setSaveBusy(false);if(saved===false)return;
    setSaveSuccessId(orderId);
    setTimeout(() => setSaveSuccessId(null), 3000);
    setEditingOrderId(null);
  };

  // Quick preset dates generator
  const getPresetDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" dir="rtl">
      {/* Header & Supplier Profile Banner */}
      <div className="bg-white dark:bg-[#122624] p-5 sm:p-6 rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-[#126B68] text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <Store className="w-3.5 h-3.5" />
                متابعة الموردين داخليًا والشركات المعتمدة
              </span>
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ربط إلكتروني مباشر مع المستشفيات
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#193B3A] dark:text-[#EDF7F4] pt-1">
              متابعة وتحديث أوامر الشراء وجداول التوريد
            </h2>
            <p className="text-xs sm:text-sm text-[#6B8581] dark:text-[#9DBBB4]">
              تتيح البوابة للمورد المسجل مراجعة أوامر التوريد الصادرة وتعيين تواريخ التوريد المتوقعة وبيانات الشحنات
            </p>
          </div>

          {/* Supplier Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-[#F6FAF8] dark:bg-[#163430] p-2 rounded-2xl border border-[#DCE8E5] dark:border-[#224A45] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4] shrink-0 mr-1" />
              <div className="flex flex-col">
                <label
                  htmlFor="supplier-select"
                  className="text-[10px] font-bold text-[#6B8581] dark:text-[#9DBBB4]"
                >
                  المورد المسجل الحالي:
                </label>
                <select
                  id="supplier-select"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="bg-transparent text-xs font-black text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none cursor-pointer pr-1"
                >
                  {suppliers.map((sup) => (
                    <option
                      key={sup.id}
                      value={sup.id}
                      className="bg-white dark:bg-[#122624] text-[#193B3A] dark:text-[#EDF7F4]"
                    >
                      {sup.name} ({sup.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {onBackToMarketplace && (
              <button
                id="btn-back-to-marketplace"
                onClick={onBackToMarketplace}
                className="px-4 py-2.5 bg-[#F0F5F3] dark:bg-[#163430] hover:bg-[#E3EDE9] dark:hover:bg-[#1C423D] text-[#193B3A] dark:text-[#EDF7F4] text-xs font-bold rounded-2xl transition-all border border-[#CDE5DF] dark:border-[#224A45] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>العودة للمتجر الطبي</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Supplier Info Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#EDF4F2] dark:border-[#1A3834]">
          <div className="bg-[#F8FBFA] dark:bg-[#152F2C] p-3.5 rounded-2xl border border-[#EEF3F1] dark:border-[#1E433E] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4] font-medium">
                التصنيف والنشاط
              </span>
              <p className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4] truncate">
                {activeSupplier.category}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-[#126B68] dark:text-[#4ECDC4]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#F8FBFA] dark:bg-[#152F2C] p-3.5 rounded-2xl border border-[#EEF3F1] dark:border-[#1E433E] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4] font-medium">
                رقم التواصل والدعم
              </span>
              <p className="text-xs font-mono font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                {activeSupplier.contact}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Phone className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#F8FBFA] dark:bg-[#152F2C] p-3.5 rounded-2xl border border-[#EEF3F1] dark:border-[#1E433E] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4] font-medium">
                حالة الاعتماد النظامي
              </span>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{activeSupplier.status} رسمياً</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#F8FBFA] dark:bg-[#152F2C] p-3.5 rounded-2xl border border-[#EEF3F1] dark:border-[#1E433E] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4] font-medium">
                الرصيد المالي المستحق
              </span>
              <p className="text-xs font-black text-[#126B68] dark:text-[#4ECDC4]">
                {activeSupplier.balance.toLocaleString()} ريال
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Supplier KPIs / Stat Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Orders Card */}
        <div className="bg-white dark:bg-[#122624] p-4 sm:p-5 rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">
              أوامر الشراء المعلقة
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#193B3A] dark:text-[#EDF7F4]">
              {pendingOrders.length}
            </span>
            <span className="text-xs text-[#6B8581] dark:text-[#9DBBB4]">أمر معلق</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
            تتطلب تأكيد أو جدولة موعد توريد
          </p>
        </div>

        {/* Pending Delivery Value */}
        <div className="bg-white dark:bg-[#122624] p-4 sm:p-5 rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">
              قيمة التوريدات المعلقة
            </span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#126B68] dark:text-[#4ECDC4]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#126B68] dark:text-[#4ECDC4]">
              {pendingTotalValue.toLocaleString()}
            </span>
            <span className="text-xs text-[#6B8581] dark:text-[#9DBBB4]">ريال</span>
          </div>
          <p className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4] mt-1 font-medium">
            مستحقات أوامر جاري توريدها
          </p>
        </div>

        {/* Orders in Transit */}
        <div className="bg-white dark:bg-[#122624] p-4 sm:p-5 rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">
              شحنات قيد التوصيل
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#193B3A] dark:text-[#EDF7F4]">
              {supplierOrders.filter((po) => po.status === "قيد التوصيل").length}
            </span>
            <span className="text-xs text-[#6B8581] dark:text-[#9DBBB4]">في الطريق</span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
            شحنات تم إصدار بوليصتها
          </p>
        </div>

        {/* Orders Awaiting Expected Delivery Date */}
        <div className="bg-white dark:bg-[#122624] p-4 sm:p-5 rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">
              بانتظار تحديد موعد التوريد
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {unassignedDeliveryDateCount}
            </span>
            <span className="text-xs text-[#6B8581] dark:text-[#9DBBB4]">أمر بحاجة لجدولة</span>
          </div>
          <p className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4] mt-1 font-medium">
            مطلوب من المورد إشعار المستشفى
          </p>
        </div>
      </div>

      {/* Orders Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#122624] p-4 rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            id="filter-status-pending"
            onClick={() => setStatusFilter("pending")}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "pending"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] dark:bg-[#163430] text-[#5A736F] dark:text-[#9DBBB4] hover:bg-[#E3EDE9]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>المعلقة ({pendingOrders.filter((o) => o.status === "مقبولة").length})</span>
          </button>

          <button
            id="filter-status-in-transit"
            onClick={() => setStatusFilter("in_transit")}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "in_transit"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] dark:bg-[#163430] text-[#5A736F] dark:text-[#9DBBB4] hover:bg-[#E3EDE9]"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>
              قيد التوصيل ({supplierOrders.filter((o) => o.status === "قيد التوصيل").length})
            </span>
          </button>

          <button
            id="filter-status-completed"
            onClick={() => setStatusFilter("completed")}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "completed"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] dark:bg-[#163430] text-[#5A736F] dark:text-[#9DBBB4] hover:bg-[#E3EDE9]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المكتملة ({completedOrders.length})</span>
          </button>

          <button
            id="filter-status-all"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] dark:bg-[#163430] text-[#5A736F] dark:text-[#9DBBB4] hover:bg-[#E3EDE9]"
            }`}
          >
            جميع أوامر التوريد ({supplierOrders.length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <input
            id="input-search-orders"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الأمر، الصنف، المستشفى..."
            className="w-full bg-[#F6FAF8] dark:bg-[#163430] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl py-2 pr-9 pl-3 text-xs text-[#193B3A] dark:text-[#EDF7F4] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68]"
          />
          <Search className="w-4 h-4 text-[#8B9A97] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orders Cards List */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#122624] p-12 rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-[#F0F5F3] dark:bg-[#163430] mx-auto flex items-center justify-center text-[#6B8581] dark:text-[#9DBBB4]">
            <Package className="w-7 h-7" />
          </div>
          <h4 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
            لا توجد أوامر شراء مطابقة لمعايير البحث
          </h4>
          <p className="text-xs text-[#6B8581] dark:text-[#9DBBB4] max-w-md mx-auto">
            لم يتم العثور على أوامر شراء تطابق التصنيف المختار أو عبارة البحث للمورد «
            {activeSupplier.name}».
          </p>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="mt-2 px-4 py-2 bg-[#126B68] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#0E5754]"
            >
              عرض جميع أوامر المورد ({supplierOrders.length})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedOrders.map((order) => {
            const isEditing = editingOrderId === order.id;
            const isSaved = saveSuccessId === order.id;

            return (
              <div
                key={order.id}
                id={`po-card-${order.id}`}
                className={`bg-white dark:bg-[#122624] rounded-3xl border p-5 sm:p-6 transition-all shadow-xs ${
                  order.status === "مقبولة"
                    ? "border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/20 dark:from-amber-950/10 to-transparent"
                    : order.status === "قيد التوصيل"
                    ? "border-blue-200 dark:border-blue-900/50 bg-gradient-to-b from-blue-50/20 dark:from-blue-950/10 to-transparent"
                    : "border-[#E1EBE8] dark:border-[#1F423E]"
                }`}
              >
                {/* Top Section: PO Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDF4F2] dark:border-[#1E3F3B]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-black bg-[#EBF5F3] dark:bg-[#163430] text-[#126B68] dark:text-[#4ECDC4] px-3 py-1 rounded-xl border border-[#CDE5DF] dark:border-[#224A45]">
                        {order.id}
                      </span>
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                          order.status === "مكتملة"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                            : order.status === "قيد التوصيل"
                            ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 animate-pulse"
                        }`}
                      >
                        {order.status === "مكتملة" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {order.status === "قيد التوصيل" && <Truck className="w-3.5 h-3.5" />}
                        {order.status === "مقبولة" && <Clock className="w-3.5 h-3.5" />}
                        <span>حالة الأمر: {order.status}</span>
                      </span>

                      {order.autoReplenished && (
                        <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                          نظام التزويد الذكي التلقائي
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#6B8581] dark:text-[#9DBBB4] flex-wrap pt-1">
                      <span className="flex items-center gap-1 font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                        <Building2 className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
                        <span>{order.hospitalName}</span>
                      </span>
                      <span>•</span>
                      <span>تاريخ الإصدار: {order.orderDate}</span>
                      {order.trackingNumber && (
                        <>
                          <span>•</span>
                          <span className="font-mono bg-[#F0F5F3] dark:bg-[#163430] px-2 py-0.5 rounded-md text-[#193B3A] dark:text-[#EDF7F4]">
                            بوليصة الشحن: {order.trackingNumber}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions / Financial Total */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1">
                    <span className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4]">
                      إجمالي قيمة الأمر:
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#126B68] dark:text-[#4ECDC4]">
                      {order.totalAmount.toLocaleString()} ريال
                    </span>
                  </div>
                </div>

                {/* Items in Purchase Order */}
                <div className="py-3.5">
                  <div className="text-[11px] font-bold text-[#6B8581] dark:text-[#9DBBB4] mb-2 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>الأصناف والكميات الطبية المطلوبة:</span>
                  </div>
                  <div className="bg-[#F8FBFA] dark:bg-[#152F2C] rounded-2xl border border-[#EEF3F1] dark:border-[#1E433E] p-3 space-y-2 text-xs">
                    {order.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-[#EEF3F1] dark:border-[#1E433E] last:border-0 gap-1"
                      >
                        <div className="font-medium text-[#193B3A] dark:text-[#EDF7F4] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#126B68] dark:text-[#4ECDC4]" />
                          <span>{it.productName}</span>
                        </div>
                        <div className="text-[#5A736F] dark:text-[#A5C3BD] font-mono text-[11px] flex items-center gap-2">
                          <span className="bg-white dark:bg-[#122624] px-2 py-0.5 rounded-md border border-[#DCE8E5] dark:border-[#224A45]">
                            {it.quantity} {it.unit}
                          </span>
                          <span>× {it.price.toLocaleString()} ريال</span>
                          <span className="font-black text-[#193B3A] dark:text-[#EDF7F4]">
                            = {(it.quantity * it.price).toLocaleString()} ريال
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Date & Fulfillment Status Section */}
                <div className="pt-2">
                  {!isEditing ? (
                    <div className="bg-[#F6FAF8] dark:bg-[#152F2C] p-4 rounded-2xl border border-[#DCE8E5] dark:border-[#1E433E] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Current Delivery Date Status */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-[#6B8581] dark:text-[#9DBBB4] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
                          موعد التوريد المتوقع لمستودع المستشفى:
                        </span>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {order.expectedDeliveryDate ? (
                            <span className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4] font-mono bg-white dark:bg-[#122624] px-3 py-1 rounded-xl border border-[#CDE5DF] dark:border-[#204944] flex items-center gap-1.5 shadow-2xs">
                              <CalendarClock className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4]" />
                              {order.expectedDeliveryDate}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              لم يتم تحديد موعد التوريد بعد — مطلوب التحديث
                            </span>
                          )}

                          {order.supplierNotes && (
                            <span className="text-xs text-[#5A736F] dark:text-[#9DBBB4] italic bg-white dark:bg-[#122624] px-3 py-1 rounded-xl border border-[#DCE8E5] dark:border-[#224A45] max-w-md truncate">
                              «{order.supplierNotes}»
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isSaved && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                            <CheckCircle2 className="w-4 h-4" />
                            تم حفظ التحديث بنجاح
                          </span>
                        )}

                        <button
                          id={`btn-edit-po-${order.id}`}
                          onClick={() => handleStartEdit(order)}
                          className="px-4 py-2 rounded-xl bg-[#126B68] hover:bg-[#0E5754] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span>تحديث تاريخ التوريد وحالة الشحنة</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Inline Edit Mode Form */
                    <div className="bg-[#EFF7F5] dark:bg-[#163430] p-4 sm:p-5 rounded-2xl border-2 border-[#126B68] space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-[#D5EAE4] dark:border-[#1E433E]">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4]" />
                          <h4 className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4]">
                            تحديث بيانات وتاريخ التوريد للأمر: {order.id}
                          </h4>
                        </div>
                        <button
                          onClick={() => setEditingOrderId(null)}
                          className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                          title="إلغاء التعديل"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {/* Expected Delivery Date Input */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`input-delivery-date-${order.id}`}
                            className="text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4] block"
                          >
                            تاريخ التوريد المتوقع بالمستشفى: *
                          </label>
                          <input
                            id={`input-delivery-date-${order.id}`}
                            type="date"
                            value={editDeliveryDate}
                            onChange={(e) => setEditDeliveryDate(e.target.value)}
                            className="w-full bg-white dark:bg-[#122624] border border-[#CDE5DF] dark:border-[#224A45] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                          />
                          {/* Quick presets */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-[#6B8581] dark:text-[#9DBBB4]">
                              خيارات سريعة:
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditDeliveryDate(getPresetDate(2))}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-[#122624] border border-[#CDE5DF] dark:border-[#204944] text-[#126B68] dark:text-[#4ECDC4] hover:bg-[#E1EBE8]"
                            >
                              خلال يومين
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditDeliveryDate(getPresetDate(4))}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-[#122624] border border-[#CDE5DF] dark:border-[#204944] text-[#126B68] dark:text-[#4ECDC4] hover:bg-[#E1EBE8]"
                            >
                              خلال 4 أيام
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditDeliveryDate(getPresetDate(7))}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-[#122624] border border-[#CDE5DF] dark:border-[#204944] text-[#126B68] dark:text-[#4ECDC4] hover:bg-[#E1EBE8]"
                            >
                              خلال أسبوع
                            </button>
                          </div>
                        </div>

                        {editStatus==="مكتملة"&&<section className="space-y-3 border p-3 rounded-xl"><h3>استلام وفحص الشحنة</h3><label className="block">رقم محضر الاستلام<input required value={receiptReference} onChange={e=>setReceiptReference(e.target.value)} className="w-full border rounded-lg p-2" /></label>{order.items.map(line=><div key={line.productId} className="space-y-2"><p>{line.productName} — المتبقي {line.quantity-(order.receivedQuantities?.[line.productId]||0)}</p><label>الكمية المستلمة<input type="number" min="0" max={line.quantity-(order.receivedQuantities?.[line.productId]||0)} value={receiptItems[line.productId]?.quantity||0} onChange={e=>setReceiptItems(prev=>({...prev,[line.productId]:{...prev[line.productId],quantity:Number(e.target.value)}}))} className="w-full border rounded-lg p-2" /></label><label>رقم الدفعة (إلزامي للأدوية والمحاليل والكواشف)<input value={receiptItems[line.productId]?.lotNumber||""} onChange={e=>setReceiptItems(prev=>({...prev,[line.productId]:{...prev[line.productId],lotNumber:e.target.value}}))} className="w-full border rounded-lg p-2" /></label><label>تاريخ صلاحية الدفعة<input type="date" value={receiptItems[line.productId]?.expiryDate||""} onChange={e=>setReceiptItems(prev=>({...prev,[line.productId]:{...prev[line.productId],expiryDate:e.target.value}}))} className="w-full border rounded-lg p-2" /></label></div>)}<p>الاستلام الجزئي يُبقي الطلب مفتوحًا للكميات المتبقية؛ لا يُنشئ فاتورة.</p></section>}
                        {/* Order Fulfillment Status */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`select-status-${order.id}`}
                            className="text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4] block"
                          >
                            حالة أمر التوريد:
                          </label>
                          <select
                            id={`select-status-${order.id}`}
                            value={editStatus}
                            onChange={(e) =>
                              setEditStatus(e.target.value as PurchaseOrder["status"])
                            }
                            className="w-full bg-white dark:bg-[#122624] border border-[#CDE5DF] dark:border-[#224A45] rounded-xl px-3 py-2 text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                          >
                            <option value="مسودة">مسودة (بانتظار الاعتماد)</option><option value="مقبولة">مقبولة (اعتماد داخلي فقط)</option>
                            <option value="قيد التوصيل">قيد التوصيل (خرجت مع المندوب / الشاحنة)</option>
                            <option value="مكتملة">تسجيل محضر استلام (جزئي أو كامل)</option>
                          </select>
                        </div>

                        {/* Tracking Number / Waybill */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`input-tracking-${order.id}`}
                            className="text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4] block"
                          >
                            رقم بوليصة الشحن أو الشاحنة:
                          </label>
                          <input
                            id={`input-tracking-${order.id}`}
                            type="text"
                            value={editTrackingNumber}
                            onChange={(e) => setEditTrackingNumber(e.target.value)}
                            placeholder="مثال: TRK-SA-90412"
                            className="w-full bg-white dark:bg-[#122624] border border-[#CDE5DF] dark:border-[#224A45] rounded-xl px-3 py-2 text-xs font-mono text-[#193B3A] dark:text-[#EDF7F4] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68]"
                          />
                        </div>
                      </div>

                      {/* Supplier Dispatch Notes */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`input-notes-${order.id}`}
                          className="text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4] block"
                        >
                          ملاحظات المورد وتعليمات التخزين والتسليم:
                        </label>
                        <input
                          id={`input-notes-${order.id}`}
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="مثال: الشحنة تتطلب حفظ بدرجة حرارة 2-8°C وسيقوم المندوب بالتسليم في البوابة 3 للمستودع"
                          className="w-full bg-white dark:bg-[#122624] border border-[#CDE5DF] dark:border-[#224A45] rounded-xl px-3 py-2 text-xs text-[#193B3A] dark:text-[#EDF7F4] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68]"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingOrderId(null)}
                          className="px-4 py-2 rounded-xl border border-[#CDE5DF] dark:border-[#224A45] bg-white dark:bg-[#122624] text-[#5A736F] dark:text-[#9DBBB4] text-xs font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          id={`btn-save-po-${order.id}`}
                          type="button"
                          onClick={() => void handleSaveEdit(order.id)} disabled={saveBusy}
                          className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0E5754] text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>حفظ واعتماد تاريخ التوريد</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
