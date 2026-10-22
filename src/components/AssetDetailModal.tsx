import React, { useState } from "react";
import {
  X,
  QrCode,
  MapPin,
  Building2,
  Wrench,
  AlertTriangle,
  Printer,
  Download,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Award,
  Clock,
  Activity,
} from "lucide-react";
import { Asset, LockoutDetails } from "../types";
import { PrintableQrStickerModal } from "./PrintableQrStickerModal";

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
  onReportAsset: (asset: Asset) => void;
  onToggleLockout?: (assetId: string, lockout: boolean, details?: LockoutDetails) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  onClose,
  onReportAsset,
  onToggleLockout,
}) => {
  if (!asset) return null;

  const [isQrStickerOpen, setIsQrStickerOpen] = useState(false);
  const [isLotoFormOpen, setIsLotoFormOpen] = useState(false);
  const [lotoReason, setLotoReason] = useState("");
  const [lotoDangerLevel, setLotoDangerLevel] = useState<
    "حظر كامل - خطر كهربائي/إشعاعي" | "خارج الخدمة بانتظار قطع غيار" | "معايرة دورية حرجة"
  >("حظر كامل - خطر كهربائي/إشعاعي");
  const [lotoEngineer, setLotoEngineer] = useState("م. فهد العتيبي");
  const [lotoWarningNote, setLotoWarningNote] = useState("");

  const handleApplyLoto = () => {
    if (!onToggleLockout) return;
    const details: LockoutDetails = {
      reason: lotoReason || "عزل أمان تشغيلي لحين انتهاء الفحص الفني",
      dangerLevel: lotoDangerLevel,
      lockedBy: lotoEngineer || "مهندس أجهزة طبية",
      lockedAt: new Date().toISOString(),
      warningNote: lotoWarningNote || "يمنع تشغيل الجهاز أو وصله بالكهرباء أو استخدامه مع المرضى",
    };
    onToggleLockout(asset.id, true, details);
    setIsLotoFormOpen(false);
  };

  const handleReleaseLoto = () => {
    if (!onToggleLockout) return;
    onToggleLockout(asset.id, false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white dark:bg-[#122624] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#EDF4F2] dark:border-[#1E3F3B] sticky top-0 bg-white/95 dark:bg-[#122624]/95 backdrop-blur-xs z-10">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-[#E9F5F2] dark:bg-[#1D3C38] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md">
                {asset.id}
              </span>
              <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">{asset.department}</span>
              {asset.criticality && (
                <span className="text-[10px] font-bold bg-[#F4C96B]/15 text-[#9E6E16] dark:text-[#F4C96B] px-2 py-0.5 rounded-full border border-[#F4C96B]/30">
                  {asset.criticality.split(" - ")[0]}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#183633] hover:bg-[#E3EDE9] flex items-center justify-center text-[#5A736F] dark:text-[#9DBBB4] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* LOTO ACTIVE DANGER BANNER */}
            {asset.isLockedOut && (
              <div className="bg-[#FFF5F5] dark:bg-[#2E1412] border-2 border-red-500 rounded-2xl p-4 space-y-2 text-red-900 dark:text-red-200 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs text-red-700 dark:text-red-400">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    <span>⚠️ تحذير: عزل فني نشط (LOTO ACTIVE) — محظور للاستخدام الطبي</span>
                  </div>
                  <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded">
                    خارج الخدمة
                  </span>
                </div>
                {asset.lockoutDetails && (
                  <div className="bg-white/80 dark:bg-black/30 p-2.5 rounded-xl text-[11px] space-y-1 border border-red-200 dark:border-red-900/60">
                    <div>
                      <span className="font-bold">سبب العزل: </span>
                      <span>{asset.lockoutDetails.reason}</span>
                    </div>
                    <div>
                      <span className="font-bold">المهندس القائم بالعزل: </span>
                      <span>{asset.lockoutDetails.lockedBy}</span>
                    </div>
                    <div>
                      <span className="font-bold">توجيهات السلامة: </span>
                      <span className="text-red-700 dark:text-red-300 font-bold">
                        {asset.lockoutDetails.warningNote}
                      </span>
                    </div>
                  </div>
                )}
                {onToggleLockout && (
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={handleReleaseLoto}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>فك الحظر الفني وإعادة الجهاز للخدمة</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">{asset.name}</h3>
              <p className="text-xs text-[#788C88] dark:text-[#9DBBB4]">{asset.model}</p>
            </div>

            {/* QR Code Card */}
            <div className="bg-[#F8FBFA] dark:bg-[#0F201E] border border-[#DCE8E5] dark:border-[#1E3F3B] rounded-2xl p-4 text-center space-y-2">
              <div className="bg-white p-3 rounded-xl inline-block shadow-2xs border border-[#E1EBE8]">
                {/* Crisp SVG QR Code generator representation */}
                <svg viewBox="0 0 140 140" className="w-28 h-28 mx-auto">
                  <rect width="140" height="140" fill="#ffffff" />
                  {/* Outer corners */}
                  <rect x="10" y="10" width="35" height="35" fill="#126B68" rx="4" />
                  <rect x="15" y="15" width="25" height="25" fill="#ffffff" rx="2" />
                  <rect x="20" y="20" width="15" height="15" fill="#126B68" rx="2" />

                  <rect x="95" y="10" width="35" height="35" fill="#126B68" rx="4" />
                  <rect x="100" y="15" width="25" height="25" fill="#ffffff" rx="2" />
                  <rect x="105" y="20" width="15" height="15" fill="#126B68" rx="2" />

                  <rect x="10" y="95" width="35" height="35" fill="#126B68" rx="4" />
                  <rect x="15" y="100" width="25" height="25" fill="#ffffff" rx="2" />
                  <rect x="20" y="105" width="15" height="15" fill="#126B68" rx="2" />

                  {/* Data blocks */}
                  <rect x="52" y="15" width="10" height="10" fill="#193B3A" rx="1" />
                  <rect x="68" y="15" width="12" height="10" fill="#193B3A" rx="1" />
                  <rect x="52" y="32" width="14" height="14" fill="#126B68" rx="1" />
                  <rect x="72" y="32" width="12" height="10" fill="#193B3A" rx="1" />

                  <rect x="15" y="55" width="12" height="12" fill="#193B3A" rx="1" />
                  <rect x="35" y="55" width="10" height="10" fill="#126B68" rx="1" />
                  <rect x="55" y="55" width="18" height="18" fill="#193B3A" rx="1" />
                  <rect x="80" y="55" width="10" height="14" fill="#126B68" rx="1" />
                  <rect x="100" y="55" width="14" height="10" fill="#193B3A" rx="1" />
                  <rect x="120" y="55" width="10" height="12" fill="#126B68" rx="1" />

                  <rect x="15" y="75" width="14" height="10" fill="#126B68" rx="1" />
                  <rect x="35" y="75" width="10" height="12" fill="#193B3A" rx="1" />
                  <rect x="80" y="75" width="14" height="10" fill="#193B3A" rx="1" />
                  <rect x="105" y="75" width="15" height="15" fill="#126B68" rx="1" />

                  <rect x="55" y="95" width="12" height="10" fill="#193B3A" rx="1" />
                  <rect x="75" y="95" width="10" height="14" fill="#126B68" rx="1" />
                  <rect x="95" y="95" width="14" height="12" fill="#193B3A" rx="1" />
                  <rect x="115" y="95" width="12" height="10" fill="#126B68" rx="1" />

                  <rect x="55" y="115" width="15" height="15" fill="#126B68" rx="1" />
                  <rect x="80" y="118" width="10" height="12" fill="#193B3A" rx="1" />
                  <rect x="100" y="115" width="12" height="15" fill="#193B3A" rx="1" />
                  <rect x="118" y="115" width="12" height="12" fill="#126B68" rx="1" />
                </svg>
              </div>
              <div className="font-mono text-xs text-[#126B68] dark:text-[#4ECDC4] font-bold">
                {asset.qrCode}
              </div>
              <p className="text-[10px] text-[#738884] dark:text-[#9DBBB4]">
                امسح الكود عبر كاميرا الجوال لفتح ملف الجهاز أو رفع بلاغ عطل فوري
              </p>
            </div>

            {/* HTM Reliability Metrics Pill (MTBF / MTTR / Uptime) */}
            <div className="grid grid-cols-3 gap-2 bg-[#F2F8F6] dark:bg-[#0E2220] p-3 rounded-2xl border border-[#D5EAE4] dark:border-[#1E433E] text-center">
              <div>
                <span className="text-[10px] text-[#556E69] dark:text-[#9DBBB4] block">جاهزية التشغيل</span>
                <span className="font-black text-xs text-emerald-700 dark:text-emerald-400">
                  {asset.uptimeRate ? `${asset.uptimeRate}%` : "98.5%"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#556E69] dark:text-[#9DBBB4] block">MTBF (بين الأعطال)</span>
                <span className="font-mono font-black text-xs text-[#193B3A] dark:text-[#EDF7F4]">
                  {asset.mtbfDays ? `${asset.mtbfDays} يوم` : "160 يوم"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#556E69] dark:text-[#9DBBB4] block">MTTR (وقت الإصلاح)</span>
                <span className="font-mono font-black text-xs text-[#126B68] dark:text-[#4ECDC4]">
                  {asset.mttrHours ? `${asset.mttrHours} ساعة` : "2.4 س"}
                </span>
              </div>
            </div>

            {/* Details list */}
            <div className="space-y-2 bg-[#F6FAF8] dark:bg-[#152E2B] p-3.5 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E]">
              <div className="flex justify-between py-1 border-b border-[#E1EBE8] dark:border-[#1F423E]">
                <span className="text-[#788C88] dark:text-[#9DBBB4]">الحالة التشغيلية:</span>
                <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4]">{asset.status}</span>
              </div>
              {asset.criticality && (
                <div className="flex justify-between py-1 border-b border-[#E1EBE8] dark:border-[#1F423E]">
                  <span className="text-[#788C88] dark:text-[#9DBBB4]">مستوى الحرجية (AAMI):</span>
                  <span className="font-bold text-[#126B68] dark:text-[#4ECDC4]">{asset.criticality}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-[#E1EBE8] dark:border-[#1F423E]">
                <span className="text-[#788C88] dark:text-[#9DBBB4]">الرقم التسلسلي (S/N):</span>
                <span className="font-mono font-bold text-[#193B3A] dark:text-[#EDF7F4]">{asset.serial}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E1EBE8] dark:border-[#1F423E]">
                <span className="text-[#788C88] dark:text-[#9DBBB4]">الموقع والمبنى:</span>
                <span className="font-medium text-[#193B3A] dark:text-[#EDF7F4]">{asset.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E1EBE8] dark:border-[#1F423E]">
                <span className="text-[#788C88] dark:text-[#9DBBB4]">الشركة الموردة والوكيل:</span>
                <span className="font-medium text-[#193B3A] dark:text-[#EDF7F4]">{asset.vendor}</span>
              </div>
              {asset.serviceContractVendor && (
                <div className="flex justify-between py-1 border-b border-[#E1EBE8] dark:border-[#1F423E]">
                  <span className="text-[#788C88] dark:text-[#9DBBB4]">عقد الصيانة والضمان:</span>
                  <span className="font-medium text-[#126B68] dark:text-[#4ECDC4] truncate max-w-[200px]">
                    {asset.serviceContractVendor}
                  </span>
                </div>
              )}
              {asset.warrantyExpiry && (
                <div className="flex justify-between py-1 border-b border-[#E1EBE8] dark:border-[#1F423E]">
                  <span className="text-[#788C88] dark:text-[#9DBBB4]">تاريخ انتهاء الضمان:</span>
                  <span className="font-bold text-[#2B7A3D] dark:text-emerald-400">{asset.warrantyExpiry}</span>
                </div>
              )}
              {asset.lastMaintenance && (
                <div className="flex justify-between py-1 border-b border-[#E1EBE8] dark:border-[#1F423E]">
                  <span className="text-[#788C88] dark:text-[#9DBBB4]">تاريخ آخر معايرة:</span>
                  <span className="font-bold text-[#2B7A3D] dark:text-emerald-400">{asset.lastMaintenance}</span>
                </div>
              )}
              {asset.notes && (
                <div className="pt-2">
                  <span className="text-[#788C88] dark:text-[#9DBBB4] block mb-1">ملاحظات فنية مسجلة:</span>
                  <p className="text-[#45615D] dark:text-[#C4D9D4] bg-white dark:bg-[#122624] p-2 rounded-lg border border-[#E1EBE8] dark:border-[#1F423E]">
                    {asset.notes}
                  </p>
                </div>
              )}
            </div>

            {/* LOTO Apply Form */}
            {isLotoFormOpen && (
              <div className="bg-[#FFF5F5] dark:bg-[#2A1715] p-3.5 rounded-2xl border border-red-300 dark:border-red-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-red-700 dark:text-red-300 flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>تطبيق الحظر الفني والعزل (LOTO)</span>
                  </span>
                  <button
                    onClick={() => setIsLotoFormOpen(false)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-0.5">سبب العزل:</label>
                    <input
                      type="text"
                      value={lotoReason}
                      onChange={(e) => setLotoReason(e.target.value)}
                      placeholder="مثال: احتكاك ميكانيكي حرج، صدمة كهربائية محتملة..."
                      className="w-full bg-white dark:bg-[#152E2B] border rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-0.5">مستوى الخطر:</label>
                    <select
                      value={lotoDangerLevel}
                      onChange={(e: any) => setLotoDangerLevel(e.target.value)}
                      className="w-full bg-white dark:bg-[#152E2B] border rounded-lg p-2 text-xs"
                    >
                      <option value="حظر كامل - خطر كهربائي/إشعاعي">حظر كامل - خطر كهربائي/إشعاعي</option>
                      <option value="خارج الخدمة بانتظار قطع غيار">خارج الخدمة بانتظار قطع غيار</option>
                      <option value="معايرة دورية حرجة">معايرة دورية حرجة</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsLotoFormOpen(false)}
                      className="px-3 py-1.5 border rounded-lg text-xs font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleApplyLoto}
                      className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>تأكيد عزل وحظر الجهاز</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  onClose();
                  onReportAsset(asset);
                }}
                className="flex-1 py-2.5 bg-[#C9684D] hover:bg-[#b5583e] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>تسجيل بلاغ عطل</span>
              </button>

              {!asset.isLockedOut && onToggleLockout && (
                <button
                  onClick={() => setIsLotoFormOpen(!isLotoFormOpen)}
                  className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/60 cursor-pointer"
                  title="عزل الجهاز وحظر استخدامه"
                >
                  <Lock className="w-4 h-4" />
                  <span>عزل (LOTO)</span>
                </button>
              )}

              <button
                onClick={() => setIsQrStickerOpen(true)}
                className="py-2.5 px-4 bg-[#126B68] hover:bg-[#0d5553] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة ملصق QR</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized QR Label Printing Modal */}
      {isQrStickerOpen && (
        <PrintableQrStickerModal
          asset={asset}
          onClose={() => setIsQrStickerOpen(false)}
        />
      )}
    </>
  );
};

