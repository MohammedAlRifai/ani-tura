import React, { useState, useMemo } from "react";
import {
  X,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Download,
  Printer,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Boxes,
  ShoppingCart,
  Wrench,
  Sparkles,
  ArrowDownRight,
  ArrowUpLeft,
  ChevronDown,
  Activity,
  Layers,
  Building2,
  HardDrive,
  Laptop,
} from "lucide-react";
import { UserProfile, UserAuditLogEntry, AuditActionType, UserRole } from "../types";

interface UserAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUser: UserProfile;
  auditLogs: UserAuditLogEntry[];
  initialSelectedUserId?: string;
  onSelectUserForSwitch?: (user: UserProfile) => void;
}

export const UserAuditLogModal: React.FC<UserAuditLogModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  auditLogs,
  initialSelectedUserId,
  onSelectUserForSwitch,
}) => {
  // State: selected user filter (or 'all' for admin consolidated view)
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialSelectedUserId || currentUser.id
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [exportSuccess, setExportSuccess] = useState(false);

  // Update selectedUserId when initialSelectedUserId changes
  React.useEffect(() => {
    if (initialSelectedUserId) {
      setSelectedUserId(initialSelectedUserId);
    }
  }, [initialSelectedUserId]);

  // Escape key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Selected user profile
  const activeSelectedUser = useMemo(() => {
    if (selectedUserId === "all") return null;
    return users.find((u) => u.id === selectedUserId) || currentUser;
  }, [selectedUserId, users, currentUser]);

  // Date filters helper
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // User filter
      if (selectedUserId !== "all" && log.userId !== selectedUserId) {
        return false;
      }

      // Action Type filter
      if (actionTypeFilter !== "all" && log.actionType !== actionTypeFilter) {
        return false;
      }

      // Period filter
      const logTime = new Date(log.timestamp).getTime();
      if (periodFilter === "today" && logTime < startOfToday) {
        return false;
      }
      if (periodFilter === "week" && logTime < sevenDaysAgo) {
        return false;
      }
      if (periodFilter === "month" && logTime < startOfMonth) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = log.actionTitle.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesTarget = log.targetEntityId?.toLowerCase().includes(q) || false;
        const matchesUser = log.userName.toLowerCase().includes(q);
        const matchesIp = log.ipAddress?.toLowerCase().includes(q) || false;

        if (!matchesTitle && !matchesDetails && !matchesTarget && !matchesUser && !matchesIp) {
          return false;
        }
      }

      return true;
    });
  }, [
    auditLogs,
    selectedUserId,
    actionTypeFilter,
    periodFilter,
    searchQuery,
    startOfToday,
    sevenDaysAgo,
    startOfMonth,
  ]);

  // KPI Metrics for the selected scope
  const stats = useMemo(() => {
    const scopeLogs = selectedUserId === "all"
      ? auditLogs
      : auditLogs.filter((l) => l.userId === selectedUserId);

    const reportsCreated = scopeLogs.filter((l) => l.actionType === "إنشاء بلاغ").length;
    const statusesUpdated = scopeLogs.filter((l) => l.actionType === "تحديث حالة بلاغ").length;
    const inventoryActions = scopeLogs.filter((l) => l.actionType === "حركة مخزون").length;
    const maintenanceActions = scopeLogs.filter((l) => l.actionType === "صيانة ومعايرة").length;
    const orderActions = scopeLogs.filter((l) => l.actionType === "أمر شراء").length;

    return {
      total: scopeLogs.length,
      reportsCreated,
      statusesUpdated,
      inventoryActions,
      maintenanceActions,
      orderActions,
    };
  }, [auditLogs, selectedUserId]);

  if (!isOpen) return null;

  // Icon & styling selector based on action type
  const getActionBadge = (type: AuditActionType) => {
    switch (type) {
      case "إنشاء بلاغ":
        return {
          icon: <FileText className="w-3.5 h-3.5" />,
          color: "bg-rose-50 text-rose-700 border-rose-200",
          iconBg: "bg-rose-500 text-white",
        };
      case "تحديث حالة بلاغ":
        return {
          icon: <Activity className="w-3.5 h-3.5" />,
          color: "bg-sky-50 text-sky-700 border-sky-200",
          iconBg: "bg-sky-500 text-white",
        };
      case "حركة مخزون":
        return {
          icon: <Boxes className="w-3.5 h-3.5" />,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          iconBg: "bg-emerald-600 text-white",
        };
      case "أمر شراء":
        return {
          icon: <ShoppingCart className="w-3.5 h-3.5" />,
          color: "bg-amber-50 text-amber-700 border-amber-200",
          iconBg: "bg-amber-500 text-white",
        };
      case "صيانة ومعايرة":
        return {
          icon: <Wrench className="w-3.5 h-3.5" />,
          color: "bg-indigo-50 text-indigo-700 border-indigo-200",
          iconBg: "bg-indigo-600 text-white",
        };
      case "استشارة ذكية":
        return {
          icon: <Sparkles className="w-3.5 h-3.5" />,
          color: "bg-purple-50 text-purple-700 border-purple-200",
          iconBg: "bg-purple-600 text-white",
        };
      case "إجراء إداري":
      default:
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          color: "bg-teal-50 text-teal-800 border-teal-200",
          iconBg: "bg-[#126B68] text-white",
        };
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    try {
      const headers = [
        "معرف_العملية",
        "المستخدم",
        "الدور_الوظيفي",
        "القسم",
        "نوع_العملية",
        "عنوان_العملية",
        "التفاصيل",
        "المعرف_المرجعي",
        "الحالة",
        "التاريخ_والوقت",
        "عنوان_IP",
      ];

      const rows = filteredLogs.map((l) => [
        `"${l.id}"`,
        `"${l.userName}"`,
        `"${l.userRole}"`,
        `"${l.department || ""}"`,
        `"${l.actionType}"`,
        `"${l.actionTitle.replace(/"/g, '""')}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.targetEntityId || ""}"`,
        `"${l.status}"`,
        `"${l.timestamp}"`,
        `"${l.ipAddress || ""}"`,
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-log-${selectedUserId}-${now.toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (e) {
      console.error("Export CSV failed:", e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-[#E1EBE8] my-3 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-[#F6FAF8] border-b border-[#E1EBE8] p-4 sm:p-5 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#126B68] text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-[#193B3A]">
                    سجل النشاط والعمليات الرقابي (Audit Log)
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    مراقبة إدارية معتمدة
                  </span>
                </div>
                <p className="text-xs text-[#6B8581]">
                  توثيق دقيق لكافة العمليات المنجزة بالمنظومة وفق معايير الحوكمة والامتثال الصحي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-print-audit-log"
                onClick={handlePrint}
                className="p-2 sm:px-3 sm:py-2 bg-white hover:bg-gray-100 text-[#193B3A] text-xs font-bold rounded-xl border border-[#DCE8E5] transition-all flex items-center gap-1.5 cursor-pointer"
                title="طباعة سجل النشاط"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">طباعة</span>
              </button>

              <button
                id="btn-export-audit-csv"
                onClick={handleExportCsv}
                className="px-3.5 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="تصدير السجل كملف CSV"
              >
                <Download className="w-4 h-4" />
                <span>تصدير السجل (CSV)</span>
              </button>

              <button
                id="btn-close-audit-modal"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center border border-[#DCE8E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Account Switcher Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            <span className="text-[11px] font-bold text-[#6B8581] shrink-0">حساب المستخدم:</span>

            {/* All users option */}
            <button
              onClick={() => setSelectedUserId("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedUserId === "all"
                  ? "bg-[#193B3A] text-white shadow-xs"
                  : "bg-white text-[#526B66] border border-[#DCE8E5] hover:bg-gray-50"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>جميع المستخدمين (المراقبة العامة)</span>
            </button>

            {/* Each user pill */}
            {users.map((u) => {
              const isSelected = selectedUserId === u.id;
              const isCurrentSessionUser = currentUser.id === u.id;

              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? "bg-[#126B68] text-white border-[#126B68] shadow-xs"
                      : "bg-white text-[#193B3A] border-[#DCE8E5] hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isSelected ? "bg-white text-[#126B68]" : `${u.avatarBg} text-white`
                    }`}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <span>{u.name}</span>
                  {isCurrentSessionUser && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      أنت
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {exportSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم تصدير سجل العمليات والتدقيق بصيغة CSV بنجاح!</span>
            </div>
          )}
        </div>

        {/* Selected User Overview Card (when a single user is chosen) */}
        {activeSelectedUser && (
          <div className="bg-gradient-to-l from-[#F0F6F4] to-white p-4 border-b border-[#E1EBE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 ${activeSelectedUser.avatarBg} shadow-xs`}
              >
                {activeSelectedUser.name.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-[#193B3A]">{activeSelectedUser.name}</h4>
                  <span className="bg-[#126B68] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {activeSelectedUser.roleTitle}
                  </span>
                </div>
                <div className="text-xs text-[#6B8581] flex items-center gap-2 flex-wrap">
                  <span>القسم: <strong className="text-[#193B3A]">{activeSelectedUser.department}</strong></span>
                  <span>•</span>
                  <span>الرقم الوظيفي: <strong className="font-mono text-[#193B3A]">EMP-{activeSelectedUser.id.replace("usr-", "").toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>الحالة: <strong className="text-emerald-700">نشط ومتصل بالشبكة الداخلية</strong></span>
                </div>
              </div>
            </div>

            {onSelectUserForSwitch && currentUser.id !== activeSelectedUser.id && (
              <button
                onClick={() => {
                  onSelectUserForSwitch(activeSelectedUser);
                  onClose();
                }}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#126B68] text-xs font-black rounded-xl border border-[#C9E0D9] shadow-2xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>التبديل إلى هذا الحساب</span>
              </button>
            )}
          </div>
        )}

        {/* KPI Metric Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-[#F9FBFA] border-b border-[#E1EBE8] text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-[#E1EBE8] space-y-0.5">
            <span className="text-[10px] text-[#6B8581] font-bold block">إجمالي العمليات الموثقة</span>
            <div className="text-base font-black text-[#193B3A]">{stats.total}</div>
            <span className="text-[9px] text-[#126B68]">عملية مسجلة بالنظام</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#E1EBE8] space-y-0.5">
            <span className="text-[10px] text-rose-700 font-bold block">بلاغات تم تسجيلها</span>
            <div className="text-base font-black text-rose-800">{stats.reportsCreated}</div>
            <span className="text-[9px] text-gray-500">بلاغات صيانة وطوارئ</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#E1EBE8] space-y-0.5">
            <span className="text-[10px] text-sky-700 font-bold block">حالات تم تحديثها</span>
            <div className="text-base font-black text-sky-800">{stats.statusesUpdated}</div>
            <span className="text-[9px] text-gray-500">تغيير حالة بلاغ وأصل</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#E1EBE8] space-y-0.5">
            <span className="text-[10px] text-emerald-700 font-bold block">عمليات المخزون</span>
            <div className="text-base font-black text-emerald-800">{stats.inventoryActions}</div>
            <span className="text-[9px] text-gray-500">توريد وصرف مستودع</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#E1EBE8] space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-amber-700 font-bold block">أوامر وصيانة</span>
            <div className="text-base font-black text-amber-800">
              {stats.maintenanceActions + stats.orderActions}
            </div>
            <span className="text-[9px] text-gray-500">شراء ومعايرة دورية</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 bg-white border-b border-[#E1EBE8] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-[#F6FAF8] px-3 py-2 rounded-xl border border-[#DCE8E5]">
            <Search className="w-4 h-4 text-[#6B8581] shrink-0" />
            <input
              id="input-search-audit-log"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في العمليات، كود البلاغ، التفاصيل..."
              className="w-full bg-transparent text-[#193B3A] text-xs focus:outline-none font-medium placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Type Filter */}
          <div className="flex items-center gap-2 bg-[#F6FAF8] px-3 py-2 rounded-xl border border-[#DCE8E5]">
            <Filter className="w-4 h-4 text-[#126B68] shrink-0" />
            <select
              id="select-audit-action-type"
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="w-full bg-transparent text-[#193B3A] font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">كافة أنواع العمليات</option>
              <option value="إنشاء بلاغ">إنشاء بلاغ عطل</option>
              <option value="تحديث حالة بلاغ">تحديث حالة بلاغ</option>
              <option value="حركة مخزون">حركة مخزون وتوريد</option>
              <option value="أمر شراء">أوامر شراء واعتمادات</option>
              <option value="صيانة ومعايرة">صيانة ومعايرة دورية</option>
              <option value="إجراء إداري">إجراء إداري ورقابي</option>
              <option value="استشارة ذكية">استشارة سريرية (منار AI)</option>
              <option value="تبديل هوية">تسجيل دخول وتبديل هوية</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2 bg-[#F6FAF8] px-3 py-2 rounded-xl border border-[#DCE8E5]">
            <Calendar className="w-4 h-4 text-[#126B68] shrink-0" />
            <select
              id="select-audit-period"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as "all" | "today" | "week" | "month")}
              className="w-full bg-transparent text-[#193B3A] font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">كافة التواريخ والسجلات</option>
              <option value="today">سجلات اليوم فقط</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">سجلات هذا الشهر</option>
            </select>
          </div>
        </div>

        {/* Scrollable Log Entries List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-[#E1EBE8] space-y-2">
              <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto" />
              <h4 className="text-sm font-black text-[#193B3A]">لا توجد عمليات تطابق معايير البحث</h4>
              <p className="text-xs text-[#6B8581]">
                جرّب تعديل نوع العملية أو النطاق الزمني لعرض السجلات المسجلة.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getActionBadge(log.actionType);
              const logDate = new Date(log.timestamp);
              const formattedDate = logDate.toLocaleDateString("ar-SA", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = logDate.toLocaleTimeString("ar-SA", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E1EBE8] shadow-2xs hover:shadow-xs transition-all space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${badge.iconBg} shadow-2xs`}
                      >
                        {badge.icon}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badge.color}`}
                        >
                          {log.actionType}
                        </span>

                        <span className="font-mono text-[10px] text-gray-400">{log.id}</span>

                        {log.targetEntityId && (
                          <span className="font-mono text-[10px] font-bold bg-gray-100 text-[#193B3A] px-2 py-0.5 rounded">
                            المرجع: {log.targetEntityId}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#6B8581] self-start sm:self-auto">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formattedDate} • {formattedTime}</span>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          log.status === "معتمد" || log.status === "مكتمل" || log.status === "ناجح"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>

                  {/* Action Title & Performer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-[#193B3A]">{log.actionTitle}</h4>

                      {/* Performer Pill */}
                      <div className="flex items-center gap-1.5 text-xs text-[#526B66] shrink-0 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                            log.userAvatarBg || "bg-[#126B68]"
                          }`}
                        >
                          {log.userName.charAt(0)}
                        </div>
                        <span className="font-bold">{log.userName}</span>
                        <span className="text-[10px] text-gray-400 font-normal">({log.department || log.userRole})</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#5A736F] leading-relaxed pt-0.5">{log.details}</p>
                  </div>

                  {/* Audit Metadata Footer */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#8B9A97]">
                    <div className="flex items-center gap-3 flex-wrap font-mono">
                      {log.ipAddress && (
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-gray-400" />
                          <span>IP: {log.ipAddress}</span>
                        </span>
                      )}
                      {log.deviceInfo && (
                        <span className="flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-gray-400" />
                          <span>{log.deviceInfo}</span>
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-emerald-700 font-bold">
                      ✓ تم التدقيق والمطابقة إلكترونياً
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F6FAF8] border-t border-[#E1EBE8] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#6B8581] text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#126B68]" />
            <span>
              نظام الرقابة الإدارية الموحد — سجلات غير قابلة للتعديل أو الحذف وفق اشتراطات الأمن السيبراني الصحي
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-gray-100 text-[#193B3A] font-black rounded-xl border border-[#DCE8E5] transition-all cursor-pointer self-end sm:self-auto"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
