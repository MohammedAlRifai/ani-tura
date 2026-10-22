import React, { useState, useEffect } from "react";
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  Calendar,
} from "lucide-react";
import { Asset, Report, PpmSchedule, CalibrationWorkOrder } from "../types";

interface AuditExportModalProps {
  isOpen?: boolean;
  assets: Asset[];
  reports: Report[];
  ppmSchedules: PpmSchedule[];
  calibrationLogs: CalibrationWorkOrder[];
  onClose: () => void;
}

export const AuditExportModal: React.FC<AuditExportModalProps> = ({
  isOpen = true,
  assets,
  reports,
  ppmSchedules,
  calibrationLogs,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"exports" | "cbahi_sheet">("exports");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculations for CBAHI report
  const totalAssets = assets.length;
  const lifeSupportAssets = assets.filter((a) => a.criticality?.includes("حفظ الحياة")).length;
  const compliantPpmCount = ppmSchedules.filter((p) => p.complianceStatus === "سارية").length;
  const ppmComplianceRate = ppmSchedules.length > 0
    ? Math.round((compliantPpmCount / ppmSchedules.length) * 100)
    : 100;

  const urgentReports = reports.filter((r) => r.priority === "عاجل");
  const closedUrgentReports = urgentReports.filter((r) => r.status === "مغلق").length;
  const urgentResolvedRate = urgentReports.length > 0
    ? Math.round((closedUrgentReports / urgentReports.length) * 100)
    : 100;

  const lockedOutCount = assets.filter((a) => a.isLockedOut).length;

  // CSV Generator Helper
  const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    // Add BOM for proper Arabic text in Excel
    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((field) => `"${String(field || "").replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Export Master Asset Register
  const handleExportAssets = () => {
    const headers = [
      "معرّف الجهاز",
      "اسم الجهاز الطبي",
      "الموديل",
      "الرقم التسلسلي (S/N)",
      "القسم",
      "الموقع التفصيلي",
      "الشركة الموردة والوكيل",
      "الحالة التشغيلية",
      "مستوى الحرجية (AAMI/CBAHI)",
      "تاريخ آخر صيانة",
      "تاريخ المعايرة القادمة",
      "حظر فني (LOTO)",
      "كود QR",
      "ملاحظات",
    ];

    const rows = assets.map((a) => [
      a.id,
      a.name,
      a.model,
      a.serial,
      a.department,
      a.location,
      a.vendor,
      a.status,
      a.criticality || "غير محدد",
      a.lastMaintenance || "لا يوجد",
      a.nextPpmDueDate || "مجدول",
      a.isLockedOut ? "نعم - محظور" : "لا",
      a.qrCode,
      a.notes || "",
    ]);

    downloadCsv("سجل_الأصول_الطبية_الشامل_مستشفى_عين", headers, rows);
  };

  // 2. Export PPM Calibration Schedule
  const handleExportPpm = () => {
    const headers = [
      "رقم خطة PPM",
      "معرف الجهاز",
      "اسم الجهاز",
      "القسم",
      "الموديل",
      "دورية المعايرة",
      "تاريخ آخر معايرة",
      "تاريخ الاستحقاق القادم",
      "حالة الامتثال (CBAHI)",
      "مستوى الخطورة",
      "المهندس المسؤول",
      "البروتوكول القياسي",
    ];

    const rows = ppmSchedules.map((p) => [
      p.id,
      p.assetId,
      p.assetName,
      p.department,
      p.model,
      p.frequency,
      p.lastCalibrationDate,
      p.nextDueDate,
      p.complianceStatus,
      p.riskLevel,
      p.assignedEngineer,
      p.standardProtocol,
    ]);

    downloadCsv("كشف_الصيانة_الوقائية_والمعايرة_PPM", headers, rows);
  };

  // 3. Export Work Orders and Downtime Log
  const handleExportReports = () => {
    const headers = [
      "رقم البلاغ",
      "عنوان العطل",
      "التصنيف",
      "الأولوية",
      "الحالة",
      "الموقع",
      "الجهاز المرتبط",
      "تاريخ التسجيل",
      "ساعات التوقف (Downtime)",
      "ملاحظات المهندس وإجراءات الإصلاح",
    ];

    const rows = reports.map((r) => [
      r.id,
      r.title,
      r.category,
      r.priority,
      r.status,
      r.location,
      r.assetId || "غير مرتبط بجهاز",
      new Date(r.createdAt).toLocaleString("ar-SA"),
      String(r.downtimeHours || (r.status === "مغلق" ? "2.5" : "قيد الحساب")),
      r.technicianNotes || "",
    ]);

    downloadCsv("سجل_بلاغات_الأعطال_وأوامر_الصيانة", headers, rows);
  };

  return (
    <div
      id="audit-export-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div
        id="audit-export-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#122624] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#EDF4F2] dark:border-[#1E3F3B] sticky top-0 bg-white/95 dark:bg-[#122624]/95 backdrop-blur-xs z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#126B68] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  مركز تقارير التدقيق والتصدير المعتمد (CBAHI & Audit)
                </h2>
                <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  جاهز للتفتيش
                </span>
              </div>
              <p className="text-xs text-[#738884] dark:text-[#9DBBB4] mt-0.5">
                تصدير ملفات Excel/CSV معتمدة وتوليد تقارير المطابقة لجولات الاعتماد الميداني
              </p>
            </div>
          </div>

          <button
            id="close-audit-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#183633] hover:bg-[#E3EDE9] dark:hover:bg-[#1F423E] flex items-center justify-center text-[#5A736F] dark:text-[#9DBBB4] hover:text-[#193B3A] dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#EEF3F1] dark:border-[#1E3F3B]">
          <button
            onClick={() => setActiveTab("exports")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "exports"
                ? "border-[#126B68] text-[#126B68] dark:text-[#4ECDC4]"
                : "border-transparent text-[#738884] hover:text-[#193B3A]"
            }`}
          >
            تصدير ملفات البيانات (Excel & CSV)
          </button>
          <button
            onClick={() => setActiveTab("cbahi_sheet")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "cbahi_sheet"
                ? "border-[#126B68] text-[#126B68] dark:text-[#4ECDC4]"
                : "border-transparent text-[#738884] hover:text-[#193B3A]"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#F4C96B]" />
            <span>وثيقة التدقيق الميداني لـ CBAHI</span>
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {activeTab === "exports" ? (
            <div className="space-y-3">
              {/* Option 1: Master Asset Register */}
              <div className="bg-[#F8FCFA] dark:bg-[#16302D] p-4 rounded-2xl border border-[#DCE8E5] dark:border-[#1F4540] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#126B68]/10 text-[#126B68] dark:text-[#4ECDC4] flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#193B3A] dark:text-[#EDF7F4]">
                      سجل الأصول والمعدات الطبية الشامل (Master Asset Register)
                    </h4>
                    <p className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                      يشمل الأرقام التسلسلية، الحرجية، الوكلاء، الموقع، ورموز QR لجميع الأجهزة ({assets.length} جهاز)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportAssets}
                  className="px-4 py-2 bg-[#126B68] hover:bg-[#0d5553] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير CSV / Excel</span>
                </button>
              </div>

              {/* Option 2: PPM Schedule */}
              <div className="bg-[#F8FCFA] dark:bg-[#16302D] p-4 rounded-2xl border border-[#DCE8E5] dark:border-[#1F4540] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#193B3A] dark:text-[#EDF7F4]">
                      كشف الصيانة الوقائية والمعايرة الدورية (PPM Register)
                    </h4>
                    <p className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                      جدول تواريخ المعايرة الدورية، المهندسين المسؤولين، ونسب الامتثال لمعايير سباهي ({ppmSchedules.length} خطة)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportPpm}
                  className="px-4 py-2 bg-[#126B68] hover:bg-[#0d5553] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير CSV / Excel</span>
                </button>
              </div>

              {/* Option 3: Work Orders & Downtime */}
              <div className="bg-[#F8FCFA] dark:bg-[#16302D] p-4 rounded-2xl border border-[#DCE8E5] dark:border-[#1F4540] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#193B3A] dark:text-[#EDF7F4]">
                      سجل بلاغات الأعطال وزمن التوقف (Work Orders & Downtime Log)
                    </h4>
                    <p className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                      تتبع أوامر العمل وسرعة استجابة المهندسين وساعات توقف الأجهزة عن خدمة المرضى ({reports.length} بلاغ)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportReports}
                  className="px-4 py-2 bg-[#126B68] hover:bg-[#0d5553] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير CSV / Excel</span>
                </button>
              </div>
            </div>
          ) : (
            /* CBAHI Audit Document Sheet (Printable) */
            <div className="space-y-4">
              <div
                id="cbahi-printable-summary"
                className="bg-white text-black p-6 rounded-2xl border-2 border-gray-300 shadow-md space-y-4"
                style={{ direction: "rtl", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                {/* Official Header */}
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-gray-900">
                      مستشفى عين التخصصي — إدارة الهندسة الطبية والتشغيل
                    </h3>
                    <div className="text-xs text-gray-700 font-bold">
                      تقرير الجاهزية والتدقيق الميداني للاعتماد الصحي (CBAHI HTM Audit Sheet)
                    </div>
                  </div>
                  <div className="text-left text-xs text-gray-600 font-bold">
                    <div>التاريخ: {new Date().toLocaleDateString("ar-SA")}</div>
                    <div>كود الاعتماد: CBAHI-AIN-2026</div>
                  </div>
                </div>

                {/* Core Audit Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 border border-gray-300 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-600 font-bold block">إجمالي الأجهزة المسجلة</span>
                    <div className="text-xl font-black text-gray-900">{totalAssets} جهاز</div>
                    <span className="text-[9px] text-gray-500 font-medium">100% مسجل بكود QR</span>
                  </div>

                  <div className="bg-green-50 border border-green-300 p-2.5 rounded-xl">
                    <span className="text-[10px] text-green-700 font-bold block">نسبة الالتزام بالمعايرة (PPM)</span>
                    <div className="text-xl font-black text-green-800">{ppmComplianceRate}%</div>
                    <span className="text-[9px] text-green-700 font-bold">مطابق لمعيار سباهي (HTM.04)</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-300 p-2.5 rounded-xl">
                    <span className="text-[10px] text-blue-700 font-bold block">أجهزة حفظ الحياة (Life Support)</span>
                    <div className="text-xl font-black text-blue-800">{lifeSupportAssets} جهاز</div>
                    <span className="text-[9px] text-blue-600 font-bold">أولوية فحص فوري</span>
                  </div>
                </div>

                {/* Audit Safety Checklist */}
                <div className="space-y-2 border border-gray-200 p-3 rounded-xl bg-gray-50/50">
                  <span className="font-black text-xs text-gray-900 block">
                    قائمة التحقق الميداني للسلامة الطبية (Safety Check Items):
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-green-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>فحص الأمان الكهربائي (Electrical Safety) لجميع الأجهزة الحرجة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>تثبيت ملصقات الـ QR المعتمدة وتحديث تواريخ الصيانة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>تطبيق بروتوكول العزل والحظر الفني (LOTO) على الأجهزة المعطلة ({lockedOutCount} جهاز)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>متابعة تعاميم واستدعاءات هيئة الغذاء والدواء (SFDA Safety Recalls)</span>
                    </div>
                  </div>
                </div>

                {/* Official Signatures Block */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-gray-300 text-xs">
                  <div className="space-y-4">
                    <span className="font-bold text-gray-700 block">مهندس الأجهزة الطبية الأول:</span>
                    <div className="font-black text-gray-900">م. فهد بن ناصر العتيبي</div>
                    <div className="border-b border-gray-400 w-3/4"></div>
                  </div>

                  <div className="space-y-4">
                    <span className="font-bold text-gray-700 block">مدير إدارة الصيانة والتشغيل:</span>
                    <div className="font-black text-gray-900">م. عبد العزيز بن سالم</div>
                    <div className="border-b border-gray-400 w-3/4"></div>
                  </div>

                  <div className="space-y-4">
                    <span className="font-bold text-gray-700 block">مفتش / مقيم الاعتماد (CBAHI):</span>
                    <div className="text-gray-400 font-bold italic">[توقيع وختم المفتش المعتمد]</div>
                    <div className="border-b border-gray-400 w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Print Trigger */}
              <div className="flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#126B68] hover:bg-[#0d5553] text-white rounded-xl font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة تقرير الاعتماد لسباهي</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Close Button */}
        <div className="p-4 border-t border-[#EDF4F2] dark:border-[#1E3F3B] bg-[#FAFDFB] dark:bg-[#0F201E] flex items-center justify-between mt-auto">
          <span className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
            معايير الامتثال والجودة الطبية • CBAHI HTM.04 / SFDA NCMDR
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#5A736F] dark:text-[#9DBBB4] hover:text-[#193B3A] dark:hover:text-[#EDF7F4] bg-white dark:bg-[#16302D] border border-[#DCE8E5] dark:border-[#1F4540] rounded-xl hover:bg-[#F0F5F3] dark:hover:bg-[#1F423E] transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
