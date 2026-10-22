import React from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Activity,
  FileText,
  Building2,
  Award,
  Boxes,
  Sparkles,
  Truck,
  DollarSign,
  ShoppingCart,
  QrCode,
  PlusCircle,
  PhoneCall,
  User,
  Shield,
  RefreshCw,
  Wifi,
  WifiOff,
  BellRing,
  HelpCircle,
  AlertTriangle,
  FileSpreadsheet,
  ChevronLeft,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { UserProfile, SyncStatus } from "../types";
import { ThemePreference } from "../utils/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNewReport: () => void;
  openScanner: () => void;
  urgentReportsCount: number;
  currentUser: UserProfile;
  onOpenRoleSwitcher: () => void;
  onStartTour?: () => void;
  // Theme props
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  isDark: boolean;
  isNightShift: boolean;
  themeReason: string;
  // Connection and Sync props
  isOnline: boolean;
  isSimulatedOffline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  onOpenSyncModal: () => void;
  onTriggerSync: () => void;
  // Push Notification props
  onOpenPushModal?: () => void;
  isPushSubscribed?: boolean;
  // Regulatory modals
  onOpenSfdaModal?: () => void;
  onOpenAuditModal?: () => void;
  onOpenUserAuditLog?: (userId?: string) => void;
  onOpenSystemConfig?: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  openNewReport,
  openScanner,
  urgentReportsCount,
  currentUser,
  onOpenRoleSwitcher,
  onStartTour,
  themePreference,
  setThemePreference,
  isDark,
  isNightShift,
  themeReason,
  isOnline,
  isSimulatedOffline,
  syncStatus,
  pendingCount,
  onOpenSyncModal,
  onTriggerSync,
  onOpenPushModal,
  isPushSubscribed = false,
  onOpenSfdaModal,
  onOpenAuditModal,
  onOpenUserAuditLog,
  onOpenSystemConfig,
}) => {
  const { t } = useTranslation();
  const effectiveOnline = isOnline && !isSimulatedOffline;

  if (!isOpen) return null;

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  const primaryNavigation = [
    {
      id: "dashboard",
      label: "لوحة التحكم الحية",
      sublabel: "مؤشرات الأداء التشغيلي والامتثال",
      icon: Activity,
    },
    {
      id: "reports",
      label: "البلاغات وأوامر العمل",
      sublabel: "أعطال الأجهزة والصيانة الطبية",
      icon: FileText,
      badge: urgentReportsCount > 0 ? `${urgentReportsCount} عاجل` : undefined,
      badgeColor: "bg-[#C94D4D] text-white",
    },
    {
      id: "assets",
      label: "الأجهزة والمعدات الطبية",
      sublabel: "سجل الأصول، المعايرة، وتاريخ الصيانة",
      icon: Building2,
    },
    {
      id: "ppm",
      label: "الصيانة الوقائية (CBAHI)",
      sublabel: "معايير الاعتماد والجدولة الدورية",
      icon: Award,
      badge: "معايير سباهي",
      badgeColor: "bg-[#F4C96B] text-[#193B3A]",
    },
    {
      id: "inventory",
      label: "المستودع وقطع الغيار",
      sublabel: "المخزون الطبي وحركات الصرف",
      icon: Boxes,
    },
    {
      id: "manar",
      label: "طبيبتك منار - المساعد الذكي",
      sublabel: "استشارات الصيانة، التشخيص، والسلامة",
      icon: Sparkles,
      badge: "ذكاء اصطناعي",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    },
  ];

  const secondaryNavigation = [
    {
      id: "logistics",
      label: "اللوجستيات والإمداد",
      sublabel: "شحنات قطع الغيار والموردين",
      icon: Truck,
    },
    {
      id: "finance",
      label: "الإدارة المالية والعقود",
      sublabel: "فواتير الصيانة، التكاليف، والضمان",
      icon: DollarSign,
    },
    {
      id: "marketplace",
      label: "المشتريات والتوريد",
      sublabel: "طلبات الشراء والتعميد المباشر",
      icon: ShoppingCart,
    },
  ];

  const isTabAllowed = (tabId: string) =>
    currentUser.role === "admin" || currentUser.allowedTabs.includes(tabId);

  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-[85vw] sm:max-w-sm bg-white dark:bg-[#102421] text-[#193B3A] dark:text-[#EDF7F4] h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#E1EBE8] dark:border-[#1A3B36] flex items-center justify-between bg-[#F8FCFB] dark:bg-[#142C28]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#126B68] flex items-center justify-center text-white shadow-xs p-1">
              <img
                src="/assets/images/favicon.png"
                alt="عين المستشفى"
                className="w-full h-full object-contain filter brightness-110"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="text-sm font-black text-[#193B3A] dark:text-white leading-tight">
                قائمة النظام الشاملة
              </div>
              <div className="text-[10px] text-[#6B8581] dark:text-[#9DBBB4] font-bold">
                عين المستشفى • Hospital Eye
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B8581] hover:text-[#193B3A] dark:text-[#9DBBB4] dark:hover:text-white bg-gray-100 dark:bg-[#1C3A35] hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          {/* User Profile Card */}
          <div className="bg-[#F1FAF8] dark:bg-[#153430] border border-[#CDE5DF] dark:border-[#1F4943] p-3.5 rounded-2xl shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#126B68] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  <User className="w-5 h-5 text-[#F4C96B]" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-[#193B3A] dark:text-[#EDF7F4] leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-[#63807B] dark:text-[#9DBBB4] font-medium mt-0.5">
                    {currentUser.department}
                  </div>
                </div>
              </div>

              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-[#126B68] text-[#F4C96B] shrink-0">
                {currentUser.roleTitle}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#D9ECE7] dark:border-[#1F4741] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onOpenRoleSwitcher();
                    onClose();
                  }}
                  className="text-[11px] font-bold text-[#126B68] dark:text-[#4ECDC4] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>تبديل الحساب</span>
                </button>

                {onOpenUserAuditLog && (
                  <button
                    onClick={() => {
                      onOpenUserAuditLog(currentUser.id);
                      onClose();
                    }}
                    className="text-[11px] font-bold text-[#D97706] dark:text-[#F4C96B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>سجل النشاط (Audit Log)</span>
                  </button>
                )}

                {onOpenSystemConfig && (
                  <button
                    onClick={() => {
                      onOpenSystemConfig();
                      onClose();
                    }}
                    className="text-[11px] font-bold text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>قواعد النظام المرن</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  onOpenSyncModal();
                  onClose();
                }}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  !effectiveOnline
                    ? "bg-red-500 text-white"
                    : pendingCount > 0
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                }`}
              >
                {effectiveOnline ? (
                  <Wifi className="w-3 h-3 inline" />
                ) : (
                  <WifiOff className="w-3 h-3 inline" />
                )}
                <span>
                  {!effectiveOnline
                    ? "دون اتصال"
                    : pendingCount > 0
                    ? `معلق (${pendingCount})`
                    : "متصل"}
                </span>
              </button>
            </div>
          </div>

          {/* Emergency & Fast Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                openNewReport();
                onClose();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#126B68] text-white text-xs font-bold shadow-xs active:scale-95 transition-transform text-right cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0 text-[#F4C96B]" />
              <div className="truncate">تسجيل بلاغ عاجل</div>
            </button>

            <button
              onClick={() => {
                openScanner();
                onClose();
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#E9F5F2] dark:bg-[#173833] text-[#126B68] dark:text-[#4ECDC4] text-xs font-bold border border-[#CDE5DF] dark:border-[#234F49] active:scale-95 transition-transform text-right cursor-pointer"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <div className="truncate">مسح كود QR</div>
            </button>
          </div>

          {/* Section 1: Clinical & Operational Modules */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[#8A9F9B] dark:text-[#7B9E97] mb-2 px-1">
              العمليات الطبية والتشغيلية
            </div>
            <div className="space-y-1">
              {primaryNavigation.filter((item) => isTabAllowed(item.id)).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id} data-module={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-right cursor-pointer ${
                      isActive
                        ? "bg-[#126B68] text-white font-black shadow-xs"
                        : "hover:bg-gray-100 dark:hover:bg-[#15322D] text-[#334D49] dark:text-[#D1E3DF]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#F0F6F4] dark:bg-[#183B36] text-[#126B68] dark:text-[#4ECDC4]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate leading-tight">{item.label}</div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? "text-white/80" : "text-[#7B9591] dark:text-[#8AA39F]"
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            item.badgeColor || "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronLeft
                        className={`w-4 h-4 ${isActive ? "text-white" : "text-[#A1B5B1]"}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Administrative & Support Services */}
          {secondaryNavigation.some((item) => isTabAllowed(item.id)) && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#8A9F9B] dark:text-[#7B9E97] mb-2 px-1">
                الإدارات والخدمات المساندة
              </div>
              <div className="space-y-1">
                {secondaryNavigation.filter((item) => isTabAllowed(item.id)).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id} data-module={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-right cursor-pointer ${
                        isActive
                          ? "bg-[#126B68] text-white font-black shadow-xs"
                          : "hover:bg-gray-100 dark:hover:bg-[#15322D] text-[#334D49] dark:text-[#D1E3DF]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-[#F0F6F4] dark:bg-[#183B36] text-[#126B68] dark:text-[#4ECDC4]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate leading-tight">
                            {item.label}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isActive ? "text-white/80" : "text-[#7B9591] dark:text-[#8AA39F]"
                            }`}
                          >
                            {item.sublabel}
                          </div>
                        </div>
                      </div>
                      <ChevronLeft
                        className={`w-4 h-4 ${isActive ? "text-white" : "text-[#A1B5B1]"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Regulatory, Compliance & Quality Tools */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[#8A9F9B] dark:text-[#7B9E97] mb-2 px-1">
              الرقابة والاعتماد والجودة
            </div>
            <div className="space-y-1">
              {onOpenSfdaModal && (
                <button
                  onClick={() => {
                    onOpenSfdaModal();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-800 dark:text-amber-300 transition-all text-right cursor-pointer border border-amber-200/60 dark:border-amber-900/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate leading-tight">
                        تنبيهات الغذاء والدواء (SFDA)
                      </div>
                      <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate">
                        استدعاءات الأجهزة الطبية وسلامة المرضى
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-amber-500 shrink-0" />
                </button>
              )}

              {onOpenAuditModal && (
                <button
                  onClick={() => {
                    onOpenAuditModal();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 transition-all text-right cursor-pointer border border-emerald-200/60 dark:border-emerald-900/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate leading-tight">
                        تقارير تدقيق الاعتماد (CBAHI)
                      </div>
                      <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                        تصدير سجلات الامتثال والفحص الدوري
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-emerald-500 shrink-0" />
                </button>
              )}
            </div>
          </div>

          {/* Section 4: System Tools & Settings */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[#8A9F9B] dark:text-[#7B9E97] mb-2 px-1">
              أدوات وميزات النظام
            </div>
            <div className="space-y-1">
              {/* Offline sync modal trigger */}
              <button
                onClick={() => {
                  onOpenSyncModal();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#15322D] text-[#334D49] dark:text-[#D1E3DF] transition-all text-right cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F6F4] dark:bg-[#183B36] flex items-center justify-center text-[#126B68] dark:text-[#4ECDC4] shrink-0">
                    <RefreshCw
                      className={`w-4 h-4 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
                    />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate leading-tight">
                      التخزين المحلي والمزامنة
                    </div>
                    <div className="text-[10px] text-[#7B9591] dark:text-[#8AA39F] truncate">
                      إدارة العمل دون إنترنت وقائمة الانتظار
                    </div>
                  </div>
                </div>
                {pendingCount > 0 ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white">
                    {pendingCount} معلق
                  </span>
                ) : (
                  <ChevronLeft className="w-4 h-4 text-[#A1B5B1]" />
                )}
              </button>

              {/* Push notifications trigger */}
              {onOpenPushModal && (
                <button
                  onClick={() => {
                    onOpenPushModal();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#15322D] text-[#334D49] dark:text-[#D1E3DF] transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F0F6F4] dark:bg-[#183B36] flex items-center justify-center text-[#126B68] dark:text-[#4ECDC4] shrink-0">
                      <BellRing
                        className={`w-4 h-4 ${isPushSubscribed ? "text-[#126B68] dark:text-[#4ECDC4]" : ""}`}
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate leading-tight">
                        إشعارات الدفع الفورية (Push)
                      </div>
                      <div className="text-[10px] text-[#7B9591] dark:text-[#8AA39F] truncate">
                        {isPushSubscribed ? "الخدمة مفعلة ونشطة ✓" : "تنبيهات البلاغات في الخلفية"}
                      </div>
                    </div>
                  </div>
                  {isPushSubscribed ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      مفعلة
                    </span>
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-[#A1B5B1]" />
                  )}
                </button>
              )}

              {/* Guided Tour */}
              {onStartTour && (
                <button
                  onClick={() => {
                    onStartTour();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#15322D] text-[#334D49] dark:text-[#D1E3DF] transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F0F6F4] dark:bg-[#183B36] flex items-center justify-center text-[#126B68] dark:text-[#4ECDC4] shrink-0">
                      <HelpCircle className="w-4 h-4 text-[#F4C96B]" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate leading-tight">
                        الجولة الإرشادية للنظام
                      </div>
                      <div className="text-[10px] text-[#7B9591] dark:text-[#8AA39F] truncate">
                        شرح تفاعلي لكل أقسام وميزات المستشفى
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#A1B5B1]" />
                </button>
              )}

              {/* Emergency Options: Clearly separating internal hospital emergency from external ambulance */}
              <div className="space-y-1.5">
                <a
                  href="tel:2222"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 transition-all text-right cursor-pointer border border-red-200/70 dark:border-red-900/40"
                  aria-label="اتصال داخلي بغرفة طوارئ وعمليات المستشفى"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-300 shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate leading-tight">
                        غرفة طوارئ المستشفى (داخلي 2222)
                      </div>
                      <div className="text-[10px] text-red-600/80 dark:text-red-400/80 truncate">
                        لإنعاش القلب (Code Blue) وحوادث الأجهزة
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-red-600 text-white px-2 py-0.5 rounded-lg shrink-0">
                    داخلي
                  </span>
                </a>

                <a
                  href="tel:997"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 transition-all text-right cursor-pointer border border-emerald-200/70 dark:border-emerald-900/40"
                  aria-label="اتصال بإسعاف الهلال الأحمر 997"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate leading-tight">
                        إسعاف الهلال الأحمر (997)
                      </div>
                      <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                        نقل الحالات الإسعافية الخارجية والإخلاء
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded-lg shrink-0">
                    997
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Preferences */}
        <div className="p-3.5 border-t border-[#E1EBE8] dark:border-[#1A3B36] bg-[#F8FCFB] dark:bg-[#142C28] flex items-center justify-between gap-2">
          {/* Eye-care Theme Toggle */}
          <ThemeToggle
            preference={themePreference}
            setPreference={setThemePreference}
            isDark={isDark}
            isNightShift={isNightShift}
            activeReason={themeReason}
          />

          {/* Language Switcher */}
          <LanguageToggle />
        </div>
      </div>
    </div>
  );
};
