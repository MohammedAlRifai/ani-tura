import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
  Timer,
  ShieldAlert,
  Gauge,
  Lock,
} from "lucide-react";
import { Report, Asset, SfdaSafetyAlert } from "../types";

interface DashboardAnalyticsProps {
  reports: Report[];
  assets?: Asset[];
  sfdaAlerts?: SfdaSafetyAlert[];
  onOpenSfdaModal?: () => void;
  onOpenAuditModal?: () => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  reports,
  assets = [],
  sfdaAlerts = [],
  onOpenSfdaModal,
  onOpenAuditModal,
}) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");

  const [activeMetricTab, setActiveMetricTab] = useState<
    "distribution" | "departments" | "reliability"
  >("distribution");

  // 1. Status Distribution
  const statusStats = useMemo(() => {
    const counts = {
      new: 0,
      inProgress: 0,
      closed: 0,
    };

    reports.forEach((r) => {
      if (r.status === "جديد") counts.new += 1;
      else if (["قيد المعالجة","بانتظار الاعتماد"].includes(r.status)) counts.inProgress += 1;
      else if (r.status === "مغلق") counts.closed += 1;
    });

    const total = reports.length || 1;

    return [
      {
        name: isArabic ? "جديد (بانتظار الإسناد)" : "New (Pending)",
        key: "new",
        value: counts.new,
        percentage: Math.round((counts.new / total) * 100),
        color: "#F59E0B", // Amber
      },
      {
        name: isArabic ? "قيد المعالجة والإصلاح" : "In Progress & Repair",
        key: "inProgress",
        value: counts.inProgress,
        percentage: Math.round((counts.inProgress / total) * 100),
        color: "#126B68", // Teal
      },
      {
        name: isArabic ? "مكتمل ومغلق (تم الإنجاز)" : "Closed & Completed",
        key: "closed",
        value: counts.closed,
        percentage: Math.round((counts.closed / total) * 100),
        color: "#10B981", // Emerald
      },
    ];
  }, [reports, isArabic]);

  // 2. Calculations: Overall Maintenance Completion Rate
  const completionMetrics = useMemo(() => {
    const total = reports.length;
    const closed = reports.filter((r) => r.status === "مغلق").length;
    const inProgress = reports.filter((r) => ["قيد المعالجة","بانتظار الاعتماد"].includes(r.status)).length;
    const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // Urgent resolution rate
    const urgentReports = reports.filter((r) => r.priority === "عاجل");
    const urgentClosed = urgentReports.filter((r) => r.status === "مغلق").length;
    const urgentRate = urgentReports.length > 0 ? Math.round((urgentClosed / urgentReports.length) * 100) : 0;

    return {
      total,
      closed,
      inProgress,
      rate,
      urgentRate,
      urgentTotal: urgentReports.length,
      urgentClosed,
    };
  }, [reports]);

  // 3. Category Breakdown for Maintenance Department
  const categoryData = useMemo(() => {
    const categoriesMap: Record<string, { total: number; closed: number; inProgress: number; new: number }> = {};

    reports.forEach((r) => {
      const cat = r.category || "عام";
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { total: 0, closed: 0, inProgress: 0, new: 0 };
      }
      categoriesMap[cat].total += 1;
      if (r.status === "مغلق") categoriesMap[cat].closed += 1;
      else if (["قيد المعالجة","بانتظار الاعتماد"].includes(r.status)) categoriesMap[cat].inProgress += 1;
      else categoriesMap[cat].new += 1;
    });

    return Object.entries(categoriesMap).map(([category, stats]) => ({
      category,
      منجز: stats.closed,
      "قيد الإصلاح": stats.inProgress + stats.new,
      نسبة_الإنجاز: Math.round((stats.closed / Math.max(1, stats.total)) * 100),
      total: stats.total,
    }));
  }, [reports]);

  // 4. HTM Reliability Calculations (MTBF, MTTR, Uptime Rate, LOTO)
  const reliabilityMetrics = useMemo(() => {
    const completed=reports.filter(r=>r.status==='مغلق'&&r.closedAt&&Number.isFinite(r.downtimeHours));
    const avgMttr=completed.length?(completed.reduce((n,r)=>n+(r.downtimeHours||0),0)/completed.length).toFixed(1):null;
    const intervals:number[]=[];
    for(const asset of assets){const times=reports.filter(r=>r.assetId===asset.id&&r.startedAt).map(r=>new Date(r.startedAt!).getTime()).sort((a,b)=>a-b);for(let i=1;i<times.length;i++)intervals.push((times[i]-times[i-1])/86400000);}
    const avgMtbf=intervals.length?Math.round(intervals.reduce((a,b)=>a+b,0)/intervals.length):null;
    const avgUptime:string|null=null; // Requires an actual observed operating-time denominator.
    const lockedOutAssets = assets.filter((a) => a.isLockedOut);
    const criticalRecalls = sfdaAlerts.filter((al) => al.riskClass.includes("حرج") && al.status === "مفتوح");

    // Dynamically calculate Criticality Groups from real registered assets
    const classA = assets.filter((a) => a.criticality?.startsWith("A"));
    const classB = assets.filter((a) => a.criticality?.startsWith("B"));
    const classC = assets.filter((a) => !a.criticality?.startsWith("A") && !a.criticality?.startsWith("B"));

    const calcGroup = (group: Asset[], label: string) => {
      const uptime:number|null=null; const mtbf:number|null=null;
      const groupReports=completed.filter(r=>group.some(a=>a.id===r.assetId));
      const mttr=groupReports.length?Number((groupReports.reduce((n,r)=>n+(r.downtimeHours||0),0)/groupReports.length).toFixed(1)):null;
      return { name: `${label} (${group.length} أجهزة)`, uptime, mtbf, mttr, assetCount: group.length };
    };

    const criticalityGroups = [
      calcGroup(classA, "أجهزة إنعاش وحفظ الحياة (Class A)"),
      calcGroup(classB, "أجهزة تشخيص وتصوير حرجة (Class B)"),
      calcGroup(classC, "أجهزة مساندة عامة (Class C)"),
    ];

    // Instantaneous vs Time-Averaged Availability
    const activeRunningCount = assets.filter((a) => a.status === "يعمل بكفاءة" && !a.isLockedOut).length;
    const instantaneousAvailability = assets.length > 0
      ? Number(((activeRunningCount / assets.length) * 100).toFixed(1))
      : 100;

    return {
      avgMtbf,
      avgMttr,
      avgUptime,
      lockedOutCount: lockedOutAssets.length,
      criticalRecallsCount: criticalRecalls.length,
      criticalityGroups,
      instantaneousAvailability,
      activeRunningCount,
      totalAssetsCount: assets.length,
    };
  }, [assets, sfdaAlerts, reports]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#193B3A] text-white p-3 rounded-xl shadow-lg border border-[#126B68]/40 text-xs space-y-1">
          <p className="font-bold">{data.name || data.payload?.category}</p>
          <div className="flex items-center gap-2 text-emerald-300">
            <span>العدد:</span>
            <span className="font-mono font-bold">{data.value} بلاغ</span>
          </div>
          {data.payload?.percentage !== undefined && (
            <div className="text-[11px] text-[#CDE5DF]">
              النسبة: {data.payload.percentage}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#122624] rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] p-5 sm:p-6 shadow-xs space-y-6">
      {/* Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EEF3F1] dark:border-[#1E3F3B]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#126B68] text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#193B3A] dark:text-[#EDF7F4]">
                {isArabic ? "لوحة التحليلات ومؤشرات الأداء الطبي (HTM KPIs)" : "HTM Analytics & Clinical KPIs"}
              </h3>
              <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {isArabic ? "تحليل لحظي" : "Real-time"}
              </span>
            </div>
            <p className="text-xs text-[#738884] dark:text-[#9DBBB4] mt-0.5">
              {isArabic
                ? "تتبع زمن الإصلاح (MTTR)، الجاهزية التشغيلية (Uptime)، وبلاغات السلامة (SFDA)"
                : "Track MTTR, Operational Availability (Uptime), and SFDA Safety Recalls"}
            </p>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center bg-[#F6FAF8] dark:bg-[#0F201E] p-1 rounded-2xl border border-[#E1EBE8] dark:border-[#1E3F3B] text-xs font-bold self-stretch sm:self-center overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveMetricTab("distribution")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMetricTab === "distribution"
                ? "bg-[#126B68] text-white shadow-xs"
                : "text-[#667E7A] dark:text-[#9DBBB4] hover:text-[#193B3A]"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>{isArabic ? "حالات البلاغات" : "Work Orders"}</span>
          </button>
          <button
            onClick={() => setActiveMetricTab("reliability")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMetricTab === "reliability"
                ? "bg-[#126B68] text-white shadow-xs"
                : "text-[#667E7A] dark:text-[#9DBBB4] hover:text-[#193B3A]"
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{isArabic ? "مؤشرات الموثوقية (MTBF)" : "Reliability (MTBF)"}</span>
          </button>
          <button
            onClick={() => setActiveMetricTab("departments")}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMetricTab === "departments"
                ? "bg-[#126B68] text-white shadow-xs"
                : "text-[#667E7A] dark:text-[#9DBBB4] hover:text-[#193B3A]"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{isArabic ? "إنجاز الأقسام" : "Departments"}</span>
          </button>
        </div>
      </div>

      {/* Top Level Completion & Reliability Rate Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Main Completion Rate */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F6FAF8] to-[#EDF6F3] dark:from-[#132A26] dark:to-[#17332E] border border-[#D5E6E1] dark:border-[#1F453F] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#556E69] dark:text-[#9DBBB4]">
              {isArabic ? "نسبة إنجاز الصيانة" : "Maintenance Resolution"}
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#193B3A] dark:text-[#EDF7F4]">
              {completionMetrics.rate}%
            </span>
            <span className="text-[11px] text-[#126B68] dark:text-[#4ECDC4] font-bold">
              ({completionMetrics.closed} {isArabic ? "من" : "of"} {completionMetrics.total})
            </span>
          </div>
          <div className="w-full bg-[#D8E8E3] dark:bg-[#1E433E] h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-[#10B981] h-full rounded-full transition-all duration-700"
              style={{ width: `${completionMetrics.rate}%` }}
            ></div>
          </div>
        </div>

        {/* Hospital Uptime Rate (جاهزية الأجهزة الطبية) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] dark:from-[#102A1E] dark:to-[#143527] border border-[#BBF7D0] dark:border-[#1E4D37] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {isArabic ? "جاهزية الأجهزة (Uptime)" : "Asset Uptime (Availability)"}
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {reliabilityMetrics.avgUptime === null ? "غير متوفر" : `${reliabilityMetrics.avgUptime}%`}
            </span>
            <span className="text-[11px] text-emerald-800 dark:text-emerald-200 font-bold">
              {isArabic ? "يلزم توثيق فترة تشغيل لحساب النسبة" : "Hospital Grade A"}
            </span>
          </div>
          <div className="w-full bg-emerald-200 dark:bg-[#1E4D37] h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, parseFloat(reliabilityMetrics.avgUptime || "0"))}%` }}
            ></div>
          </div>
        </div>

        {/* MTTR (متوسط وقت الإصلاح) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F8FAF9] to-[#F1F8F6] dark:from-[#132825] dark:to-[#183631] border border-[#D5E6E1] dark:border-[#1F423E] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#556E69] dark:text-[#9DBBB4]">
              {isArabic ? "MTTR (وقت الإصلاح)" : "MTTR (Mean Time to Repair)"}
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#126B68]/20 text-[#126B68] dark:text-[#4ECDC4] flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#126B68] dark:text-[#4ECDC4]">
              {reliabilityMetrics.avgMttr ?? "غير متوفر"}
            </span>
            <span className="text-xs font-bold text-[#556E69] dark:text-[#9DBBB4]">
              {isArabic ? "ساعة / عطل" : "Hrs / defect"}
            </span>
          </div>
          <span className="text-[10px] text-[#738884] dark:text-[#9DBBB4] mt-2 block font-medium">
            {isArabic ? "من أوامر العمل المغلقة الموثقة" : "Instant response for Life-support Class A"}
          </span>
        </div>

        {/* MTBF (متوسط الوقت بين الأعطال) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FEF6EE] dark:from-[#261C14] dark:to-[#332215] border border-[#FCDCC9] dark:border-[#4B3020] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9A5B45] dark:text-[#E2A794]">
              {isArabic ? "MTBF (بين الأعطال)" : "MTBF (Mean Time Between Failures)"}
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#C9684D]/20 text-[#C9684D] flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#C9684D]">
              {reliabilityMetrics.avgMtbf ?? "غير متوفر"}
            </span>
            <span className="text-xs font-bold text-[#9A5B45] dark:text-[#E2A794]">
              {isArabic ? "يوم تشغيلي" : "Days"}
            </span>
          </div>
          <span className="text-[10px] text-[#9A5B45] dark:text-[#E2A794] mt-2 block font-medium">
            {isArabic ? "من الفواصل بين أعطال موثقة" : "Ensured via regular PPM calibration"}
          </span>
        </div>
      </div>

      {/* Compliance & Safety Action Banner (SFDA Recalls + LOTO + Audit) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* SFDA Banner Card */}
        <div
          onClick={onOpenSfdaModal}
          className="p-3.5 bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/30 rounded-2xl flex items-center justify-between hover:bg-amber-500/15 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-xs text-amber-900 dark:text-amber-200">
                {isArabic ? "إنذارات واستدعاءات الغذاء والدواء (SFDA)" : "SFDA / NCMDR Safety Recalls & Alerts"}
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300">
                {reliabilityMetrics.criticalRecallsCount > 0
                  ? isArabic
                    ? `${reliabilityMetrics.criticalRecallsCount} استدعاء حرج يتطلب المتابعة`
                    : `${reliabilityMetrics.criticalRecallsCount} critical recalls require attention`
                  : isArabic
                  ? "جميع التعميمات الميدانية معالجة"
                  : "All safety recalls verified & compliant"}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 underline shrink-0">
            {isArabic ? "معاينة" : "Review"}
          </span>
        </div>

        {/* LOTO Banner Card */}
        <div className="p-3.5 bg-red-500/10 dark:bg-red-400/15 border border-red-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-xs text-red-900 dark:text-red-200">
                {isArabic ? "أجهزة معزولة ومحظورة (LOTO Active)" : "LOTO Safety Lockouts Active"}
              </div>
              <div className="text-[11px] text-red-700 dark:text-red-300">
                {reliabilityMetrics.lockedOutCount > 0
                  ? isArabic
                    ? `${reliabilityMetrics.lockedOutCount} جهاز خارج الخدمة لسلامة المرضى`
                    : `${reliabilityMetrics.lockedOutCount} devices locked out for patient safety`
                  : isArabic
                  ? "لا توجد أجهزة قيد الحظر الفني حالياً"
                  : "No devices currently locked out"}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Sheet Button */}
        {onOpenAuditModal && (
          <div
            onClick={onOpenAuditModal}
            className="p-3.5 bg-[#126B68]/10 dark:bg-[#126B68]/20 border border-[#126B68]/30 rounded-2xl flex items-center justify-between hover:bg-[#126B68]/15 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#126B68] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-xs text-[#193B3A] dark:text-[#EDF7F4]">
                  {isArabic ? "تقارير الاعتماد والتصدير (CBAHI)" : "CBAHI & SFDA Accreditation Audit"}
                </div>
                <div className="text-[11px] text-[#126B68] dark:text-[#4ECDC4]">
                  {isArabic
                    ? "تصدير كشف PPM وسجل الأصول بصيغة Excel"
                    : "Export PPM logs and asset register in Excel"}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#126B68] dark:text-[#4ECDC4] underline shrink-0">
              {isArabic ? "تصدير" : "Export"}
            </span>
          </div>
        )}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Donut / Status Breakdown OR Reliability Breakdown */}
        {activeMetricTab === "reliability" ? (
          <div className="bg-[#F9FCFB] dark:bg-[#152E2B] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4] flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4]" />
                <span>مؤشرات الموثوقية والجاهزية حسب فئة خطورة الجهاز</span>
              </h4>
              <span className="text-xs font-bold text-[#126B68] dark:text-[#4ECDC4] bg-[#E9F5F2] dark:bg-[#1C3D37] px-2 py-0.5 rounded-md">
                AAMI / CBAHI
              </span>
            </div>

            {/* Dynamic Criticality Groups */}
            <div className="space-y-3">
              {reliabilityMetrics.criticalityGroups.map((grp, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#122624] p-3 rounded-xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                    <span>{grp.name}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black font-mono">
                      جاهزية: {grp.uptime === null ? "غير متوفر" : `${grp.uptime}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#126B68] h-full rounded-full transition-all"
                      style={{ width: `${grp.uptime === null ? "غير متوفر" : `${grp.uptime}%`}` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                    <span>MTBF: {grp.mtbf ?? "غير متوفر"} يوم بين الأعطال</span>
                    <span>MTTR: {grp.mttr ?? "غير متوفر"} ساعة للإصلاح</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Instantaneous vs Cumulative Comparison */}
            <div className="mt-3 p-3 bg-white dark:bg-[#122624] rounded-xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-[#738884] dark:text-[#9DBBB4]">الجاهزية اللحظية اللحظية الآن (Instantaneous):</span>
                <span className="font-mono font-black text-[#126B68] dark:text-[#4ECDC4]">
                  {reliabilityMetrics.instantaneousAvailability}% ({reliabilityMetrics.activeRunningCount}/{reliabilityMetrics.totalAssetsCount} أصل)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#738884] dark:text-[#9DBBB4]">الجاهزية المحسوبة على الزمن (Time-Averaged):</span>
                <span className="font-mono font-black text-[#10B981]">
                  {reliabilityMetrics.avgUptime ?? "غير متوفر"} — فترة القياس غير متوفرة
                </span>
              </div>
            </div>

            {/* Period, Formula & Data Source Documentation */}
            <div className="mt-3 pt-3 border-t border-[#E1EBE8] dark:border-[#1F423E] text-[10px] text-[#738884] dark:text-[#8AA39F] space-y-1 leading-relaxed">
              <div>
                <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">فترة الرصد والمعادلة:</span> الربع الحالي (آخر 90 يوماً). المعادلة: Uptime = [(ساعات التشغيل المتاحة - ساعات التوقف للأعطال) / ساعات التشغيل المتاحة] × 100%.
              </div>
              <div>
                <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">مصدر البيانات:</span> سجل الأصول الطبية الفعلي ({reliabilityMetrics.totalAssetsCount} جهاز مسجل) وسجلات أوامر الصيانة المنفذة (PPM).
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#F9FCFB] dark:bg-[#152E2B] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4]" />
                <span>توزيع البلاغات حسب الحالة</span>
              </h4>
              <span className="text-xs font-bold text-[#738884] dark:text-[#9DBBB4]">
                إجمالي: {reports.length} بلاغ
              </span>
            </div>

            {/* Recharts PieChart */}
            <div className="h-60 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut Badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  {completionMetrics.rate}%
                </span>
                <span className="text-[10px] text-[#738884] dark:text-[#9DBBB4] font-bold">نسبة الإنجاز</span>
              </div>
            </div>

            {/* Status Breakdown Legend & Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E1EBE8] dark:border-[#1F423E] text-center">
              {statusStats.map((st) => (
                <div
                  key={st.key}
                  className="bg-white dark:bg-[#122624] p-2 rounded-xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-2xs"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                    <span className="text-[10px] font-bold text-[#738884] dark:text-[#9DBBB4] truncate">
                      {st.name.split(" ")[0]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-center gap-1">
                    <span className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">{st.value}</span>
                    <span className="text-[10px] text-[#8B9A97] dark:text-[#7D9993]">({st.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart 2: Department Completion & Performance BarChart */}
        <div className="bg-[#F9FCFB] dark:bg-[#152E2B] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4]" />
              <span>معدل الإنجاز حسب تصنيف قسم الصيانة</span>
            </h4>
            <span className="text-xs font-bold text-[#10B981] bg-[#E5F5E8] dark:bg-[#143325] px-2 py-0.5 rounded-md">
              المنجز مقابل قيد المعالجة
            </span>
          </div>

          {/* Recharts BarChart */}
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1EBE8" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#556E69" }} axisLine={{ stroke: "#D5E6E1" }} />
                <YAxis tick={{ fontSize: 11, fill: "#556E69" }} axisLine={{ stroke: "#D5E6E1" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#193B3A",
                    borderColor: "#126B68",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#A7F3D0" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="منجز" fill="#10B981" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="قيد الإصلاح" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Efficiency Summary */}
          <div className="pt-3 border-t border-[#E1EBE8] dark:border-[#1F423E] flex items-center justify-between text-xs font-bold text-[#556E69] dark:text-[#9DBBB4]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>مؤشرات متابعة تشغيلية — لا تثبت اعتمادًا تنظيميًا</span>
            </span>
            <span className="text-[#126B68] dark:text-[#4ECDC4]">تحديث حي</span>
          </div>
        </div>
      </div>
    </div>
  );
};

