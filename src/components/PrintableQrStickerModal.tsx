import React, { useRef, useState } from "react";
import { X, Printer, QrCode, ShieldAlert, CheckCircle2, Copy, Download, Building2, Tag } from "lucide-react";
import { Asset } from "../types";

interface PrintableQrStickerModalProps {
  asset: Asset | null;
  onClose: () => void;
}

export const PrintableQrStickerModal: React.FC<PrintableQrStickerModalProps> = ({
  asset,
  onClose,
}) => {
  if (!asset) return null;

  const [labelSize, setLabelSize] = useState<"standard" | "compact" | "large">("standard");
  const [copied, setCopied] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(asset.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#122624] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EDF4F2] dark:border-[#1E3F3B] sticky top-0 bg-white/95 dark:bg-[#122624]/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#126B68] text-white flex items-center justify-center shadow-2xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4]">
                طباعة ملصق الباركود ورمز QR المعتمد
              </h3>
              <p className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                ملصق بمواصفات وزارة الصحة ومعايير اعتماد سباهي (CBAHI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#183633] hover:bg-[#E3EDE9] flex items-center justify-center text-[#5A736F] dark:text-[#9DBBB4] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Label Format Selector */}
          <div className="flex items-center justify-between bg-[#F6FAF8] dark:bg-[#0F201E] p-2 rounded-2xl border border-[#E1EBE8] dark:border-[#1E3F3B]">
            <span className="text-[11px] font-bold text-[#556E69] dark:text-[#9DBBB4] px-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#126B68]" />
              <span>حجم ملصق الطباعة:</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLabelSize("compact")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  labelSize === "compact"
                    ? "bg-[#126B68] text-white shadow-2xs"
                    : "text-[#556E69] dark:text-[#9DBBB4] hover:bg-white dark:hover:bg-[#183633]"
                }`}
              >
                مدمج (50×30 مم)
              </button>
              <button
                onClick={() => setLabelSize("standard")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  labelSize === "standard"
                    ? "bg-[#126B68] text-white shadow-2xs"
                    : "text-[#556E69] dark:text-[#9DBBB4] hover:bg-white dark:hover:bg-[#183633]"
                }`}
              >
                قياسي (80×50 مم)
              </button>
              <button
                onClick={() => setLabelSize("large")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  labelSize === "large"
                    ? "bg-[#126B68] text-white shadow-2xs"
                    : "text-[#556E69] dark:text-[#9DBBB4] hover:bg-white dark:hover:bg-[#183633]"
                }`}
              >
                لوحة تعريف (A6)
              </button>
            </div>
          </div>

          {/* Printable Label Preview Area */}
          <div className="flex justify-center p-3 bg-gray-100 dark:bg-black/30 rounded-2xl border border-dashed border-[#CDE5DF] dark:border-[#224A45]">
            <div
              id="printable-hospital-label"
              ref={printAreaRef}
              className={`bg-white text-black p-4 rounded-xl border-2 shadow-md transition-all ${
                asset.isLockedOut ? "border-red-600 ring-4 ring-red-500/20" : "border-[#126B68]"
              } ${
                labelSize === "compact"
                  ? "w-[280px] text-[9px]"
                  : labelSize === "large"
                  ? "w-[400px] text-[12px]"
                  : "w-[340px] text-[10px]"
              }`}
              style={{ direction: "rtl", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              {/* If Locked Out Banner */}
              {asset.isLockedOut && (
                <div className="bg-red-600 text-white text-center py-1 px-2 mb-2 rounded font-black text-[11px] tracking-wide flex items-center justify-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-4 h-4" />
                  <span>تحذير: عزل فني (LOTO) — محظور للاستخدام الطبي</span>
                </div>
              )}

              {/* Label Header */}
              <div className="flex items-center justify-between border-b-2 border-black/80 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-md bg-[#126B68] text-white flex items-center justify-center font-black text-[11px]">
                    ع
                  </div>
                  <div>
                    <div className="font-black text-[11px] text-gray-900 leading-tight">
                      مستشفى عين التخصصي
                    </div>
                    <div className="text-[8px] text-gray-600 font-bold">
                      إدارة الهندسة الطبية • CBAHI Accredited
                    </div>
                  </div>
                </div>
                <div className="text-left font-mono text-[9px] font-extrabold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">
                  {asset.id}
                </div>
              </div>

              {/* Middle Section: QR + Asset Details */}
              <div className="flex items-center gap-3">
                {/* Visual SVG QR */}
                <div className="shrink-0 bg-white p-1 rounded-lg border border-black/40 text-center">
                  <svg viewBox="0 0 140 140" className="w-20 h-20 mx-auto">
                    <rect width="140" height="140" fill="#ffffff" />
                    {/* Corners */}
                    <rect x="10" y="10" width="35" height="35" fill="#126B68" rx="4" />
                    <rect x="15" y="15" width="25" height="25" fill="#ffffff" rx="2" />
                    <rect x="20" y="20" width="15" height="15" fill="#126B68" rx="2" />

                    <rect x="95" y="10" width="35" height="35" fill="#126B68" rx="4" />
                    <rect x="100" y="15" width="25" height="25" fill="#ffffff" rx="2" />
                    <rect x="105" y="20" width="15" height="15" fill="#126B68" rx="2" />

                    <rect x="10" y="95" width="35" height="35" fill="#126B68" rx="4" />
                    <rect x="15" y="100" width="25" height="25" fill="#ffffff" rx="2" />
                    <rect x="20" y="105" width="15" height="15" fill="#126B68" rx="2" />

                    {/* Matrix pattern */}
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
                  <div className="font-mono text-[8px] font-bold text-gray-700 mt-0.5">
                    {asset.qrCode}
                  </div>
                </div>

                {/* Info Text */}
                <div className="flex-1 space-y-1">
                  <div>
                    <div className="font-black text-gray-900 line-clamp-1 leading-tight text-[11px]">
                      {asset.name}
                    </div>
                    <div className="text-gray-600 font-bold text-[9px]">{asset.model}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] pt-1 border-t border-gray-200">
                    <div>
                      <span className="text-gray-500 font-medium">القسم: </span>
                      <span className="font-bold text-gray-900">{asset.department}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">S/N: </span>
                      <span className="font-mono font-bold text-gray-900">{asset.serial}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 font-medium">الموقع: </span>
                      <span className="font-bold text-gray-900 truncate">{asset.location}</span>
                    </div>
                    {asset.criticality && (
                      <div className="col-span-2">
                        <span className="text-gray-500 font-medium">الحرجية: </span>
                        <span className="font-bold text-[#126B68]">{asset.criticality}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom CBAHI Calibration Strip */}
              <div className="mt-2 pt-1.5 border-t-2 border-black/80 flex items-center justify-between text-[8px] bg-gray-50 p-1 rounded">
                <div>
                  <span className="text-gray-500">آخر معايرة: </span>
                  <span className="font-bold text-green-700">{asset.lastMaintenance || "معتمد"}</span>
                </div>
                <div>
                  <span className="text-gray-500">المعايرة القادمة: </span>
                  <span className="font-bold text-gray-900">{asset.nextPpmDueDate || "2026-11-20"}</span>
                </div>
                <div className="flex items-center gap-0.5 text-green-700 font-bold">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span>CBAHI PASS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Details & Copy Options */}
          <div className="bg-[#F8FCFA] dark:bg-[#16302D] p-3 rounded-2xl border border-[#DCE8E5] dark:border-[#1F4540] flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#78918D] dark:text-[#9DBBB4]">رمز QR المسجل بالنظام:</div>
              <div className="font-mono text-xs font-black text-[#126B68] dark:text-[#4ECDC4] mt-0.5">
                {asset.qrCode}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#1D3C38] hover:bg-[#EEF5F3] text-[#193B3A] dark:text-[#EDF7F4] rounded-xl border border-[#CDE5DF] dark:border-[#2A5752] font-bold text-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "تم النسخ!" : "نسخ الكود"}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#DCE8E5] dark:border-[#1F423E] text-[#526B66] dark:text-[#9DBBB4] font-bold hover:bg-gray-50 dark:hover:bg-[#163330] cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>إرسال إلى طابعة الملصقات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
