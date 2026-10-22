import React, { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Building2,
  Clock,
  PlusCircle,
  FileCheck2,
  Info,
} from "lucide-react";
import { SfdaSafetyAlert, Asset } from "../types";

interface SfdaAlertsModalProps {
  isOpen?: boolean;
  alerts: SfdaSafetyAlert[];
  assets: Asset[];
  onClose: () => void;
  onUpdateAlert: (updatedAlert: SfdaSafetyAlert) => void;
  onOpenAssetDetail: (asset: Asset) => void;
}

export const SfdaAlertsModal: React.FC<SfdaAlertsModalProps> = ({
  isOpen = true,
  alerts,
  assets,
  onClose,
  onUpdateAlert,
  onOpenAssetDetail,
}) => {
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("الكل");
  const [filterStatus, setFilterStatus] = useState<string>("الكل");
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<SfdaSafetyAlert | null>(null);
  const [actionNotesInput, setActionNotesInput] = useState("");
  const [engineerNameInput, setEngineerNameInput] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((item) => {
    const matchesSearch =
      !search ||
      item.alertNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.deviceName.toLowerCase().includes(search.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      item.actionRequired.toLowerCase().includes(search.toLowerCase());

    const matchesRisk = filterRisk === "الكل" || item.riskClass.includes(filterRisk);
    const matchesStatus = filterStatus === "الكل" || item.status === filterStatus;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  const criticalCount = alerts.filter((a) => a.riskClass.includes("حرج")).length;
  const openCount = alerts.filter((a) => a.status === "مفتوح").length;
  const actionTakenCount = alerts.filter((a) => a.status !== "مفتوح").length;

  const handleOpenAction = (alert: SfdaSafetyAlert) => {
    setSelectedAlertForAction(alert);
    setActionNotesInput(alert.actionNote || "");
    setEngineerNameInput(alert.actionTakenBy || "م. فهد العتيبي");
  };

  const handleSaveAction = (newStatus: "تم اتخاذ الإجراء" | "مغلق") => {
    if (!selectedAlertForAction) return;

    const updated: SfdaSafetyAlert = {
      ...selectedAlertForAction,
      status: newStatus,
      actionNote: actionNotesInput,
      actionTakenBy: engineerNameInput || "مهندس الأجهزة الطبية",
      actionDate: new Date().toISOString().split("T")[0],
    };

    onUpdateAlert(updated);
    setSelectedAlertForAction(null);
  };

  return (
    <div
      id="sfda-alerts-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div
        id="sfda-alerts-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#122624] rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EDF4F2] dark:border-[#1E3F3B] sticky top-0 bg-white/95 dark:bg-[#122624]/95 backdrop-blur-xs z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  إنذارات واستدعاءات الأجهزة الطبية (SFDA / NCMDR)
                </h2>
                <span className="bg-[#126B68] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  المركز الوطني
                </span>
              </div>
              <p className="text-xs text-[#738884] dark:text-[#9DBBB4] mt-0.5">
                رصد تعميمات هيئة الغذاء والدواء والشركات المصنعة ومطابقتها بأجهزة المستشفى
              </p>
            </div>
          </div>
          <button
            id="close-sfda-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#183633] hover:bg-[#E3EDE9] dark:hover:bg-[#1F423E] flex items-center justify-center text-[#5A736F] dark:text-[#9DBBB4] hover:text-[#193B3A] dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FFF6F5] dark:bg-[#2A1715] border border-[#FCDAD6] dark:border-[#4D2420] p-3 rounded-2xl">
              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold block">
                استدعاءات حرجة (سحب فوري)
              </span>
              <div className="text-xl font-black text-red-700 dark:text-red-300 mt-0.5">
                {criticalCount}
              </div>
            </div>
            <div className="bg-[#FFFBEB] dark:bg-[#2B2313] border border-[#FEF3C7] dark:border-[#4B3B1C] p-3 rounded-2xl">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">
                إنذارات مفتوحة قيد الإجراء
              </span>
              <div className="text-xl font-black text-amber-800 dark:text-amber-200 mt-0.5">
                {openCount}
              </div>
            </div>
            <div className="bg-[#E5F5E8] dark:bg-[#122A1E] border border-[#CBEAD2] dark:border-[#1B432F] p-3 rounded-2xl">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
                تم تنفيذ الإجراء المطلوب
              </span>
              <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
                {actionTakenCount}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#F8FCFA] dark:bg-[#0F201E] p-3 rounded-2xl border border-[#DCE8E5] dark:border-[#1E3F3B] space-y-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث برقم التعميم، اسم الجهاز، الموديل المتأثر، أو الإجراء المطلوب..."
                className="w-full bg-white dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl py-2 pr-9 pl-4 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
              />
              <Search className="w-4 h-4 text-[#8B9A97] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#556E69] dark:text-[#9DBBB4]">الخطورة:</span>
              {["الكل", "حرج", "متوسط", "منخفض"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRisk(r)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterRisk === r
                      ? "bg-[#126B68] text-white"
                      : "bg-white dark:bg-[#183633] text-[#556E69] dark:text-[#9DBBB4] border border-[#E1EBE8] dark:border-[#1F423E]"
                  }`}
                >
                  {r}
                </button>
              ))}

              <span className="text-[11px] font-bold text-[#556E69] dark:text-[#9DBBB4] mr-2">الحالة:</span>
              {["الكل", "مفتوح", "تم اتخاذ الإجراء", "مغلق"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterStatus === s
                      ? "bg-[#126B68] text-white"
                      : "bg-white dark:bg-[#183633] text-[#556E69] dark:text-[#9DBBB4] border border-[#E1EBE8] dark:border-[#1F423E]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 bg-[#F6FAF8] dark:bg-[#0F201E] rounded-2xl border border-[#E1EBE8] dark:border-[#1E3F3B] p-6">
                <Info className="w-8 h-8 text-[#78918D] mx-auto mb-1.5" />
                <p className="font-bold text-sm text-[#193B3A] dark:text-[#EDF7F4]">
                  لا توجد تعميمات تطابق معايير البحث الحالية
                </p>
              </div>
            ) : (
              filteredAlerts.map((item) => {
                const matchedAssets = assets.filter((a) =>
                  item.matchedHospitalAssetIds.includes(a.id)
                );

                const isCritical = item.riskClass.includes("حرج");
                const isMedium = item.riskClass.includes("متوسط");

                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-[#152E2B] rounded-2xl border p-4 transition-all shadow-xs space-y-3 ${
                      isCritical
                        ? "border-red-300 dark:border-red-900/60 ring-2 ring-red-500/10"
                        : isMedium
                        ? "border-amber-300 dark:border-amber-900/60"
                        : "border-[#E1EBE8] dark:border-[#1F423E]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black bg-[#E9F5F2] dark:bg-[#1D3C38] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded">
                            {item.alertNumber}
                          </span>
                          <span className="text-[10px] text-[#738884] dark:text-[#9DBBB4]">
                            المصدر: {item.source} • {item.issueDate}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4] mt-1">
                          {item.deviceName}
                        </h3>
                        <p className="text-[11px] text-[#556E69] dark:text-[#9DBBB4]">
                          الشركة المصنعة: <span className="font-bold">{item.manufacturer}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 self-start">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCritical
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
                              : isMedium
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                          }`}
                        >
                          {item.riskClass}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === "مفتوح"
                              ? "bg-[#FFF2D6] text-[#B86B00] border-[#F4DCAB]"
                              : "bg-[#E5F5E8] text-[#2B7A3D] border-[#CBEAD2]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Action Required Box */}
                    <div className="bg-[#F8FCFA] dark:bg-[#0F201E] p-3 rounded-xl border border-[#DCE8E5] dark:border-[#1E3F3B]">
                      <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block mb-0.5 text-[11px]">
                        الإجراء الفني الإلزامي المطلوب:
                      </span>
                      <p className="text-xs text-[#45615D] dark:text-[#C4D9D4] leading-relaxed">
                        {item.actionRequired}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-[10px] font-bold text-[#738884] dark:text-[#9DBBB4]">
                          الموديلات المشمولة:
                        </span>
                        {item.affectedModels.map((m) => (
                          <span
                            key={m}
                            className="bg-gray-100 dark:bg-[#1E3F3B] text-gray-700 dark:text-[#CDE5DF] text-[10px] px-2 py-0.2 rounded font-mono"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Matched Assets in Hospital */}
                    {matchedAssets.length > 0 && (
                      <div className="bg-[#FFFDF5] dark:bg-[#1B251F] p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <div>
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">
                              الأجهزة المطابقة المتواجدة بالمستشفى:
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {matchedAssets.map((asset) => (
                                <button
                                  key={asset.id}
                                  onClick={() => {
                                    onClose();
                                    onOpenAssetDetail(asset);
                                  }}
                                  className="font-mono text-[10px] font-bold bg-white dark:bg-[#163330] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700/60 hover:underline cursor-pointer"
                                >
                                  {asset.id} — {asset.name} ({asset.department})
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Taken Log if any */}
                    {item.actionNote && (
                      <div className="bg-[#EBF7F4] dark:bg-[#13322D] p-2.5 rounded-xl border border-[#CDE5DF] dark:border-[#224A45] text-[11px] text-[#193B3A] dark:text-[#EDF7F4]">
                        <div className="flex items-center gap-1 font-bold text-[#126B68] dark:text-[#4ECDC4] mb-0.5">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>توثيق الإجراء المتخذ:</span>
                        </div>
                        <p className="text-[#3F5B56] dark:text-[#B4D0C9]">{item.actionNote}</p>
                        <div className="text-[10px] text-[#738884] dark:text-[#8FAAA4] mt-1">
                          المهندس المعتمد: {item.actionTakenBy} • التاريخ: {item.actionDate}
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                      {item.referenceUrl ? (
                        <a
                          href={item.referenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-[#126B68] dark:text-[#4ECDC4] hover:underline flex items-center gap-1"
                        >
                          <span>رابط التعميم بالهيئة (SFDA NCMDR)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span />
                      )}

                      <button
                        onClick={() => handleOpenAction(item)}
                        className="px-3 py-1.5 bg-[#126B68] hover:bg-[#0d5553] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>توثيق وتحديث الإجراء</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal for Recording Action */}
        {selectedAlertForAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#122624] rounded-2xl max-w-md w-full p-5 border border-[#E1EBE8] dark:border-[#1F423E] shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <h3 className="font-black text-sm text-[#193B3A] dark:text-[#EDF7F4]">
                  توثيق الإجراء الفني لبلاغ SFDA
                </h3>
                <button
                  onClick={() => setSelectedAlertForAction(null)}
                  className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-gray-500 block mb-0.5">رقم التعميم والجهاز:</span>
                  <div className="font-black text-[#193B3A] dark:text-[#EDF7F4]">
                    {selectedAlertForAction.alertNumber} — {selectedAlertForAction.deviceName}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#526B66] dark:text-[#9DBBB4] block mb-1">
                    اسم المهندس المسؤول:
                  </label>
                  <input
                    type="text"
                    value={engineerNameInput}
                    onChange={(e) => setEngineerNameInput(e.target.value)}
                    placeholder="مثال: م. فهد العتيبي"
                    className="w-full bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#EDF7F4]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#526B66] dark:text-[#9DBBB4] block mb-1">
                    تفاصيل الإجراء المتخذ وتاريخ الإنجاز:
                  </label>
                  <textarea
                    value={actionNotesInput}
                    onChange={(e) => setActionNotesInput(e.target.value)}
                    rows={3}
                    placeholder="تم فحص بكرات الدعم، أو تثبيت التحديث البرمجي، أو عزل الجهاز وسحب كابل الطاقة..."
                    className="w-full bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#DCE8E5] dark:border-[#244C47] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedAlertForAction(null)}
                    className="px-3 py-2 border rounded-xl font-bold text-gray-600 dark:text-gray-300 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleSaveAction("تم اتخاذ الإجراء")}
                    className="px-4 py-2 bg-[#126B68] hover:bg-[#0d5553] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد الإجراء وحفظ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal Footer with Close Button */}
        <div className="p-4 border-t border-[#EDF4F2] dark:border-[#1E3F3B] bg-[#FAFDFB] dark:bg-[#0F201E] flex items-center justify-between mt-auto">
          <span className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
            الهيئة العامة للغذاء والدواء • المركز الوطني للتيقظ وسلامة الأجهزة الطبية
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
