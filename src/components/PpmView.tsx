import React, { useState } from "react";
import {
  ShieldCheck,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  FileCheck,
  Search,
  Filter,
  Printer,
  ChevronRight,
  Activity,
  Award,
  Zap,
  ShieldAlert,
  Info,
  XCircle,
  HelpCircle,
  UserCheck,
} from "lucide-react";
import {
  PpmSchedule,
  CalibrationWorkOrder,
  UserRole,
  UserProfile,
  Asset,
  CalibrationCheckItem,
  CalibrationItemResult,
} from "../types";
import { reconcilePpmSchedulesWithAssets } from "../utils/dateCompliance";

interface PpmViewProps {
  schedules: PpmSchedule[];
  onApproveCalibration: (id: string) => Promise<boolean>;
  calibrationLogs: CalibrationWorkOrder[];
  currentUserRole: UserRole;
  currentUser?: UserProfile;
  assets?: Asset[];
  onExecuteCalibration: (data: {
    ppmScheduleId: string;
    technicianName: string;
    technicianRole?: string;
    verifiedBy?: string;
    referenceDeviceUsed?: string;
    electricalSafetyPassed: boolean;
    accuracyTestPassed: boolean;
    sensorCalibrationPassed: boolean;
    filterBatteryCheckPassed: boolean;
    overallResult: "ناجح ومطابق" | "غير مجتاز - يتطلب صيانة وعزل";
    certificateNumber?: string;
    certificateStatus: "معتمدة" | "ملغاة" | "مسودة";
    checklistItems: CalibrationCheckItem[];
    notes: string;
  }) => Promise<boolean>;
}

// Standard medical equipment test protocol templates based on device type
function getChecklistTemplateForSchedule(schedule: PpmSchedule): CalibrationCheckItem[] {
  const isVentilator = schedule.assetName.includes("تنفس") || schedule.assetName.includes("Ventilator");
  const isDefibOrEcg = schedule.assetName.includes("قلب") || schedule.assetName.includes("Cardio");
  const isXray = schedule.assetName.includes("أشعة") || schedule.assetName.includes("X-Ray");

  if (isVentilator) {
    return [
      {
        id: "vent-1",
        name: "فحص العزل الكهربائي وتيار التسريب للأجزاء الملامسة (Leakage Current)",
        standardRef: "IEC 62353 / NFPA 99",
        result: "" as any,
        measuredValue: "",
        unit: "μA",
        acceptanceLimit: "< 100 μA",
        isMandatory: true,
      },
      {
        id: "vent-2",
        name: "معايرة دقة ضغط الشهيق والزفير PEEP & Peak Pressure",
        standardRef: "ISO 80601-2-12",
        result: "" as any,
        measuredValue: "",
        unit: "cmH2O",
        acceptanceLimit: "± 2 cmH2O",
        isMandatory: true,
      },
      {
        id: "vent-3",
        name: "معايرة تركيز الأكسجين FiO2 مع مستشعر الغازات المعاير",
        standardRef: "CBAHI Biom-04",
        result: "" as any,
        measuredValue: "",
        unit: "%",
        acceptanceLimit: "± 3%",
        isMandatory: true,
      },
      {
        id: "vent-4",
        name: "اختبار استجابة تنبيهات انقطاع الضغط والتنفس التلقائي (Apnea Alarms)",
        standardRef: "IEC 60601-1-8",
        result: "" as any,
        measuredValue: "",
        unit: "",
        acceptanceLimit: "استجابة فورية < 3 ثوان",
        isMandatory: true,
      },
      {
        id: "vent-5",
        name: "فحص قدرة بطارية الطوارئ الداخلية واستمرارية التشغيل",
        standardRef: "OEM Specification",
        result: "" as any,
        measuredValue: "",
        unit: "دقيقة",
        acceptanceLimit: "> 120 دقيقة",
        isMandatory: false,
      },
    ];
  }

  if (isDefibOrEcg) {
    return [
      {
        id: "ecg-1",
        name: "فحص السلامة الكهربائية والمقاومة الأرضية (Ground Bond)",
        standardRef: "IEC 62353",
        result: "" as any,
        measuredValue: "",
        unit: "Ω",
        acceptanceLimit: "< 0.2 Ω",
        isMandatory: true,
      },
      {
        id: "ecg-2",
        name: "معايرة حساسية الموجات ودقة التردد 1mV على أقطاب الـ 12 قناة",
        standardRef: "AAMI EC11",
        result: "" as any,
        measuredValue: "",
        unit: "mV",
        acceptanceLimit: "± 2%",
        isMandatory: true,
      },
      {
        id: "ecg-3",
        name: "فحص سلامة كابلات المريض وعزل القنوات عن التداخل الخارجي",
        standardRef: "CBAHI Clinical Standard",
        result: "" as any,
        measuredValue: "",
        unit: "",
        acceptanceLimit: "إشارة مستقرة خالية من التشويش",
        isMandatory: true,
      },
      {
        id: "ecg-4",
        name: "اختبار سرعة تغذية الورق وطباعة التقرير الرقمي",
        standardRef: "OEM Manual",
        result: "" as any,
        measuredValue: "",
        unit: "mm/s",
        acceptanceLimit: "25 & 50 mm/s",
        isMandatory: false,
      },
    ];
  }

  if (isXray) {
    return [
      {
        id: "xray-1",
        name: "فحص التسريب الإشعاعي حول أنبوبة الأشعة (Radiation Leakage)",
        standardRef: "SFDA / NRRC Guidelines",
        result: "" as any,
        measuredValue: "",
        unit: "mR/h",
        acceptanceLimit: "< 100 mR/h عند 1 متر",
        isMandatory: true,
      },
      {
        id: "xray-2",
        name: "معايرة دقة الجهد الكيلوفولتي kVp ووقت التعريض mAs",
        standardRef: "AAPM Report 74",
        result: "" as any,
        measuredValue: "",
        unit: "%",
        acceptanceLimit: "خطأ < ± 5%",
        isMandatory: true,
      },
      {
        id: "xray-3",
        name: "اختبار ميكانيكا الذراع الرقمية ومكابح التوازن والثبات",
        standardRef: "Mechanical Safety Standard",
        result: "" as any,
        measuredValue: "",
        unit: "",
        acceptanceLimit: "توازن تام وثبات المكابح",
        isMandatory: true,
      },
      {
        id: "xray-4",
        name: "فحص المعايرة البصرية وحقل الإضاءة الميداني (Collimator Alignment)",
        standardRef: "CBAHI Standard",
        result: "" as any,
        measuredValue: "",
        unit: "mm",
        acceptanceLimit: "انحراف < 2 mm",
        isMandatory: true,
      },
    ];
  }

  // General standard medical device checklist
  return [
    {
      id: "gen-1",
      name: "فحص السلامة الكهربائية والعزل للمريض (Electrical Safety & Leakage)",
      standardRef: "IEC 62353 / NFPA 99",
      result: "" as any,
      measuredValue: "",
      unit: "μA",
      acceptanceLimit: "< 100 μA",
      isMandatory: true,
    },
    {
      id: "gen-2",
      name: "اختبار دقة المعايرة وتسامح القياس الوظيفي (Calibration Accuracy)",
      standardRef: "CBAHI Clinical Standard",
      result: "" as any,
      measuredValue: "",
      unit: "%",
      acceptanceLimit: "ضمن حدود الشركة المصنعة",
      isMandatory: true,
    },
    {
      id: "gen-3",
      name: "فحص الحساسات والتنبيهات الصوتية والمرئية (Safety Alarms)",
      standardRef: "IEC 60601-1-8",
      result: "" as any,
      measuredValue: "",
      unit: "",
      acceptanceLimit: "عمل جميع التنبيهات بوضوح",
      isMandatory: true,
    },
    {
      id: "gen-4",
      name: "فحص الحالة الميكانيكية والهيكل والتوصيلات الخارجية",
      standardRef: "Visual & Physical Check",
      result: "" as any,
      measuredValue: "",
      unit: "",
      acceptanceLimit: "خلو من التلف والكسور",
      isMandatory: false,
    },
  ];
}

