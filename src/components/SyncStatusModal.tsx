import React from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ArrowUpDown,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from "lucide-react";
import { OfflineQueueItem, SyncStatus } from "../types";

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  syncStatus: SyncStatus;
  offlineQueue: OfflineQueueItem[];
  onTriggerSync: () => void;
  onClearQueue: () => void;
  lastSyncTime: string | null;
  storageStats: {
    cachedReportsCount: number;
    cachedAssetsCount: number;
    cachedProductsCount: number;
    cachedCalibrationLogsCount: number;
  };
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  syncStatus,
  offlineQueue,
  onTriggerSync,
  onClearQueue,
  lastSyncTime,
  storageStats,
}) => {
  if (!isOpen) return null;

  const effectiveOnline = isOnline && !isSimulatedOffline;

  const formatTime = (isoString?: string | null) => {
    if (isoString) {
      try {
        const d = new Date(isoString);
        return d.toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " — " + d.toLocaleDateString("ar-SA");
      } catch {
        return isoString;
      }
    }
    if (effectiveOnline && offlineQueue.length === 0) {
      return "البيانات متطابقة مع الخادم المركزي (تم التحقق تلقائياً)";
    }
    return "بانتظار إجراء أول مزامنة في هذه الجلسة";
  };

  return (
    <div
      id="sync-status-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#193B3A]/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="sync-status-modal-container"
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-[#E1EBE8] overflow-hidden flex flex-col max-h-[90vh] text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#193B3A] to-[#126B68] text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                effectiveOnline ? "bg-[#10B981]/20 text-[#10B981]" : "bg-[#EF4444]/20 text-[#FCA5A5]"
              }`}
            >
              {effectiveOnline ? (
                <Wifi className="w-6 h-6" />
              ) : (
                <WifiOff className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black flex items-center gap-2">
                حالة الاتصال والمزامنة المحلية
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    effectiveOnline
                      ? "bg-[#10B981] text-white"
                      : "bg-[#EF4444] text-white"
                  }`}
                >
                  {effectiveOnline ? "متصل بالشبكة" : "وضع عدم الاتصال (Offline)"}
                </span>
              </h2>
              <p className="text-xs text-[#D6E5E1] mt-0.5">
                تخزين محلي مؤقت (LocalStorage) واستمرارية العمل دون انقطاع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Real-time Status Card */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              effectiveOnline
                ? "bg-[#EAFBF3] border-[#A7F3D0] text-[#065F46]"
                : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full animate-ping ${
                  effectiveOnline ? "bg-[#10B981]" : "bg-[#EF4444]"
                }`}
              ></span>
              <div>
                <p className="font-bold text-sm">
                  {effectiveOnline
                    ? "الاتصال بالخادم المركزي مستقر ونشط"
                    : "النظام يعمل بنمط الطوارئ المحلي غير المتصل"}
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  {effectiveOnline
                    ? "البيانات تُزامن وتُحفظ تلقائياً في السيرفر والتخزين المؤقت."
                    : "كافة الإجراءات والبلاغات تُحفظ محلياً في جهازك وتُدرج في طابور المزامنة التلقائي."}
                </p>
              </div>
            </div>

            {effectiveOnline && (
              <button
                onClick={onTriggerSync}
                disabled={syncStatus === "syncing"}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#065F46] hover:bg-[#044E3A] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    syncStatus === "syncing" ? "animate-spin" : ""
                  }`}
                />
                {syncStatus === "syncing" ? "جاري المزامنة..." : "مزامنة الآن"}
              </button>
            )}
          </div>

          {/* Offline Mode Toggle for Testing */}
          <div className="p-4 bg-[#F8FAFA] rounded-2xl border border-[#E1EBE8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E1EBE8] flex items-center justify-center text-[#193B3A]">
                <ArrowUpDown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-[#193B3A]">
                  محاكاة وضع انقطاع الشبكة (Offline Simulation)
                </h4>
                <p className="text-[11px] text-[#8B9A97] mt-0.5">
                  فعّل هذا الخيار لاختبار حفظ البلاغات والمعايرة محلياً أثناء انقطاع الإنترنت
                </p>
              </div>
            </div>

            <button
              onClick={onToggleSimulatedOffline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isSimulatedOffline
                  ? "bg-[#EF4444] text-white shadow-xs"
                  : "bg-[#E1EBE8] text-[#193B3A] hover:bg-[#D3E0DC]"
              }`}
            >
              {isSimulatedOffline ? (
                <>
                  <ToggleRight className="w-4 h-4 text-white" />
                  محاكاة الانقطاع نشطة
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-[#8B9A97]" />
                  محاكاة الانقطاع مطفأة
                </>
              )}
            </button>
          </div>

          {/* Offline Operations Queue */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#126B68]" />
                <h3 className="text-sm font-black text-[#193B3A]">
                  طابور العمليات المعلقة للمزامنة ({offlineQueue.length})
                </h3>
              </div>
              {offlineQueue.length > 0 && (
                <button
                  onClick={onClearQueue}
                  className="text-xs text-[#C9684D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  تفريغ الطابور
                </button>
              )}
            </div>

            {offlineQueue.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#F8FAFA] border border-[#E1EBE8] text-center">
                <CheckCircle2 className="w-7 h-7 text-[#10B981] mx-auto mb-1.5" />
                <p className="text-xs font-bold text-[#193B3A]">
                  لا توجد عمليات معلقة في الطابور
                </p>
                <p className="text-[11px] text-[#8B9A97] mt-0.5">
                  كافة العمليات المحلية متزامنة ومحدثة على الخادم المركزي.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {offlineQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-xl border border-[#E1EBE8] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                      <div>
                        <p className="font-bold text-[#193B3A]">{item.description}</p>
                        <p className="text-[10px] text-[#8B9A97]">
                          النوع: {item.type} • وقت التسجيل:{" "}
                          {new Date(item.timestamp).toLocaleTimeString("ar-SA")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.status === "syncing"
                          ? "bg-blue-100 text-blue-800"
                          : item.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status === "syncing"
                        ? "جاري المزامنة"
                        : item.status === "failed"
                        ? "تعذر الإرسال"
                        : "معلق بالمخزن المحلي"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local Storage Analytics */}
          <div className="p-4 rounded-2xl bg-[#F0F6F5] border border-[#D0E2DF] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#126B68]" />
                <h4 className="text-xs font-black text-[#193B3A]">
                  إحصائيات التخزين المؤقت المحلي (LocalStorage)
                </h4>
              </div>
              <span className="text-[10px] text-[#126B68] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> تخزين معزول بمتصفح المستخدم (Client Cache)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-[#D0E2DF]">
                <p className="text-base font-black text-[#126B68]">
                  {storageStats.cachedReportsCount}
                </p>
                <p className="text-[10px] text-[#8B9A97]">بلاغات مخزنة</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#D0E2DF]">
                <p className="text-base font-black text-[#126B68]">
                  {storageStats.cachedAssetsCount}
                </p>
                <p className="text-[10px] text-[#8B9A97]">أجهزة ومرافق</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#D0E2DF]">
                <p className="text-base font-black text-[#126B68]">
                  {storageStats.cachedProductsCount}
                </p>
                <p className="text-[10px] text-[#8B9A97]">أصناف مخزون</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#D0E2DF]">
                <p className="text-base font-black text-[#126B68]">
                  {storageStats.cachedCalibrationLogsCount}
                </p>
                <p className="text-[10px] text-[#8B9A97]">سجلات معايرة PPM</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#8B9A97] pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#126B68]" />
                آخر مزامنة ناجحة:
              </span>
              <span className="font-bold text-[#193B3A]">
                {formatTime(lastSyncTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F8FAFA] border-t border-[#E1EBE8] flex justify-between items-center">
          <span className="text-[11px] text-[#8B9A97]">
            يدعم النظام نمط العمل في غرف العمليات والعناية والممرات المعزولة عن التغطية.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#193B3A] hover:bg-[#126B68] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
