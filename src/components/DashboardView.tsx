import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  FileText,
  Building2,
  Boxes,
  QrCode,
  Sparkles,
  Camera,
  ChevronLeft,
  Clock,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Truck,
  DollarSign,
  Search,
  Award,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Report, Asset, Product, SfdaSafetyAlert, InventoryItem, UsedPartItem, ReportStatus, UserProfile } from "../types";
import { DashboardAnalytics } from "./DashboardAnalytics";
import { ViewTabBar, ViewTabItem } from "./ViewTabBar";
import { ReportDetailContent } from "./ReportDetailContent";

interface DashboardViewProps {
  currentUser?: UserProfile;
  reports: Report[];
  assets: Asset[];
  products: Product[];
  sfdaAlerts?: SfdaSafetyAlert[];
  inventory?: InventoryItem[];
  onOpenSfdaModal?: () => void;
  onOpenAuditModal?: () => void;
  setActiveTab: (tab: string) => void;
  openNewReport: () => void;
  openScanner: () => void;
  setSelectedReport: (report: Report) => void;
  setSelectedAsset: (asset: Asset) => void;
  onUpdateReportStatus?: (
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
  onOpenReportInTab?: (report: Report) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  reports,
  currentUser,
  assets,
  products,
  sfdaAlerts = [],
  inventory = [],
  onOpenSfdaModal,
  onOpenAuditModal,
  setActiveTab,
  openNewReport,
  openScanner,
  setSelectedReport,
  setSelectedAsset,
  onUpdateReportStatus,
  onOpenReportInTab: externalOpenReportInTab,
}) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");

  // Tab management for reports inside Dashboard
  const [openReportTabs, setOpenReportTabs] = useState<Report[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("main-dashboard");

  const handleOpenReportInTab = (report: Report) => {
    setOpenReportTabs((prev) => {
      if (prev.some((r) => r.id === report.id)) {
        return prev;
      }
      return [...prev, report];
    });
    setActiveTabId(`report-${report.id}`);
  };

  const handleCloseReportTab = (tabId: string) => {
    const reportId = tabId.replace("report-", "");
    setOpenReportTabs((prev) => prev.filter((r) => r.id !== reportId));
    if (activeTabId === tabId) {
      setActiveTabId("main-dashboard");
    }
  };

  const handleCloseAllReportTabs = () => {
    setOpenReportTabs([]);
    setActiveTabId("main-dashboard");
  };

  // Build dashboard view tabs
  const dashboardTabs: ViewTabItem[] = useMemo(() => {
    const mainTab: ViewTabItem = {
      id: "main-dashboard",
      type: "main",
      title: "لوحة التحكم الحية",
      icon: <Sparkles className="w-3.5 h-3.5" />,
    };

    const reportTabItems: ViewTabItem[] = openReportTabs.map((rep) => {
      const isUrgent = rep.priority === "عاجل";
      return {
        id: `report-${rep.id}`,
        type: "report",
        title: rep.title || rep.id,
        subtitle: rep.location,
        badge: rep.priority,
        badgeColor: isUrgent ? "bg-[#C94D4D] text-white" : "bg-[#126B68] text-white",
        icon: <FileText className="w-3.5 h-3.5" />,
        dataId: rep.id,
      };
    });

    return [mainTab, ...reportTabItems];
  }, [openReportTabs]);

  // Find active report object if activeTabId corresponds to a report
  const activeReportObj = useMemo(() => {
    if (!activeTabId.startsWith("report-")) return null;
    const reportId = activeTabId.replace("report-", "");
    return reports.find((r) => r.id === reportId) || openReportTabs.find((r) => r.id === reportId) || null;
  }, [activeTabId, reports, openReportTabs]);

  const activeReportsCount = reports.filter((r) => r.status !== "مغلق").length;
  const urgentCount = reports.filter((r) => r.priority === "عاجل" && r.status !== "مغلق").length;
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;
  const activeAssetsCount = assets.filter((a) => a.status === "يعمل بكفاءة").length;

  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredReports = searchQuery
    ? reports.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports.slice(0, 5);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "عاجل":
        return "bg-[#FBE6DE] text-[#C9684D] border-[#F1D3C6]";
      case "متوسط":
        return "bg-[#FFF2D6] text-[#B86B00] border-[#F4DCAB]";
      default:
        return "bg-[#E5F5E8] text-[#2B7A3D] border-[#CBEAD2]";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "جديد":
        return "bg-[#FFF2D6] text-[#B86B00]";
      case "قيد المعالجة":
        return "bg-[#DDF4F0] text-[#0C756C]";
      case "مغلق":
        return "bg-[#E5F5E8] text-[#2B7A3D]";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-l from-[#193B3A] to-[#126B68] text-white p-6 rounded-3xl shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#F4C96B] text-[#193B3A] text-xs font-black px-2.5 py-0.5 rounded-full">
              {t("dashboard.liveShift")}
            </span>
            <span className="text-xs text-[#C4D4D1]">
              {new Date().toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{t("dashboard.greetingTitle")}</h2>
          <p className="text-sm text-[#D6E5E1] max-w-2xl leading-relaxed">
            {t("dashboard.greetingDesc")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:self-start md:self-center">
          <button
            onClick={openNewReport}
            className="flex items-center gap-2 bg-[#F4C96B] hover:bg-[#edd085] text-[#193B3A] font-bold px-4 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 text-xs cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>{t("dashboard.urgentReportBtn")}</span>
          </button>
          <button
            data-module="manar" onClick={() => setActiveTab("manar")}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20 transition-all text-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#F4C96B]" />
            <span>{t("dashboard.consultManarBtn")}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          aria-label={isArabic ? "البحث في البلاغات والأجهزة" : "Search reports and assets"}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("dashboard.searchPlaceholder")}
          className="w-full bg-white dark:bg-[#122624] border border-[#DCE8E5] dark:border-[#1F423E] rounded-2xl py-3.5 pr-11 pl-4 text-sm text-[#193B3A] dark:text-[#EDF7F4] placeholder-[#8B9A97] dark:placeholder-[#6C8681] focus:outline-none focus:border-[#126B68] focus:ring-2 focus:ring-[#126B68]/15 shadow-xs transition-all"
        />
        <Search className="w-5 h-5 text-[#8B9A97] absolute right-3.5 top-1/2 -translate-y-1/2" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8B9A97] hover:text-[#193B3A] dark:hover:text-white"
          >
            {isArabic ? "إلغاء" : "Clear"}
          </button>
        )}
      </div>

      {/* Integrated Tab Bar for Dashboard View */}
      <ViewTabBar
        tabs={dashboardTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseReportTab}
        onCloseAllExtraTabs={handleCloseAllReportTabs}
        mainTabLabel="لوحة التحكم الحية"
      />

      {/* Content Switcher: If active tab is a Report, render Report Detail in-place */}
      {activeReportObj ? (
        <div className="bg-white dark:bg-[#122624] rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDF4F2] dark:border-[#1A3834] pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black bg-[#E9F5F2] dark:bg-[#1B3F3A] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md">
                تبويب البلاغ المفتوح: {activeReportObj.id}
              </span>
              <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4] hidden sm:inline">
                يمكنك التبديل بين البلاغات المفتوحة ولوحة التحكم دون إغلاق الواجهة الحالية
              </span>
            </div>
            <button
              onClick={() => handleCloseReportTab(activeTabId)}
              className="text-xs text-[#788C88] hover:text-[#C94D4D] font-bold px-3 py-1 rounded-xl bg-gray-50 dark:bg-[#16302C] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
            >
              إغلاق هذا التبويب
            </button>
          </div>

          <ReportDetailContent key={activeReportObj.id+":"+(activeReportObj.version||1)}
            currentUser={currentUser}
            report={activeReportObj}
            assets={assets}
            inventory={inventory}
            onClose={() => handleCloseReportTab(activeTabId)}
            onUpdateStatus={(id, newStatus, notes, downtimeHours, usedParts, signOff, serviceRestored, assignedTo, expectedVersion) => {
              if (onUpdateReportStatus) {
                return onUpdateReportStatus(id, newStatus, notes, downtimeHours, usedParts, signOff, serviceRestored, assignedTo, expectedVersion);
              }
            }}
            onOpenAsset={(asset) => setSelectedAsset(asset)}
            isTabMode={true}
          />
        </div>
      ) : (
        <>
      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab("reports")}
          className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#126B68] cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">{t("dashboard.activeReports")}</span>
            <div className="w-8 h-8 rounded-xl bg-[#E9F5F2] dark:bg-[#153430] flex items-center justify-center text-[#126B68] dark:text-[#4ECDC4]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#193B3A] dark:text-[#EDF7F4]">{activeReportsCount}</span>
            <span className="text-[11px] text-[#8B9A97] dark:text-[#7D9993]">{t("dashboard.underFollowUp")}</span>
          </div>
          <p className="text-[11px] text-[#126B68] dark:text-[#4ECDC4] mt-1 flex items-center gap-1 font-semibold">
            {t("dashboard.viewReportsTable")} <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          </p>
        </div>

        <div
          onClick={() => setActiveTab("reports")}
          className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#C9684D] cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">{t("dashboard.requireUrgent")}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBE6DE] dark:bg-[#341B18] flex items-center justify-center text-[#C9684D]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#C9684D]">{urgentCount}</span>
            <span className="text-[11px] text-[#8B9A97] dark:text-[#7D9993]">{t("dashboard.topPriority")}</span>
          </div>
          <p className="text-[11px] text-[#C9684D] mt-1 font-semibold">{t("dashboard.impactOnCare")}</p>
        </div>

        <div
          onClick={() => setActiveTab("assets")}
          className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#126B68] cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">{t("dashboard.documentedAssets")}</span>
            <div className="w-8 h-8 rounded-xl bg-[#DDF4F0] dark:bg-[#153430] flex items-center justify-center text-[#0C756C] dark:text-[#4ECDC4]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#193B3A] dark:text-[#EDF7F4]">{assets.length}</span>
            <span className="text-[11px] text-[#2B7A3D] dark:text-[#34D399]">({activeAssetsCount} {t("dashboard.operationalCount")})</span>
          </div>
          <p className="text-[11px] text-[#126B68] dark:text-[#4ECDC4] mt-1 font-semibold">{t("dashboard.equippedWithQr")}</p>
        </div>

        <div
          onClick={() => setActiveTab("inventory")}
          className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#B86B00] cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">{t("dashboard.lowStockItems")}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF2D6] dark:bg-[#332512] flex items-center justify-center text-[#B86B00] dark:text-[#FBBF24]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#B86B00] dark:text-[#FBBF24]">{lowStockCount}</span>
            <span className="text-[11px] text-[#8B9A97] dark:text-[#7D9993]">{t("nav.inventory")}</span>
          </div>
          <p className="text-[11px] text-[#B86B00] dark:text-[#FBBF24] mt-1 font-semibold">{t("dashboard.reorderNeeded")}</p>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">{t("dashboard.quickActionsTitle")}</h3>
          <span className="text-xs text-[#8B9A97] dark:text-[#7D9993]">{t("dashboard.quickActionsDesc")}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            onClick={openNewReport}
            className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#122624] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#C9684D] hover:shadow-sm transition-all group active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FBE6DE] dark:bg-[#341B18] flex items-center justify-center text-[#C9684D] mb-2.5 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4]">{t("dashboard.photoReport")}</span>
            <span className="text-[10px] text-[#8B9A97] dark:text-[#7D9993] mt-0.5">{t("dashboard.faultOrNote")}</span>
          </button>

          <button
            onClick={openScanner}
            className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#122624] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#126B68] hover:shadow-sm transition-all group active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#DDF4F0] dark:bg-[#153430] flex items-center justify-center text-[#126B68] dark:text-[#4ECDC4] mb-2.5 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4]">{t("actions.scanQr")}</span>
            <span className="text-[10px] text-[#8B9A97] dark:text-[#7D9993] mt-0.5">{t("dashboard.deviceFile")}</span>
          </button>

          <button
            onClick={() => setActiveTab("ppm")}
            className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#122624] rounded-2xl border border-[#F4DCAB] dark:border-[#1F423E] hover:border-[#126B68] hover:shadow-sm transition-all group active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFF2D6] dark:bg-[#332512] flex items-center justify-center text-[#B86B00] dark:text-[#FBBF24] mb-2.5 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5 text-[#B86B00] dark:text-[#FBBF24]" />
            </div>
            <span className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4]">{t("dashboard.preventiveMaint")}</span>
            <span className="text-[10px] text-[#B86B00] dark:text-[#FBBF24] font-bold mt-0.5">{t("dashboard.cbahiCompliance")}</span>
          </button>

          <button
            data-module="manar" onClick={() => setActiveTab("manar")}
            className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#122624] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#5E6DAA] hover:shadow-sm transition-all group active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#E8E7F7] dark:bg-[#1D213B] flex items-center justify-center text-[#5E6DAA] dark:text-[#818CF8] mb-2.5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4]">{t("dashboard.consultantManar")}</span>
            <span className="text-[10px] text-[#8B9A97] dark:text-[#7D9993] mt-0.5">AI</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#122624] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#126B68] hover:shadow-sm transition-all group active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#E9F5F2] dark:bg-[#153430] flex items-center justify-center text-[#126B68] dark:text-[#4ECDC4] mb-2.5 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4]">{t("nav.inventory")}</span>
            <span className="text-[10px] text-[#8B9A97] dark:text-[#7D9993] mt-0.5">{t("dashboard.medicalSupplies")}</span>
          </button>

          <button
            data-module="logistics" onClick={() => setActiveTab("logistics")}
            className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#122624] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#126B68] hover:shadow-sm transition-all group active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#EBF6FD] dark:bg-[#122838] flex items-center justify-center text-[#1E70A2] dark:text-[#38BDF8] mb-2.5 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4]">{t("dashboard.housingAndTransport")}</span>
            <span className="text-[10px] text-[#8B9A97] dark:text-[#7D9993] mt-0.5">{t("nav.logisticsDesc")}</span>
          </button>

          <button
            onClick={() => setActiveTab("finance")}
            className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#122624] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#126B68] hover:shadow-sm transition-all group active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#F4F9F2] dark:bg-[#152D1C] flex items-center justify-center text-[#2B7A3D] dark:text-[#4ADE80] mb-2.5 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-[#193B3A] dark:text-[#EDF7F4]">{t("nav.finance")}</span>
            <span className="text-[10px] text-[#8B9A97] dark:text-[#7D9993] mt-0.5">{t("nav.financeDesc")}</span>
          </button>
        </div>
      </div>

      {/* Interactive Analytics & Resolution Rates */}
      <DashboardAnalytics
        reports={reports}
        assets={assets}
        sfdaAlerts={sfdaAlerts}
        onOpenSfdaModal={onOpenSfdaModal}
        onOpenAuditModal={onOpenAuditModal}
      />

      {/* Main Grid: Recent Reports & Critical Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E1EBE8] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EEF3F1]">
            <div>
              <h3 className="text-base font-black text-[#193B3A]">آخر البلاغات المسجلة</h3>
              <p className="text-xs text-[#8B9A97]">متابعة التحديثات اللحظية من جميع الأقسام</p>
            </div>
            <button
              onClick={() => setActiveTab("reports")}
              className="text-xs font-bold text-[#126B68] hover:underline flex items-center gap-1"
            >
              <span>عرض كل البلاغات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#EEF3F1]">
            {filteredReports.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8B9A97]">لا توجد بلاغات مطابقة للبحث</div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="py-3.5 flex items-start justify-between gap-3 hover:bg-[#F9FCFB] px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#193B3A] truncate">{report.title}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getPriorityStyle(report.priority)}`}>
                        {report.priority}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getStatusStyle(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#788C88]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#126B68]" />
                        {report.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8B9A97]" />
                        {new Date(report.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>•</span>
                      <span className="text-[#126B68] font-semibold">{report.category}</span>
                    </div>
                    <p className="text-xs text-[#526B66] line-clamp-1">{report.description}</p>
                  </div>
                  <div className="flex items-center gap-1 self-center shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReportInTab(report);
                      }}
                      className="p-1.5 rounded-lg text-[#126B68] dark:text-[#4ECDC4] bg-[#E9F5F2] dark:bg-[#153430] hover:bg-[#d8ece8] dark:hover:bg-[#1c4540] transition-colors cursor-pointer"
                      title="فتح في تبويب مدمج دون مغادرة لوحة التحكم"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <ChevronLeft className="w-4 h-4 text-[#A1B3B0]" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Highlighted Devices & Rapid Lookup (1 Col) */}
        <div className="space-y-5">
          {/* Medical Assets Snapshot */}
          <div className="bg-white rounded-3xl border border-[#E1EBE8] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EEF3F1]">
              <h3 className="text-sm font-black text-[#193B3A]">أجهزة حيوية للمعاينة</h3>
              <button
                onClick={() => setActiveTab("assets")}
                className="text-xs font-bold text-[#126B68] hover:underline"
              >
                الكل ({assets.length})
              </button>
            </div>

            <div className="space-y-3">
              {assets.slice(0, 3).map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="p-3 rounded-2xl bg-[#F6FAF8] border border-[#E1EBE8] hover:border-[#126B68] cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#193B3A]">{asset.name}</span>
                    <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-[#DCE8E5] text-[#126B68]">
                      {asset.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E8581] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {asset.location}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-[#8B9A97]">الموديل: {asset.model}</span>
                    <span
                      className={`font-bold ${
                        asset.status === "يعمل بكفاءة"
                          ? "text-[#2B7A3D]"
                          : asset.status === "يحتاج صيانة"
                          ? "text-[#C9684D]"
                          : "text-red-700"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dr. Manar AI Quick Banner */}
          <div
            data-module="manar" onClick={() => setActiveTab("manar")}
            className="p-5 rounded-3xl bg-gradient-to-br from-[#193B3A] to-[#254C48] text-white cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 border border-white/20 shrink-0 overflow-hidden">
                <img
                  src="/assets/images/manar/reassuring.png"
                  alt="منار AI"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#F4C96B]">طبيبتك منار — المساعد المعرفي</h4>
                <p className="text-xs text-[#D6E5E1] mt-0.5">استفسر عن بروتوكولات الأجهزة أو الفحوصات الطبية</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#A7C2BD]">
              <span>متاح على مدار الساعة</span>
              <span className="text-[#F4C96B] font-bold flex items-center gap-1">
                ابدأ المحادثة <ChevronLeft className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