export const PpmView: React.FC<PpmViewProps> = ({
  schedules: rawSchedules,
  calibrationLogs,
  currentUserRole,
  currentUser,
  assets = [],
  onExecuteCalibration,
  onApproveCalibration,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"schedules" | "history">("schedules");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("الكل");
  const [filterRisk, setFilterRisk] = useState<string>("الكل");

  // Reconcile PPM schedules dynamically with Assets registry (Single Source of Truth)
  const schedules = React.useMemo(() => {
    return reconcilePpmSchedulesWithAssets(rawSchedules, assets, 7, new Date());
  }, [rawSchedules, assets]);

  // Calibration Execution Modal State
  const [executingSchedule, setExecutingSchedule] = useState<PpmSchedule | null>(null);
  const [techName, setTechName] = useState("");
  const [techRole, setTechRole] = useState("مهندس أجهزة طبية معتمد");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [referenceDevice,setReferenceDevice]=useState("");
  const [checklistItems, setChecklistItems] = useState<CalibrationCheckItem[]>([]);
  const [calNotes, setCalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Certificate Modal Preview
  const [viewingCertificate, setViewingCertificate] = useState<CalibrationWorkOrder | null>(null);

  // Metrics (computed from reconciled dynamic data)
  const total = schedules.length;
  const validCount = schedules.filter((s) => s.complianceStatus === "سارية").length;
  const dueSoonCount = schedules.filter((s) => s.complianceStatus === "مستحقة قريباً").length;
  const overdueCount = schedules.filter((s) => s.complianceStatus === "متأخرة").length;
  const complianceRate = total > 0 ? Math.round((validCount / total) * 100) : 100;

  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch =
      !search ||
      s.assetName.toLowerCase().includes(search.toLowerCase()) ||
      s.assetId.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.assignedEngineer.toLowerCase().includes(search.toLowerCase()) ||
      s.model.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "الكل" || s.complianceStatus === filterStatus;
    const matchesRisk = filterRisk === "الكل" || s.riskLevel === filterRisk;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const handleOpenCalibration = (schedule: PpmSchedule) => {
    setExecutingSchedule(schedule);
    // Initialize technician name from logged-in user instead of hardcoded string
    const defaultName = currentUser?.name || (currentUserRole === "biomedical" ? "م. طارق الخالدي" : "");
    setTechName(defaultName);
    setTechRole(currentUser?.roleTitle || "مهندس أجهزة طبية معتمد");
    // Separation of duties: Verifier must be distinct from executing technician
    const defaultVerifier = defaultName.includes("طارق")
      ? "د. خالد العتيبي (مدير التشغيل والصيانة)"
      : "م. طارق الخالدي (رئيس قسم الهندسة الطبية)";
    setVerifiedBy("");
    setReferenceDevice("");

    // CRITICAL: Items start with NO preselected result! Engineer must actively verify each item.
    const items = getChecklistTemplateForSchedule(schedule);
    setChecklistItems(items);

    // CRITICAL: No pre-filled success notes! Starts blank.
    setCalNotes("");
  };

  const handleUpdateCheckItem = (id: string, updates: Partial<CalibrationCheckItem>) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Evaluation of overall inspection result
  const hasUnansweredMandatory = checklistItems.some(
    (item) => item.isMandatory && (!item.result || item.result === ("" as any))
  );
  const hasFailedMandatory = checklistItems.some(
    (item) => item.result === "فاشل" || (item.isMandatory && item.result === "غير منطبق")
  );
  const allMandatoryPassed = !hasUnansweredMandatory && !hasFailedMandatory;

  const handleConfirmCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingSchedule) return;

    if (hasUnansweredMandatory) {
      alert("يرجى تحديد نتيجة جميع بنود الفحص الإلزامية (ناجح / فاشل / غير منطبق مع السبب).");
      return;
    }

    setIsSubmitting(true);
    try {
      const certNumber = allMandatoryPassed
        ? `CERT-CBAHI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        : undefined;

      const overallResult = allMandatoryPassed
        ? "ناجح ومطابق"
        : "غير مجتاز - يتطلب صيانة وعزل";

      const certificateStatus = allMandatoryPassed ? "مسودة" : "ملغاة";

      // Map boolean helpers for backwards compatibility
      const electricalSafetyItem = checklistItems.find((c) => c.name.includes("كهربائي"));
      const accuracyItem = checklistItems.find((c) => c.name.includes("دقة") || c.name.includes("معايرة"));
      const sensorItem = checklistItems.find((c) => c.name.includes("حساسات") || c.name.includes("تنبيهات"));
      const batteryItem = checklistItems.find((c) => c.name.includes("بطارية") || c.name.includes("فلاتر"));

      const saved = await onExecuteCalibration({
        ppmScheduleId: executingSchedule.id,
        technicianName: techName.trim() || "مهندس أجهزة طبية",
        technicianRole: techRole,
        verifiedBy,
        referenceDeviceUsed: referenceDevice,
        electricalSafetyPassed: electricalSafetyItem ? electricalSafetyItem.result === "ناجح" : allMandatoryPassed,
        accuracyTestPassed: accuracyItem ? accuracyItem.result === "ناجح" : allMandatoryPassed,
        sensorCalibrationPassed: sensorItem ? sensorItem.result === "ناجح" : allMandatoryPassed,
        filterBatteryCheckPassed: batteryItem ? batteryItem.result === "ناجح" : allMandatoryPassed,
        overallResult,
        certificateNumber: certNumber,
        certificateStatus,
        checklistItems,
        notes: calNotes.trim() || (allMandatoryPassed ? "تم استكمال قائمة الفحص؛ بانتظار مراجعة مستقلة." : "لم يجتز الفحص الإلزامي، إحالة للصيانة."),
      });

      if(saved)setExecutingSchedule(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      <section className="p-4 bg-white border rounded-2xl space-y-3"><h2 className="font-bold">فحوص بانتظار اعتماد مستقل</h2><p>لا يعاد الجهاز للخدمة إلا بعد اعتماد فحص ناجح من مستخدم آخر مخوّل.</p>{calibrationLogs.filter(c=>c.certificateStatus==="مسودة").map(c=><div key={c.id} className="flex justify-between gap-3"><div><span>{c.assetName} — {c.technicianName}</span><details><summary>عرض نتائج الفحص قبل الاعتماد</summary><p>جهاز القياس: {c.referenceDeviceUsed}</p><p>{c.notes}</p><ul>{c.checklistItems?.map(item=><li key={item.id}>{item.name}: {item.result} — {item.measuredValue} {item.unit}</li>)}</ul></details></div><button className="px-3 py-2 border rounded-xl" disabled={c.technicianName===currentUser?.name} onClick={()=>void onApproveCalibration(c.id)}>مراجعة واعتماد الفحص الناجح</button></div>)}</section>
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#122624] p-5 rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#193B3A] dark:text-[#EDF7F4]">
              الصيانة الوقائية والمعايرة الطبية (PPM)
            </h2>
            <span className="bg-[#126B68] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#F4C96B]" />
              متابعة الفحص والسلامة — ليست شهادة اعتماد للمنظومة
            </span>
          </div>
          <p className="text-xs text-[#738884] dark:text-[#8AA39F] mt-1">
            بروتوكولات المعايرة الدورية، فحص السلامة الكهربائية، وإصدار شهادات الامتثال الرقمية المرتبطة بالأصل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("schedules")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === "schedules"
                ? "bg-[#126B68] text-white shadow-xs"
                : "bg-[#F0F5F3] dark:bg-[#183633] text-[#556E69] dark:text-[#9DBBB4] hover:bg-[#E3EDE9]"
            }`}
          >
            جدول المعايرة ({total})
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === "history"
                ? "bg-[#126B68] text-white shadow-xs"
                : "bg-[#F0F5F3] dark:bg-[#183633] text-[#556E69] dark:text-[#9DBBB4] hover:bg-[#E3EDE9]"
            }`}
          >
            سجل الفحوص والشهادات ({calibrationLogs.length})
          </button>
        </div>
      </div>

      {/* Metrics Row (Dynamically Calculated) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#738884] text-xs">
            <span>إجمالي الأجهزة المجدولة</span>
            <Activity className="w-4 h-4 text-[#126B68]" />
          </div>
          <div className="text-2xl font-black text-[#193B3A] dark:text-white">{total}</div>
          <p className="text-[10px] text-[#8B9A97]">أجهزة طبية مسجلة بالنظام</p>
        </div>

        <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#2B7A3D] text-xs">
            <span>سارية ومعايرة</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-black text-[#2B7A3D]">{validCount}</div>
          <p className="text-[10px] text-[#2B7A3D]/80">نسبة الامتثال: {complianceRate}%</p>
        </div>

        <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#B86B00] text-xs">
            <span>مستحقة قريباً</span>
            <Clock className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-black text-[#B86B00]">{dueSoonCount}</div>
          <p className="text-[10px] text-[#B86B00]/80">خلال نافذة 7-14 يوماً</p>
        </div>

        <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#C9684D] text-xs">
            <span>متأخرة عن الموعد</span>
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="text-2xl font-black text-[#C9684D]">{overdueCount}</div>
          <p className="text-[10px] text-[#C9684D]/80">تجاوزت تاريخ الاستحقاق</p>
        </div>
      </div>

      {/* Period, Formula, and Source Documentation */}
      <div className="bg-[#F8FBFA] dark:bg-[#152B28] p-3 rounded-2xl border border-[#E1EBE8] dark:border-[#1E433E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#6B8581] dark:text-[#9DBBB4]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4] shrink-0" />
          <span>
            <strong className="text-[#193B3A] dark:text-[#EDF7F4]">معادلة الامتثال:</strong> نسبة الامتثال = (الأجهزة السارية المعايرة ÷ إجمالي المجدول) × 100% | <strong className="text-[#193B3A] dark:text-[#EDF7F4]">الفترة:</strong> العام الجاري (الربع الحالي) بتوقيت المنشأة (Asia/Riyadh).
          </span>
        </div>
        <div className="text-[10px] text-[#738884] dark:text-[#8AA39F]">
          مصدر البيانات: سجل الأصول والأجهزة الطبية الفعلي وسجلات الصيانة المنفذة (PPM).
        </div>
      </div>

      {activeSubTab === "schedules" ? (
        <>
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#122624] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-3 text-[#8B9A97]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث باسم الجهاز، الكود، الموديل، أو المهندس..."
                className="w-full bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl pr-9 pl-3 py-2 text-xs text-[#193B3A] dark:text-[#EDF7F4] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#738884] dark:text-[#9DBBB4]">الحالة:</span>
                {["الكل", "متأخرة", "مستحقة قريباً", "سارية"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      filterStatus === st
                        ? "bg-[#126B68] text-white shadow-2xs"
                        : "bg-[#F0F5F3] dark:bg-[#183633] text-[#5A736F] dark:text-[#9DBBB4] hover:bg-[#E3EDE9]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#738884] dark:text-[#9DBBB4]">الخطورة:</span>
                {["الكل", "حرج", "متوسط"].map((rk) => (
                  <button
                    key={rk}
                    onClick={() => setFilterRisk(rk)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      filterRisk === rk
                        ? "bg-[#193B3A] text-white"
                        : "bg-[#F0F5F3] dark:bg-[#183633] text-[#5A736F] dark:text-[#9DBBB4]"
                    }`}
                  >
                    {rk}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Schedules Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map((schedule) => {
              const isOverdue = schedule.complianceStatus === "متأخرة";
              const isDueSoon = schedule.complianceStatus === "مستحقة قريباً";

              return (
                <div
                  key={schedule.id}
                  className={`bg-white dark:bg-[#122624] rounded-2xl border p-4.5 shadow-xs transition-all flex flex-col justify-between space-y-3.5 ${
                    isOverdue
                      ? "border-[#F1D3C6] bg-gradient-to-b from-white to-[#FEF7F5] dark:from-[#122624] dark:to-[#2B1B19]"
                      : isDueSoon
                      ? "border-[#F4DCAB] bg-gradient-to-b from-white to-[#FFFDF7] dark:from-[#122624] dark:to-[#292419]"
                      : "border-[#E1EBE8] dark:border-[#1F423E] hover:border-[#126B68]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] bg-[#E9F5F2] dark:bg-[#183633] text-[#126B68] dark:text-[#4ECDC4] font-bold px-1.5 py-0.5 rounded-md">
                            {schedule.assetId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              schedule.riskLevel === "حرج"
                                ? "bg-[#FBE6DE] text-[#C9684D]"
                                : "bg-[#E9F5F2] text-[#126B68]"
                            }`}
                          >
                            خطورة {schedule.riskLevel}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4] mt-1 line-clamp-1">
                          {schedule.assetName}
                        </h3>
                        <p className="text-[11px] text-[#738884] dark:text-[#8AA39F] font-mono">
                          الموديل: {schedule.model}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 border ${
                          isOverdue
                            ? "bg-[#FBE6DE] text-[#C9684D] border-[#F1D3C6] animate-pulse"
                            : isDueSoon
                            ? "bg-[#FFF2D6] text-[#B86B00] border-[#F4DCAB]"
                            : "bg-[#E5F5E8] text-[#2B7A3D] border-[#CBEAD2]"
                        }`}
                      >
                        {schedule.complianceStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#5E7772] dark:text-[#9DBBB4] bg-[#F8FBFA] dark:bg-[#0F201E] p-3 rounded-xl border border-[#EEF3F1] dark:border-[#1D3F3B]">
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">القسم:</span>
                        <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">{schedule.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">دورية المعايرة:</span>
                        <span className="font-bold text-[#126B68] dark:text-[#4ECDC4]">{schedule.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">آخر معايرة:</span>
                        <span className="text-[#193B3A] dark:text-[#EDF7F4]">{schedule.lastCalibrationDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">تاريخ الاستحقاق:</span>
                        <span
                          className={`font-black ${
                            isOverdue
                              ? "text-[#C9684D]"
                              : isDueSoon
                              ? "text-[#B86B00]"
                              : "text-[#2B7A3D]"
                          }`}
                        >
                          {schedule.nextDueDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#738884] dark:text-[#8AA39F] bg-white dark:bg-[#122624] p-2 rounded-lg border border-[#EEF3F1] dark:border-[#1D3F3B] line-clamp-2">
                      <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">البروتوكول المعتمد:</span>{" "}
                      {schedule.standardProtocol}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F0F5F3] dark:border-[#1D3F3B] flex items-center justify-between gap-2">
                    <div className="text-[10px] text-[#8B9A97] truncate">
                      المهندس: <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">{schedule.assignedEngineer}</span>
                    </div>

                    <button
                      onClick={() => handleOpenCalibration(schedule)}
                      className="px-3.5 py-1.5 bg-[#126B68] hover:bg-[#0d5553] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0 active:scale-95 shadow-xs cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>بدء المعايرة الميدانية</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Calibration Logs History Archive */
        <div className="bg-white dark:bg-[#122624] rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#EEF3F1] dark:border-[#1D3F3B] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4]">
                أرشيف شهادات المعايرة والفحص الدوري المعتمدة
              </h3>
              <p className="text-xs text-[#788C88] dark:text-[#8AA39F]">
                سجلات رقمية موثقة وفق اشتراطات سباهي (CBAHI) مع جهاز الفحص المرجعي
              </p>
            </div>
            <span className="text-xs font-bold bg-[#E9F5F2] dark:bg-[#183633] text-[#126B68] dark:text-[#4ECDC4] px-2.5 py-1 rounded-lg">
              {calibrationLogs.length} شهادة مسجلة
            </span>
          </div>

          <div className="divide-y divide-[#EEF3F1] dark:divide-[#1D3F3B]">
            {calibrationLogs.map((log) => {
              const isPassed = log.overallResult === "ناجح ومطابق";
              return (
                <div
                  key={log.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#F9FCFB] dark:hover:bg-[#152E2B] transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-[#193B3A] text-white font-bold px-2 py-0.5 rounded-md">
                        {log.certificateNumber || log.id}
                      </span>
                      <h4 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4]">{log.assetName}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isPassed
                            ? "bg-[#E5F5E8] text-[#2B7A3D]"
                            : "bg-[#FBE6DE] text-[#C9684D]"
                        }`}
                      >
                        {isPassed ? "اجتياز معتمد مطابق" : "غير مجتاز - إحالة للصيانة"}
                      </span>
                    </div>

                    <p className="text-[#5E7772] dark:text-[#9DBBB4] text-[11px]">{log.notes}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#8B9A97]">
                      <span>تاريخ التنفيذ: {log.executionDate}</span>
                      <span>•</span>
                      <span>المنفذ: {log.technicianName}</span>
                      <span>•</span>
                      <span>المعتمد: {log.verifiedBy || "رئيس الهندسة الطبية"}</span>
                      <span>•</span>
                      <span>الاستحقاق القادم: {log.nextScheduledDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => setViewingCertificate(log)}
                      className="px-3.5 py-2 bg-[#F0F5F3] dark:bg-[#183633] hover:bg-[#E1EBE8] text-[#193B3A] dark:text-[#EDF7F4] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4 text-[#126B68]" />
                      <span>عرض الشهادة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Execution / Calibration Modal with Real Unselected Checks */}
      {executingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-[#122624] rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E] my-4">
            <div className="p-5 border-b border-[#EDF4F2] dark:border-[#1D3F3B] sticky top-0 bg-white/95 dark:bg-[#122624]/95 backdrop-blur-xs z-10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  تنفيذ الفحص والمعايرة الطبية الدورية (PPM)
                </h3>
                <p className="text-xs text-[#788C88] dark:text-[#8AA39F]">
                  {executingSchedule.assetName} ({executingSchedule.assetId}) • الموديل: {executingSchedule.model}
                </p>
              </div>
              <button
                onClick={() => setExecutingSchedule(null)}
                className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#183633] hover:bg-[#E3EDE9] flex items-center justify-center text-[#5A736F] dark:text-white cursor-pointer"
                aria-label="إغلاق النافذة"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCalibration} className="p-5 sm:p-6 space-y-5 text-xs">
              {/* Device Overview Banner */}
              <div className="bg-[#F8FBFA] dark:bg-[#0F201E] p-4 rounded-2xl border border-[#EEF3F1] dark:border-[#1D3F3B] space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#8B9A97] block text-[11px]">القسم والموقع:</span>
                    <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                      {executingSchedule.department} {executingSchedule.location ? `— ${executingSchedule.location}` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8B9A97] block text-[11px]">الرقم التسلسلي للأصل:</span>
                    <span className="font-mono font-bold text-[#126B68] dark:text-[#4ECDC4]">
                      {executingSchedule.serial || "مسجل ضمن بطاقة الجهاز"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EEF3F1] dark:border-[#1D3F3B]">
                  <span className="text-[#8B9A97] block text-[11px]">البروتوكول المعتمد:</span>
                  <span className="font-medium text-[#193B3A] dark:text-[#EDF7F4]">
                    {executingSchedule.standardProtocol}
                  </span>
                </div>
              </div>

              {/* Reference Calibration Instrument */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#126B68]" />
                  <span>جهاز القياس والفحص المرجعي وصلاحية معايرته *</span>
                </label>
                <input
                  type="text"
                  value={referenceDevice}
                  onChange={(e) => setReferenceDevice(e.target.value)}
                  placeholder="مثال: Fluke ESA612 رقم 8812 - معايرة معتمدة حتى 2027-03-15"
                  className="w-full bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  required
                />
                <p className="text-[10px] text-[#788C88]">
                  يتطلب معيار سباهي (CBAHI) و JCI توثيق الجهاز المرجعي المستخدم في المعايرة وتاريخ سريانه.
                </p>
              </div>

              {/* Real Interactive Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-black text-[#193B3A] dark:text-[#EDF7F4] block text-sm">
                    قائمة الفحوصات الفنية والقياسات الميدانية *
                  </label>
                  <span className="text-[11px] text-[#8B9A97]">
                    يجب تحديد النتيجة يدوياً لكل بند
                  </span>
                </div>

                <div className="space-y-3">
                  {checklistItems.map((item, idx) => {
                    const isSelected = !!item.result;
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                          item.result === "فاشل"
                            ? "bg-[#FEF2F2] dark:bg-[#2B1B19] border-[#FECACA]"
                            : item.result === "ناجح"
                            ? "bg-[#F0FDF4] dark:bg-[#152E23] border-[#BBF7D0]"
                            : item.result === "غير منطبق"
                            ? "bg-gray-50 dark:bg-[#183633] border-gray-200"
                            : "bg-[#F8FBFA] dark:bg-[#0F201E] border-[#DCE8E5] dark:border-[#244C47]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                                {idx + 1}. {item.name}
                              </span>
                              {item.isMandatory && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                                  إلزامي
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#738884] dark:text-[#8AA39F] block">
                              المعيار المرجعي: {item.standardRef} {item.acceptanceLimit ? `• حد القبول: ${item.acceptanceLimit}` : ""}
                            </span>
                          </div>

                          {/* Result Select Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateCheckItem(item.id, { result: "ناجح" })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                item.result === "ناجح"
                                  ? "bg-[#10B981] text-white shadow-2xs"
                                  : "bg-white dark:bg-[#152E2B] text-[#193B3A] dark:text-white border border-[#DCE8E5] hover:bg-[#E5F5E8]"
                              }`}
                            >
                              ناجح ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCheckItem(item.id, { result: "فاشل" })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                item.result === "فاشل"
                                  ? "bg-[#EF4444] text-white shadow-2xs"
                                  : "bg-white dark:bg-[#152E2B] text-[#193B3A] dark:text-white border border-[#DCE8E5] hover:bg-[#FEE2E2]"
                              }`}
                            >
                              فاشل ✕
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCheckItem(item.id, { result: "غير منطبق" })}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                item.result === "غير منطبق"
                                  ? "bg-[#64748B] text-white shadow-2xs"
                                  : "bg-white dark:bg-[#152E2B] text-[#556E69] dark:text-white border border-[#DCE8E5] hover:bg-gray-100"
                              }`}
                            >
                              غير منطبق
                            </button>
                          </div>
                        </div>

                        {/* Additional value input or justification */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-[#244C47]/50">
                          <div>
                            <input
                              type="text"
                              value={item.measuredValue || ""}
                              onChange={(e) => handleUpdateCheckItem(item.id, { measuredValue: e.target.value })}
                              placeholder={`القراءة الفعلية المقاسة ${item.unit ? `(${item.unit})` : ""}`}
                              className="w-full bg-white dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-lg px-2.5 py-1 text-[11px] text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              value={item.notes || ""}
                              onChange={(e) => handleUpdateCheckItem(item.id, { notes: e.target.value })}
                              placeholder={
                                item.result === "غير منطبق"
                                  ? "اكتب سبب عدم الانطباق (إلزامي)"
                                  : "ملاحظات الفحص والبيئة..."
                              }
                              className={`w-full bg-white dark:bg-[#152E2B] border rounded-lg px-2.5 py-1 text-[11px] text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none ${
                                item.result === "غير منطبق" && !item.notes
                                  ? "border-amber-400 bg-amber-50/50"
                                  : "border-[#DCE8E5] dark:border-[#244C47] focus:border-[#126B68]"
                              }`}
                              required={item.result === "غير منطبق"}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Warning if any failed item */}
              {hasFailedMandatory && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-red-800 dark:text-red-300 text-xs">
                      تنبيه: فشل فحص إلزامي — لن يتم إصدار شهادة اجتياز!
                    </h4>
                    <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">
                      وفقاً لمعايير السلامة الإكلينيكية، عند رسوب أي بند فحص إلزامي يتم تسجيل الحالة كـ «غير مجتاز»، وتحويل الجهاز فورياً للصيانة التصحيحية مع تطبيق بروتوكول العزل الفني (LOTO) لحماية المرضى.
                    </p>
                  </div>
                </div>
              )}

              {/* Technician & Approver Info (Separation of Duties) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    اسم الفني / المهندس المنفذ *
                  </label>
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    placeholder="الاسم الثلاثي والصفة..."
                    className="w-full bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    الصفة الوظيفية والترخيص المهني
                  </label>
                  <input
                    type="text"
                    value={techRole}
                    onChange={(e) => setTechRole(e.target.value)}
                    placeholder="مهندس أجهزة طبية معتمد..."
                    className="w-full bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    المهندس / المشرف المعتمد للشهادة (فصل المنفذ عن المعتمد) *
                  </label>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={(e) => setVerifiedBy(e.target.value)}
                    placeholder="اسم المسؤول المعتمد ورقم الاعتماد..."
                    className="w-full bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                    required
                  />
                  <p className="text-[10px] text-[#788C88] mt-0.5">
                    وفقاً لاشتراطات الجودة، يجب أن يكون المعتمد شخصاً مستقلاً عن المنفذ الميداني.
                  </p>
                </div>
              </div>

              {/* Technical Notes / Recommendations (Blank placeholder) */}
              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  تقرير المعايرة والتوصيات الفنية السريرية
                </label>
                <textarea
                  value={calNotes}
                  onChange={(e) => setCalNotes(e.target.value)}
                  placeholder="اكتب تفاصيل الفحص، القراءات المميزة، التوصيات السريرية، وملاحظات الاستخدام للممرضين..."
                  rows={2}
                  className="w-full bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#EDF4F2] dark:border-[#1D3F3B] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExecutingSchedule(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#DCE8E5] dark:border-[#244C47] text-[#526B66] dark:text-[#9DBBB4] font-bold cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || hasUnansweredMandatory || !techName.trim()}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-xs ${
                    hasFailedMandatory
                      ? "bg-[#EF4444] hover:bg-[#DC2626]"
                      : "bg-[#126B68] hover:bg-[#0d5553]"
                  }`}
                >
                  {hasFailedMandatory ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>{isSubmitting ? "جاري التوثيق..." : "توثيق عدم الاجتياز وإحالة الجهاز للصيانة"}</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 text-[#F4C96B]" />
                      <span>{isSubmitting ? "جاري الاعتماد..." : "اعتماد المعايرة وإصدار شهادة الاجتياز"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Detailed Preview Modal */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-[#122624] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-6 text-xs my-4">
            {/* Certificate Header */}
            <div className="flex justify-between items-start pb-4 border-b border-[#EDF4F2] dark:border-[#1D3F3B]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#126B68] flex items-center justify-center text-white">
                  <Award className="w-6 h-6 text-[#F4C96B]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                    شهادة فحص ومعايرة أجهزة طبية (PPM)
                  </h3>
                  <p className="text-[11px] text-[#788C88] dark:text-[#8AA39F]">
                    منظومة عين المستشفى • الإدارة الطبية والهندسة الإكلينيكية
                  </p>
                </div>
              </div>

              <span
                className={`font-mono text-xs px-2.5 py-1 rounded-md font-bold ${
                  viewingCertificate.overallResult === "ناجح ومطابق"
                    ? "bg-[#E5F5E8] text-[#2B7A3D]"
                    : "bg-[#FBE6DE] text-[#C9684D]"
                }`}
              >
                {viewingCertificate.certificateNumber || viewingCertificate.id}
              </span>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4">
              <div className="bg-[#F8FBFA] dark:bg-[#0F201E] p-4 rounded-2xl border border-[#EEF3F1] dark:border-[#1D3F3B] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#8B9A97]">اسم الجهاز الطبي:</span>
                  <span className="font-black text-[#193B3A] dark:text-[#EDF7F4] text-sm">
                    {viewingCertificate.assetName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B9A97]">معرف الأصل (Asset ID):</span>
                  <span className="font-mono font-bold text-[#126B68]">
                    {viewingCertificate.assetId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B9A97]">تاريخ تنفيذ الفحص:</span>
                  <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                    {viewingCertificate.executionDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B9A97]">تاريخ المعايرة القادمة:</span>
                  <span className="font-bold text-[#10B981]">
                    {viewingCertificate.nextScheduledDate}
                  </span>
                </div>
              </div>

              {/* Reference Instrument */}
              {viewingCertificate.referenceDeviceUsed && (
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-[#1E3A8A] dark:text-blue-300">
                  <span className="font-bold block">الجهاز المرجعي المستخدم في المعايرة:</span>
                  <span>{viewingCertificate.referenceDeviceUsed}</span>
                </div>
              )}

              {/* Results Breakdown */}
              <div className="space-y-1.5">
                <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">نتائج الفحوصات:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#183633] flex items-center justify-between">
                    <span>السلامة الكهربائية:</span>
                    <span className="font-bold text-[#10B981]">
                      {viewingCertificate.electricalSafetyPassed ? "اجتياز ✓" : "رسوب ✕"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#183633] flex items-center justify-between">
                    <span>دقة المعايرة:</span>
                    <span className="font-bold text-[#10B981]">
                      {viewingCertificate.accuracyTestPassed ? "اجتياز ✓" : "رسوب ✕"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#183633] flex items-center justify-between">
                    <span>الحساسات والتنبيهات:</span>
                    <span className="font-bold text-[#10B981]">
                      {viewingCertificate.sensorCalibrationPassed ? "اجتياز ✓" : "رسوب ✕"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#183633] flex items-center justify-between">
                    <span>فحص البطارية والفلاتر:</span>
                    <span className="font-bold text-[#10B981]">
                      {viewingCertificate.filterBatteryCheckPassed ? "اجتياز ✓" : "رسوب ✕"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#183633] text-[11px] text-[#556E69] dark:text-[#9DBBB4] leading-relaxed">
                <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block mb-0.5">
                  توصيات وتقرير الفحص:
                </span>
                {viewingCertificate.notes || "لا توجد ملاحظات إضافية."}
              </div>

              {/* Signatures */}
              <div className="pt-2 border-t border-gray-100 dark:border-[#1D3F3B] flex justify-between items-center text-[10px] text-[#8B9A97]">
                <div>
                  <span className="block text-[#193B3A] dark:text-[#EDF7F4] font-bold">
                    المهندس المنفذ: {viewingCertificate.technicianName}
                  </span>
                  <span>{viewingCertificate.technicianRole || "مهندس أجهزة طبية معتمد"}</span>
                </div>
                <div className="text-left">
                  <span className="block text-[#193B3A] dark:text-[#EDF7F4] font-bold">
                    الاعتماد الإكلينيكي:
                  </span>
                  <span>{viewingCertificate.verifiedBy || "رئيس الهندسة الطبية"}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EDF4F2] dark:border-[#1D3F3B] flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#F0F5F3] dark:bg-[#183633] hover:bg-[#E3EDE9] text-[#193B3A] dark:text-[#EDF7F4] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#126B68]" />
                <span>طباعة الشهادة</span>
              </button>

              <button
                onClick={() => setViewingCertificate(null)}
                className="px-5 py-2 bg-[#126B68] text-white font-bold rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
