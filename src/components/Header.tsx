import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  AlertTriangle,
  Building2,
  FileText,
  Boxes,
  Truck,
  DollarSign,
  Sparkles,
  PhoneCall,
  QrCode,
  PlusCircle,
  Award,
  User,
  Shield,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronDown,
  ShoppingCart,
  HelpCircle,
  BellRing,
  Menu,
  Sliders,
  Layers,
  Phone,
  AlertCircle,
  X,
} from "lucide-react";
import { UserProfile, SyncStatus } from "../types";
import { ThemePreference } from "../utils/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNewReport: () => void;
  openScanner: () => void;
  urgentReportsCount: number;
  openNewAsset: () => void;
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
  // Mobile drawer trigger
  onOpenMobileDrawer?: () => void;
  // Audit Log
  onOpenAuditLog?: (userId?: string) => void;
  // System Config / Flexibility Hub
  onOpenSystemConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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
  onOpenMobileDrawer,
  onOpenAuditLog,
  onOpenSystemConfig,
}) => {
  const { t } = useTranslation();
  const effectiveOnline = isOnline && !isSimulatedOffline;
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const toolbarDrag = useRef({ x: 0, scroll: 0, active: false, moved: false });


  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Primary navigation tabs
  const primaryTabs = [
    { id: "dashboard", label: t("nav.dashboard"), icon: Activity },
    { id: "reports", label: t("nav.reports"), icon: FileText, badge: urgentReportsCount },
    { id: "assets", label: t("nav.assets"), icon: Building2 },
    { id: "ppm", label: t("nav.ppm"), icon: Award, highlight: true },
    { id: "inventory", label: t("nav.inventory"), icon: Boxes },
    { id: "manar", label: t("nav.manar"), icon: Sparkles, special: true },
  ];

  // Secondary administrative / support tabs grouped in 'More'
  const secondaryTabs = [
    { id: "logistics", label: t("nav.logistics"), icon: Truck, desc: t("nav.logisticsDesc") },
    { id: "finance", label: t("nav.finance"), icon: DollarSign, desc: t("nav.financeDesc") },
    { id: "marketplace", label: t("nav.marketplace"), icon: ShoppingCart, desc: t("nav.marketplaceDesc") },
  ];

  // Check role authorization
  const allowedPrimaryTabs = primaryTabs.filter(
    (tab) => currentUser.role === "admin" || currentUser.allowedTabs.includes(tab.id)
  );
  const allowedSecondaryTabs = secondaryTabs.filter(
    (tab) => currentUser.role === "admin" || currentUser.allowedTabs.includes(tab.id)
  );

  const isSecondaryActive = allowedSecondaryTabs.some((tab) => tab.id === activeTab);
  const activeSecondaryTab = allowedSecondaryTabs.find((tab) => tab.id === activeTab);

  return (
    <header className="workspace-header sticky top-0 z-40 bg-white dark:bg-[#102421] border-b border-[#E1EBE8] dark:border-[#1A3B36] shadow-xs transition-colors">
      {/* Top Banner: Status & Identity */}
      <div
        className="workspace-top-toolbar bg-[#193B3A] text-white px-3 sm:px-4 py-1.5 text-xs flex items-center justify-between gap-2"
        role="region" aria-label="شريط أدوات النظام — قابل للتمرير أفقيًا" tabIndex={0}
        onPointerDown={event => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          toolbarDrag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, active: true, moved: false };
        }}
        onPointerMove={event => {
          const drag = toolbarDrag.current;
          if (!drag.active || event.buttons !== 1) return;
          if (Math.abs(event.clientX - drag.x) > 5) {
            drag.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.scrollLeft = drag.scroll - (event.clientX - drag.x);
          }
        }}
        onPointerUp={() => { toolbarDrag.current.active = false; }}
        onPointerCancel={() => { toolbarDrag.current.active = false; toolbarDrag.current.moved = false; }}
        onClickCapture={event => {
          if (toolbarDrag.current.moved) { event.preventDefault(); event.stopPropagation(); toolbarDrag.current.moved = false; }
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 animate-pulse"></span>
            <span className="font-semibold text-[#D6E5E1] hidden sm:inline text-[11px]">
              {t("app.bannerText")}
            </span>
            <span className="font-semibold text-[#D6E5E1] sm:hidden text-[11px]">
              {t("app.shortBanner")}
            </span>
          </div>

          {/* Connection & Local Storage Status Badge */}
          <button
            onClick={onOpenSyncModal}
            aria-label="عرض حالة الاتصال والتخزين المؤقت المحلي والمزامنة"
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              !effectiveOnline
                ? "bg-[#EF4444] text-white shadow-xs animate-pulse"
                : syncStatus === "syncing"
                ? "bg-[#2563EB] text-white"
                : pendingCount > 0
                ? "bg-[#D97706] text-white"
                : "bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#A7F3D0] border border-[#10B981]/40"
            }`}
            title="انقر لعرض تفاصيل التخزين المؤقت المحلي والمزامنة"
          >
            {effectiveOnline ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping inline-block"></span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
            )}

            {!effectiveOnline ? (
              <span className="flex items-center gap-1">
                <WifiOff className="w-3 h-3 inline" />
                <span>{t("app.offline")} {pendingCount > 0 ? `(${pendingCount})` : ""}</span>
              </span>
            ) : syncStatus === "syncing" ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin inline" />
                <span>{t("app.syncing")}</span>
              </span>
            ) : pendingCount > 0 ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 inline" />
                <span>{pendingCount}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-[#10B981] inline" />
                <span className="hidden md:inline">{t("app.online")}</span>
                <span className="md:hidden">{t("app.onlineShort")}</span>
              </span>
            )}
          </button>
        </div>

        {/* Desktop Banner Tools */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Language Switcher for Medical & Foreign Staff */}
          <LanguageToggle />

          {/* Eye-Care Dark/Light/Auto Mode Shift Switcher */}
          <ThemeToggle
            preference={themePreference}
            setPreference={setThemePreference}
            isDark={isDark}
            isNightShift={isNightShift}
            activeReason={themeReason}
          />

          {/* Push Notifications Status Button */}
          {onOpenPushModal && (
            <button
              id="tour-push-btn"
              onClick={onOpenPushModal}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all border cursor-pointer shrink-0 ${
                isPushSubscribed
                  ? "bg-[#126B68]/60 hover:bg-[#126B68]/80 text-[#5EEAD4] border-[#126B68]"
                  : "bg-white/10 hover:bg-white/20 text-[#D6E5E1] border-white/15"
              }`}
              title="نظام إشعارات الدفع الفورية (Web Push via Service Worker)"
            >
              <BellRing
                className={`w-3.5 h-3.5 ${
                  isPushSubscribed ? "text-[#5EEAD4] animate-pulse" : "text-[#F4C96B]"
                }`}
              />
              <span className="hidden sm:inline">
                {isPushSubscribed ? "إشعارات الدفع نشطة" : "إشعارات الدفع"}
              </span>
            </button>
          )}

          {/* Guided Tour Trigger Button */}
          <button
            id="tour-start-btn"
            onClick={onStartTour}
            className="flex items-center gap-1 sm:gap-1.5 bg-[#126B68]/30 hover:bg-[#126B68]/50 text-[#CDE5DF] hover:text-white px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all border border-[#126B68]/60 cursor-pointer shadow-2xs shrink-0"
            title={t("app.guidedTour")}
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#F4C96B]" />
            <span className="hidden sm:inline">{t("app.guidedTour")}</span>
          </button>

          {/* Active User Chip / Role Switcher trigger */}
          <button
            id="tour-role-btn"
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-1 sm:gap-1.5 bg-white/10 hover:bg-white/20 text-[#D6E5E1] px-2 sm:px-2.5 py-0.5 rounded-full font-bold transition-colors cursor-pointer border border-white/10 shrink-0"
            title="انقر لتبديل الهوية والصلاحيات"
          >
            <User className="w-3 h-3 text-[#F4C96B]" />
            <span className="text-[10px] sm:text-[11px] truncate max-w-[70px] sm:max-w-none">{currentUser.name}</span>
            <span className="text-[9px] sm:text-[10px] bg-[#126B68] text-[#F4C96B] px-1 sm:px-1.5 py-0.2 rounded font-black">
              {currentUser.roleTitle.split(" ")[0]}
            </span>
          </button>

          {/* Audit Log / Activity Log Trigger Button */}
          {onOpenAuditLog && (
            <button
              id="header-audit-log-btn"
              onClick={() => onOpenAuditLog(currentUser.id)}
              className="flex items-center gap-1 bg-[#F4C96B]/15 hover:bg-[#F4C96B]/25 text-[#F4C96B] px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer border border-[#F4C96B]/30 shrink-0 text-[10px] sm:text-[11px]"
              title="سجل النشاط والرقابة الإدارية (Audit Log)"
            >
              <Shield className="w-3 h-3 text-[#F4C96B]" />
              <span className="hidden sm:inline">سجل النشاط</span>
            </button>
          )}

          {/* System Flexibility & Config Trigger Button */}
          {onOpenSystemConfig && (
            <button
              id="header-system-config-btn"
              onClick={onOpenSystemConfig}
              className="flex items-center gap-1 bg-[#2DD4BF]/15 hover:bg-[#2DD4BF]/25 text-[#2DD4BF] px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer border border-[#2DD4BF]/30 shrink-0 text-[10px] sm:text-[11px]"
              title="مركز التحكم وقواعد النظام المرنة (تخصيص الأكواد والأقسام والسكن)"
            >
              <Sliders className="w-3 h-3 text-[#2DD4BF]" />
              <span className="hidden sm:inline">قواعد النظام المرن</span>
            </button>
          )}

          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-1 text-[#F4C96B] hover:text-[#f8d88e] font-bold transition-colors text-[10px] sm:text-[11px] shrink-0 cursor-pointer"
            title="أرقام وخطوط طوارئ المستشفى والإسعاف"
            aria-label="عرض خطوط طوارئ المستشفى والإسعاف"
          >
            <PhoneCall className="w-3 h-3" />
            <span className="hidden sm:inline">{t("app.emergency")}</span>
          </button>
        </div>

        {/* Mobile Header Quick Actions in Banner */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          {/* Active User Chip on Mobile */}
          <button
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-1 bg-white/10 text-[#D6E5E1] px-2 py-0.5 rounded-full font-bold text-[10px] border border-white/10 shrink-0"
            title="انقر لتبديل الحساب"
          >
            <User className="w-3 h-3 text-[#F4C96B]" />
            <span className="truncate max-w-[80px]">{currentUser.name.split(" ")[0]}</span>
          </button>

          {/* Mobile Audit Log Button */}
          {onOpenAuditLog && (
            <button
              onClick={() => onOpenAuditLog(currentUser.id)}
              className="flex items-center gap-1 bg-[#F4C96B]/15 text-[#F4C96B] p-1 rounded-full text-[10px] border border-[#F4C96B]/30 shrink-0"
              title="سجل النشاط والرقابة الإدارية"
            >
              <Shield className="w-3 h-3 text-[#F4C96B]" />
            </button>
          )}

          {/* Mobile System Config Button */}
          {onOpenSystemConfig && (
            <button
              onClick={onOpenSystemConfig}
              className="flex items-center gap-1 bg-[#2DD4BF]/15 text-[#2DD4BF] p-1 rounded-full text-[10px] border border-[#2DD4BF]/30 shrink-0"
              title="مركز التحكم وقواعد النظام المرنة"
            >
              <Sliders className="w-3 h-3 text-[#2DD4BF]" />
            </button>
          )}

          {/* Emergency Hotline shortcut */}
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-1 text-[#F4C96B] font-bold text-[10px] shrink-0 bg-red-950/40 px-2 py-0.5 rounded-full border border-red-500/30 cursor-pointer"
            title="أرقام وخطوط طوارئ المستشفى والإسعاف"
            aria-label="عرض خطوط طوارئ المستشفى والإسعاف"
          >
            <PhoneCall className="w-3 h-3" />
            <span>طوارئ</span>
          </button>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div
          id="tour-brand"
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group min-w-0"
          onClick={() => setActiveTab("dashboard")}
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#126B68] flex items-center justify-center text-white shadow-xs overflow-hidden p-1.5 shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/assets/images/favicon.png"
              alt="عين المستشفى"
              className="w-full h-full object-contain filter brightness-110"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-xl font-black text-[#193B3A] dark:text-[#EDF7F4] tracking-tight truncate">
                {t("app.title")}
              </h1>
              <span className="bg-[#DDF4F0] dark:bg-[#173D38] text-[#126B68] dark:text-[#4ECDC4] text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                {t("app.subtitle")}
              </span>
            </div>
            <p className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4] font-medium hidden sm:block">
              {t("app.subDescription")}
            </p>
          </div>
        </div>

        {/* Mobile Quick Action & Hamburger Button */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={openNewReport}
            className="flex items-center gap-1 px-2.5 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            title="تسجيل بلاغ عاجل"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>بلاغ</span>
          </button>

          {onOpenMobileDrawer && (
            <button
              onClick={onOpenMobileDrawer}
              className="relative p-2 rounded-xl bg-[#E9F5F2] dark:bg-[#153430] hover:bg-[#d8ece8] dark:hover:bg-[#1C423D] text-[#126B68] dark:text-[#4ECDC4] border border-[#CDE5DF] dark:border-[#204944] active:scale-95 transition-all cursor-pointer"
              title="القائمة الشاملة للنظام"
              aria-label="القائمة الشاملة للنظام"
            >
              <Menu className="w-5 h-5" />
              {(urgentReportsCount > 0 || pendingCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C94D4D] ring-2 ring-white dark:ring-[#102421] animate-pulse" />
              )}
            </button>
          )}
        </div>

        {/* Desktop Quick Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {/* Quick sync button if pending */}
          {effectiveOnline && pendingCount > 0 && (
            <button
              onClick={onTriggerSync}
              disabled={syncStatus === "syncing"}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="مزامنة التغييرات المحلية المعلقة فوراً"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">{t("actions.syncNow")} ({pendingCount})</span>
            </button>
          )}

          {/* Scan QR Button */}
          <button
            id="tour-scanner-btn"
            onClick={openScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#E9F5F2] dark:bg-[#153430] hover:bg-[#d8ece8] dark:hover:bg-[#1C423D] text-[#126B68] dark:text-[#4ECDC4] text-xs font-bold rounded-xl transition-all border border-[#CDE5DF] dark:border-[#204944] active:scale-95 cursor-pointer"
            title="مسح كود QR لجهاز طبي أو موقع"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">{t("actions.scanQr")}</span>
          </button>

          {/* Manar Assistant Button */}
          <button
            id="tour-manar-btn"
            data-module="manar" onClick={() => setActiveTab("manar")}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F6F7FB] dark:bg-[#152825] hover:bg-[#EBEDF7] dark:hover:bg-[#1A3330] text-[#374151] dark:text-[#D1D5DB] text-xs font-bold rounded-xl border border-[#E0E2EE] dark:border-[#20443F] transition-all active:scale-95 cursor-pointer"
            title="طبيبتك منار - المساعد الذكي"
          >
            <Sparkles className="w-4 h-4 text-[#F4C96B]" />
            <span className="hidden md:inline">{t("nav.manar")}</span>
          </button>

          {/* Primary Action: New Report */}
          <button
            id="tour-new-report-btn"
            onClick={openNewReport}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            title="تسجيل بلاغ عطل أو ملاحظة عاجلة"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("actions.newReport")}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation - Desktop Only (Mobile uses MobileBottomNav & MobileNavDrawer) */}
      <div className="workspace-header-tabs hidden md:block max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between border-t border-[#EDF4F2] dark:border-[#1A3B36] pt-0.5">
          {/* Primary Tabs */}
          <div className="flex space-x-1 space-x-reverse overflow-x-auto scrollbar-none py-0.5">
            {allowedPrimaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-module={tab.id}
                  aria-current={isActive ? "page" : undefined}
                  id={tab.id === "reports" ? "tour-reports-tab" : undefined}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all relative shrink-0 cursor-pointer ${
                    isActive
                      ? "border-[#126B68] dark:border-[#4ECDC4] text-[#126B68] dark:text-[#4ECDC4] bg-[#F1FAF8] dark:bg-[#153430]"
                      : "border-transparent text-[#667E7A] dark:text-[#9DBBB4] hover:text-[#193B3A] dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#15302C]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-[#126B68] dark:text-[#4ECDC4]" : "text-[#7C9894] dark:text-[#6D8C86]"}`} />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-[#C9684D] text-white text-[10px] flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  ) : null}
                  {tab.special && (
                    <span className="w-2 h-2 rounded-full bg-[#F4C96B]"></span>
                  )}
                  {tab.highlight && (
                    <span className="text-[9px] bg-[#F4C96B] text-[#193B3A] font-black px-1.5 py-0.2 rounded-md">
                      CBAHI
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary 'More' Dropdown for administrative tabs */}
          {allowedSecondaryTabs.length > 0 && (
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isSecondaryActive
                    ? "bg-[#126B68] text-white border-[#126B68]"
                    : "bg-white dark:bg-[#122624] text-[#667E7A] dark:text-[#9DBBB4] border-[#DCE8E5] dark:border-[#1F423E] hover:text-[#193B3A] hover:bg-gray-50 dark:hover:bg-[#17332E]"
                }`}
                title="إدارات ومرافق إضافية"
              >
                <span>{isSecondaryActive ? activeSecondaryTab?.label : t("nav.more")}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isMoreMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isMoreMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#122624] rounded-2xl shadow-xl border border-[#E1EBE8] dark:border-[#1F423E] py-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#8B9A97] dark:text-[#7D9993] border-b border-[#F0F4F2] dark:border-[#1F423E] mb-1">
                    {t("nav.supportDepts")}
                  </div>
                  {allowedSecondaryTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                  data-module={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 text-right transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#F1FAF8] dark:bg-[#153430] text-[#126B68] dark:text-[#4ECDC4] font-black"
                            : "text-[#374151] dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#15302C] font-bold"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? "bg-[#126B68] text-white" : "bg-gray-100 dark:bg-[#1A3833] text-[#6B7280] dark:text-[#8AA39F]"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-xs">
                          <div>{tab.label}</div>
                          <div className="text-[10px] text-[#9CA3AF] dark:text-[#7D9993] font-normal">{tab.desc}</div>
                        </div>
                      </button>
                    );
                  })}

                  {onOpenPushModal && (
                    <button
                      onClick={() => {
                        onOpenPushModal();
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full flex items-start gap-2.5 px-3 py-2 text-right transition-colors cursor-pointer text-[#374151] dark:text-[#D1D5DB] hover:bg-gray-50 dark:hover:bg-[#15302C] font-bold border-t border-[#F0F4F2] dark:border-[#1F423E] mt-1"
                    >
                      <div className="p-1.5 rounded-lg shrink-0 bg-[#126B68]/15 text-[#126B68] dark:text-[#5EEAD4]">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div>إشعارات الدفع (Push)</div>
                        <div className="text-[10px] text-[#9CA3AF] dark:text-[#7D9993] font-normal">تنبيهات البلاغات في الخلفية</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Hospital & Ambulance Emergency Modal */}
      {isEmergencyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-dialog-title"
        >
          <div className="bg-white dark:bg-[#122624] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/50 space-y-4 text-xs text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 id="emergency-dialog-title" className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                    خطوط وأرقام الطوارئ المعتمدة
                  </h3>
                  <p className="text-[11px] text-[#788C88] dark:text-[#8AA39F]">
                    يرجى تحديد جهة الاتصال وفق نوع البلاغ الإكلينيكي أو الميداني
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                aria-label="إغلاق نافذة الطوارئ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Internal Hospital Emergency Code Operations */}
              <a
                href="tel:2222"
                className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center justify-between hover:bg-red-100/70 dark:hover:bg-red-950/50 transition-all cursor-pointer block"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-red-900 dark:text-red-200">
                      طوارئ المستشفى والإنذار الداخلي
                    </span>
                    <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded font-mono">
                      Ext: 2222
                    </span>
                  </div>
                  <p className="text-[11px] text-red-700 dark:text-red-400">
                    لإنعاش القلب (Code Blue)، تسرب الغازات، وحوادث الأجهزة الحيوية
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-xs shrink-0">
                  اتصال داخلي
                </span>
              </a>

              {/* Option 2: Red Crescent Ambulance */}
              <a
                href="tel:997"
                className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 transition-all cursor-pointer block"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                      إسعاف الهلال الأحمر السعودي
                    </span>
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded font-mono">
                      997
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    لنقل الحالات الحرجة الخارجية والحوادث المرورية والإخلاء
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shrink-0">
                  اتصال 997
                </span>
              </a>

              {/* Option 3: Civil Defense */}
              <a
                href="tel:998"
                className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center justify-between hover:bg-amber-100/70 dark:hover:bg-amber-950/50 transition-all cursor-pointer block"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-amber-900 dark:text-amber-200">
                      الدفاع المدني والسلامة الميدانية
                    </span>
                    <span className="bg-amber-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded font-mono">
                      998
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    لإنذار الحريق والإخلاء والسلامة الإنشائية بالمبنى
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-amber-600 text-white rounded-xl font-bold text-xs shrink-0">
                  اتصال 998
                </span>
              </a>
            </div>

            <div className="pt-2 text-center text-[10px] text-gray-500 dark:text-gray-400">
              يتم توثيق وتوقيت البلاغات الطارئة في سجل المراقبة الإدارية لضمان سرعة الاستجابة.
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

