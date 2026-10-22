import React, { useState, useMemo } from "react";
import {
  FileText,
  PlusCircle,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Building,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Edit3,
  Trash2,
  Sparkles,
  Info,
  BellRing,
} from "lucide-react";
import {
  SupplierContract,
  ContractStatus,
  ContractCategory,
  Supplier,
  UserProfile,
} from "../types";
import { NewContractModal } from "./NewContractModal";
import { ContractDetailsModal } from "./ContractDetailsModal";

interface SupplierContractsManagerProps {
  contracts: SupplierContract[];
  onAddContract: (contract: Omit<SupplierContract, "id" | "createdAt">) => Promise<boolean | void> | void;
  onUpdateContract: (contract: SupplierContract) => Promise<boolean | void> | void;
  onDeleteContract?: (contractId: string) => Promise<boolean | void> | void;
  onRenewContract: (contractId: string) => Promise<boolean | void> | void;
  suppliers?: Supplier[];
  currentUser?: UserProfile;
  onOpenInTab?: (contract: SupplierContract) => Promise<boolean | void> | void;
}

export const SupplierContractsManager: React.FC<SupplierContractsManagerProps> = ({
  contracts,
  onAddContract,
  onUpdateContract,
  onDeleteContract,
  onRenewContract,
  suppliers = [],
  currentUser,
  onOpenInTab,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("الكل");
  const [categoryFilter, setCategoryFilter] = useState<string>("الكل");
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedContractForDetails, setSelectedContractForDetails] = useState<SupplierContract | null>(null);
  const [contractToEdit, setContractToEdit] = useState<SupplierContract | null>(null);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);

  // Helper function to calculate status & days remaining accurately
  const getContractMeta = (c: SupplierContract) => {
    const end = new Date(c.endDate);
    const start = new Date(c.startDate);
    const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const percentElapsed = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));

    let effectiveStatus: ContractStatus = c.status;
    if (c.status !== "معلق") {
      if (daysRemaining <= 0) {
        effectiveStatus = "منتهي";
      } else if (daysRemaining <= (c.renewalAlertDays || 30)) {
        effectiveStatus = "قريب الانتهاء";
      } else {
        effectiveStatus = "ساري";
      }
    }

    return {
      daysRemaining,
      percentElapsed,
      effectiveStatus,
      isExpired: daysRemaining <= 0,
      isAlertTriggered: daysRemaining > 0 && daysRemaining <= (c.renewalAlertDays || 30),
    };
  };

  // Contracts summary KPIs
  const kpis = useMemo(() => {
    let totalValue = 0;
    let activeCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    contracts.forEach((c) => {
      totalValue += c.totalValue;
      const meta = getContractMeta(c);
      if (meta.effectiveStatus === "ساري") activeCount++;
      else if (meta.effectiveStatus === "قريب الانتهاء") expiringSoonCount++;
      else if (meta.effectiveStatus === "منتهي") expiredCount++;
    });

    return {
      totalValue,
      activeCount,
      expiringSoonCount,
      expiredCount,
      totalCount: contracts.length,
    };
  }, [contracts]);

  // Expiring contracts that require immediate automatic renewal attention
  const alertContracts = useMemo(() => {
    return contracts.filter((c) => {
      const meta = getContractMeta(c);
      return meta.isAlertTriggered || meta.isExpired;
    });
  }, [contracts]);

  // Filtered contracts list
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const meta = getContractMeta(c);
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "الكل" || meta.effectiveStatus === statusFilter;

      const matchesCategory =
        categoryFilter === "الكل" || c.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [contracts, searchTerm, statusFilter, categoryFilter]);

  const handleQuickRenew = async (contractId: string) => {
    const saved=await onRenewContract(contractId);if(saved===false)return;
    setQuickNotification("تم تمديد العقد بنجاح وتحديث تاريخ الانتهاء لسنة إضافية!");
    setTimeout(() => setQuickNotification(null), 4000);
  };

  const handleSaveContract = async (
    contractData: Omit<SupplierContract, "id" | "createdAt"> & { id?: string }
  ) => {
    if (contractData.id) {
      const existing = contracts.find((c) => c.id === contractData.id);
      if (existing) {
        const saved=await onUpdateContract({
          ...existing,
          ...contractData,
        } as SupplierContract);
        if(saved===false)return false;
        setQuickNotification("تم تحديث بيانات العقد بنجاح");
      }
    } else {
      const saved=await onAddContract(contractData);if(saved===false)return false;
      setQuickNotification("تم إنشاء وتسجيل عقد المورد الرقمي بنجاح");
    }
    setTimeout(() => setQuickNotification(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Quick Notification Toast */}
      {quickNotification && (
        <div className="p-3 bg-[#E5F5E8] dark:bg-[#1E432A] border border-[#BCE8C5] dark:border-[#2E6B42] text-[#2B7A3D] dark:text-[#76D28C] rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{quickNotification}</span>
          </div>
          <button
            onClick={() => setQuickNotification(null)}
            className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Automatic Renewal Alert Banner */}
      {alertContracts.length > 0 && (
        <div className="bg-linear-to-r from-[#FFF8ED] to-[#FFF2E0] dark:from-[#352712] dark:to-[#3F2E14] border border-[#FDE2BC] dark:border-[#5A401A] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7D8AC]/60 dark:border-[#5A401A] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#B86B00]/15 text-[#B86B00] dark:text-[#F3C769] flex items-center justify-center">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#663C00] dark:text-[#F8D588]">
                  تنبيهات التجديد التلقائية للعقود ({alertContracts.length} عقود تستوجب المتابعة)
                </h3>
                <p className="text-[11px] text-[#8C5504] dark:text-[#DFB667]">
                  عقود صيانة وتوريد بلغت نطاق مهلة التنبيه أو انتهت صلاحيتها، يجب تجديدها لضمان استمرارية الخدمات الطبية
                </p>
              </div>
            </div>
            <span className="text-[11px] font-black bg-[#B86B00] text-white px-3 py-1 rounded-full w-fit">
              {kpis.expiringSoonCount} قريبة الانتهاء • {kpis.expiredCount} منتهية
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {alertContracts.slice(0, 4).map((c) => {
              const meta = getContractMeta(c);
              return (
                <div
                  key={c.id}
                  className="bg-white/90 dark:bg-[#1C2C28] p-3 rounded-2xl border border-[#F8E1C2] dark:border-[#384A45] flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-black bg-[#FFF2D6] text-[#B86B00] px-1.5 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="text-xs font-black text-[#193B3A] dark:text-[#E3F2EE] truncate">
                        {c.supplierName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#526B66] dark:text-[#9DBBB4] truncate mt-0.5">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-[#B86B00] dark:text-[#F3C769] font-bold mt-0.5">
                      {meta.isExpired
                        ? `منتهي الصلاحية منذ ${Math.abs(meta.daysRemaining)} يوماً (${c.endDate})`
                        : `متبقي ${meta.daysRemaining} يوماً (ينتهي في ${c.endDate})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleQuickRenew(c.id)}
                      className="px-3 py-1.5 bg-[#126B68] hover:bg-[#0e5754] text-white text-[11px] font-bold rounded-xl flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                      title="تجديد العقد لسنة إضافية"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>تجديد الآن</span>
                    </button>
                    <button
                      onClick={() => setSelectedContractForDetails(c)}
                      className="p-1.5 bg-[#F0F5F3] dark:bg-[#16302C] hover:bg-[#E2EDE9] text-[#126B68] dark:text-[#4ECDC4] rounded-xl border border-[#DCE8E5] dark:border-[#224A45] cursor-pointer"
                      title="استعراض تفاصيل العقد"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contract Management KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
          <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">إجمالي الالتزامات التعاقدية</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#193B3A] dark:text-[#E3F2EE]">
              {kpis.totalValue.toLocaleString()}
            </span>
            <span className="text-xs text-[#8B9A97] dark:text-[#788C88]">ريال</span>
          </div>
          <p className="text-[11px] text-[#126B68] dark:text-[#4ECDC4] mt-1 font-semibold">
            {kpis.totalCount} عقود مسجلة رقمياً
          </p>
        </div>

        <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
          <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">عقود سارية ونشطة</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#2B7A3D] dark:text-[#76D28C]">
              {kpis.activeCount}
            </span>
            <span className="text-xs text-[#8B9A97] dark:text-[#788C88]">عقد</span>
          </div>
          <p className="text-[11px] text-[#2B7A3D] dark:text-[#76D28C] mt-1 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ضمن فترة السريان النظامي
          </p>
        </div>

        <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
          <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">تنبيهات تجديد مستحقة</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#B86B00] dark:text-[#F3C769]">
              {kpis.expiringSoonCount}
            </span>
            <span className="text-xs text-[#8B9A97] dark:text-[#788C88]">عقد</span>
          </div>
          <p className="text-[11px] text-[#B86B00] dark:text-[#F3C769] mt-1 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            أقل من مهلة التنبيه المحددة
          </p>
        </div>

        <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
          <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">عقود منتهية الصلاحية</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#C9684D] dark:text-[#F08C8C]">
              {kpis.expiredCount}
            </span>
            <span className="text-xs text-[#8B9A97] dark:text-[#788C88]">عقد</span>
          </div>
          <p className="text-[11px] text-[#C9684D] dark:text-[#F08C8C] mt-1 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            يلزم التمديد أو إنهاء الالتزام
          </p>
        </div>
      </div>

      {/* Main Contracts Directory Card */}
      <div className="bg-white dark:bg-[#122624] rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-[#EDF4F2] dark:border-[#1A3834] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#126B68]/15 dark:bg-[#126B68]/30 text-[#126B68] dark:text-[#4ECDC4] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#193B3A] dark:text-[#E3F2EE]">
                سجل عقود الموردين واتفاقيات الصيانة (Contracts Register)
              </h3>
              <p className="text-[11px] text-[#788C88] dark:text-[#9DBBB4]">
                إدارة رقمية لعقود الصيانة، مستلزمات التشغيل، وتتبع دقيق لمواعيد الانتهاء والتجديد
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[190px] flex-1 sm:flex-initial">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالمورد أو رقم العقد..."
                className="w-full pl-3 pr-8 py-2 bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl text-xs text-[#193B3A] dark:text-[#E3F2EE] focus:outline-none focus:border-[#126B68]"
              />
              <Search className="w-3.5 h-3.5 text-[#788C88] dark:text-[#9DBBB4] absolute right-2.5 top-2.5" />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl px-2.5 py-2 text-xs text-[#193B3A] dark:text-[#E3F2EE] font-medium focus:outline-none focus:border-[#126B68]"
            >
              <option value="الكل">كافة التصنيفات</option>
              <option value="أجهزة طبية وصيانة">أجهزة طبية وصيانة</option>
              <option value="أدوية ومحاليل">أدوية ومحاليل</option>
              <option value="غازات طبية وشبكات">غازات طبية وشبكات</option>
              <option value="تقنية ومعلومات (IT)">تقنية ومعلومات (IT)</option>
              <option value="نظافة وتعقيم">نظافة وتعقيم</option>
              <option value="صيانة مرافق وبنية تحتية">صيانة مرافق</option>
            </select>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-[#F0F5F3] dark:bg-[#16302C] p-1 rounded-xl">
              {["الكل", "ساري", "قريب الانتهاء", "منتهي"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    statusFilter === s
                      ? "bg-[#126B68] text-white font-black"
                      : "text-[#5A736F] dark:text-[#9DBBB4] hover:bg-[#E3EDE9] dark:hover:bg-[#1F423E]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Create New Contract Button */}
            <button
              onClick={() => {
                setContractToEdit(null);
                setIsNewModalOpen(true);
              }}
              className="px-3.5 py-2 bg-[#126B68] hover:bg-[#0d5553] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>عقد مورد جديد</span>
            </button>
          </div>
        </div>

        {/* Contracts List / Grid */}
        <div className="p-4 sm:p-5">
          {filteredContracts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredContracts.map((contract) => {
                const meta = getContractMeta(contract);
                return (
                  <div
                    key={contract.id}
                    className="p-4 sm:p-5 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] bg-[#FDFEFE] dark:bg-[#162D29] hover:border-[#126B68]/50 transition-all shadow-xs flex flex-col justify-between space-y-3.5"
                  >
                    {/* Top row: ID, category, status */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black bg-[#E9F5F2] dark:bg-[#1B3F3A] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md">
                            {contract.id}
                          </span>
                          <span className="text-[10px] bg-[#F0F5F3] dark:bg-[#1B3B37] text-[#5A736F] dark:text-[#9DBBB4] font-semibold px-2 py-0.5 rounded-md">
                            {contract.category}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            meta.effectiveStatus === "ساري"
                              ? "bg-[#E5F5E8] text-[#2B7A3D] dark:bg-[#1E432A] dark:text-[#76D28C]"
                              : meta.effectiveStatus === "قريب الانتهاء"
                              ? "bg-[#FFF2D6] text-[#B86B00] dark:bg-[#473617] dark:text-[#F3C769]"
                              : meta.effectiveStatus === "منتهي"
                              ? "bg-[#FDE8E8] text-[#C94D4D] dark:bg-[#4A1E1E] dark:text-[#F08C8C]"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {meta.effectiveStatus === "ساري" && <CheckCircle2 className="w-3 h-3" />}
                          {meta.effectiveStatus === "قريب الانتهاء" && <Clock className="w-3 h-3" />}
                          {meta.effectiveStatus === "منتهي" && <AlertTriangle className="w-3 h-3" />}
                          <span>{meta.effectiveStatus}</span>
                        </span>
                      </div>

                      {/* Title & Supplier */}
                      <h4 className="text-sm font-black text-[#193B3A] dark:text-[#E3F2EE] mt-2 line-clamp-1">
                        {contract.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#526B66] dark:text-[#9DBBB4] mt-0.5">
                        <Building className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4] shrink-0" />
                        <span className="font-bold">{contract.supplierName}</span>
                        <span className="text-[10px] text-[#8B9A97]">({contract.contractNumber})</span>
                      </div>

                      {contract.scopeOfWork && (
                        <p className="text-[11px] text-[#738884] dark:text-[#8FAFA7] mt-1.5 line-clamp-2 leading-relaxed">
                          {contract.scopeOfWork}
                        </p>
                      )}
                    </div>

                    {/* Timeline & Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-[#EDF4F2] dark:border-[#1F423E]">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#788C88] dark:text-[#9DBBB4]">
                          فترة السريان: <strong className="font-mono">{contract.startDate}</strong> ← <strong className="font-mono">{contract.endDate}</strong>
                        </span>
                        <span
                          className={`font-black ${
                            meta.isExpired
                              ? "text-[#C94D4D]"
                              : meta.isAlertTriggered
                              ? "text-[#B86B00]"
                              : "text-[#126B68] dark:text-[#4ECDC4]"
                          }`}
                        >
                          {meta.isExpired
                            ? "منتهي الصلاحية"
                            : `متبقي ${meta.daysRemaining} يوم`}
                        </span>
                      </div>

                      <div className="w-full bg-[#E1EBE8] dark:bg-[#203D39] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            meta.isExpired
                              ? "bg-[#C94D4D]"
                              : meta.isAlertTriggered
                              ? "bg-[#B86B00]"
                              : "bg-[#126B68] dark:bg-[#4ECDC4]"
                          }`}
                          style={{ width: `${meta.percentElapsed}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#788C88] dark:text-[#9DBBB4]">
                        <span>
                          {contract.autoRenew ? "🔄 تجديد تلقائي مفعّل" : "تجديد يدوي"}
                        </span>
                        <span>تنبيه قبل: {contract.renewalAlertDays} يوم</span>
                      </div>
                    </div>

                    {/* Bottom row: Value & Actions */}
                    <div className="pt-2 border-t border-[#EDF4F2] dark:border-[#1F423E] flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-[#8B9A97] dark:text-[#788C88] block">قيمة العقد</span>
                        <span className="text-sm font-black text-[#193B3A] dark:text-[#E3F2EE]">
                          {contract.totalValue.toLocaleString()} ريال
                        </span>
                        <span className="text-[10px] text-[#126B68] dark:text-[#4ECDC4] font-semibold block">
                          دفع {contract.paymentTerms}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickRenew(contract.id)}
                          className="px-2.5 py-1.5 bg-[#E9F5F2] dark:bg-[#1B3F3A] hover:bg-[#d5ede7] text-[#126B68] dark:text-[#4ECDC4] text-xs font-bold rounded-xl flex items-center gap-1 border border-[#CDE5DF] dark:border-[#23534C] transition-colors cursor-pointer"
                          title="تجديد العقد لمدة عام إضافي"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>تجديد</span>
                        </button>

                        <button
                          onClick={() => {
                            setContractToEdit(contract);
                            setIsNewModalOpen(true);
                          }}
                          className="p-1.5 bg-[#F0F5F3] dark:bg-[#16302C] hover:bg-[#E2EDE9] text-[#526B66] dark:text-[#9DBBB4] rounded-xl border border-[#DCE8E5] dark:border-[#224A45] transition-colors cursor-pointer"
                          title="تعديل بيانات العقد"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedContractForDetails(contract)}
                          className="px-3 py-1.5 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
                        >
                          <span>عرض العقد</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center space-y-2 text-[#8B9A97] dark:text-[#788C88]">
              <FileText className="w-8 h-8 mx-auto text-[#C2D6D1] dark:text-[#2E554E]" />
              <p className="text-xs font-bold">لا توجد عقود مطابقة للتصفية الحالية</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("الكل");
                  setCategoryFilter("الكل");
                }}
                className="text-xs text-[#126B68] dark:text-[#4ECDC4] font-bold underline cursor-pointer"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New / Edit Contract Modal */}
      {isNewModalOpen && (
        <NewContractModal
          isOpen={isNewModalOpen}
          onClose={() => {
            setIsNewModalOpen(false);
            setContractToEdit(null);
          }}
          onSave={handleSaveContract}
          contractToEdit={contractToEdit}
          suppliers={suppliers}
        />
      )}

      {/* Contract Details View Modal */}
      {selectedContractForDetails && (
        <ContractDetailsModal
          contract={selectedContractForDetails}
          isOpen={!!selectedContractForDetails}
          onClose={() => setSelectedContractForDetails(null)}
          onRenew={(id) => {
            handleQuickRenew(id);
            // Refresh modal reference
            const updated = contracts.find((c) => c.id === id);
            if (updated) setSelectedContractForDetails(updated);
          }}
          onEdit={(c) => {
            setSelectedContractForDetails(null);
            setContractToEdit(c);
            setIsNewModalOpen(true);
          }}
          onToggleStatus={async (id, status) => {
            const found = contracts.find((c) => c.id === id);
            if (found) {
              const saved=await onUpdateContract({ ...found, status });
              if(saved!==false)setSelectedContractForDetails({ ...found, status });
            }
          }}
          onOpenInTab={onOpenInTab}
        />
      )}
    </div>
  );
};
