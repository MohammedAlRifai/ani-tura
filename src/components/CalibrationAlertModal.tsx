import React from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  ShieldAlert,
  ChevronLeft,
  CheckCircle,
  Wrench,
  X,
  Building2,
  ExternalLink,
} from "lucide-react";
import { PpmSchedule } from "../types";

export interface ExpiringCalibrationItem {
  schedule: PpmSchedule;
  daysRemaining: number;
}

interface CalibrationAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiringItems: ExpiringCalibrationItem[];
  onNavigateToPpm: () => void;
  userName?: string;
  roleTitle?: string;
}

export const CalibrationAlertModal: React.FC<CalibrationAlertModalProps> = ({
  isOpen,
  onClose,
  expiringItems,
  onNavigateToPpm,
  userName,
  roleTitle,
}) => {
  if (!isOpen || expiringItems.length === 0) return null;

  const overdueItems = expiringItems.filter((item) => item.daysRemaining < 0);
  const dueSoonItems = expiringItems.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 7);

  const criticalCount = expiringItems.filter(
    (item) => item.schedule.riskLevel === "حرج"
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-alert-title"
    >
      <div className="bg-white dark:bg-[#122624] w-full max-w-2xl rounded-3xl shadow-2xl border border-amber-200 dark:border-amber-900/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with high-visibility warning styling */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-red-600 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-black/30 text-amber-200 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-300/30">
                  تنبيه المعايرة والسلامة الطبية (CBAHI)
                </span>
                {overdueItems.length > 0 && (
                  <span className="bg-red-950/70 text-white text-[11px] font-black px-2 py-0.5 rounded-full border border-red-400/50">
                    {overdueItems.length} أجهزة متأخرة
                  </span>
                )}
                {dueSoonItems.length > 0 && (
                  <span className="bg-amber-900/60 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/40">
                    {dueSoonItems.length} مستحقة قريباً
                  </span>
                )}
              </div>
              <h3
                id="calibration-alert-title"
                className="text-lg sm:text-xl font-black text-white mt-1.5"
              >
                تنبيه استحقاق وتأخر معايرة الأجهزة الطبية
              </h3>
              <p className="text-xs sm:text-sm text-amber-100 mt-1 leading-relaxed">
                مرحباً {userName ? userName.split(" ")[0] : "بك"}، تم رصد{" "}
                {overdueItems.length > 0 && (
                  <>
                    <span className="font-black underline text-white">
                      ({overdueItems.length}) أجهزة تجاوزت تاريخ المعايرة
                    </span>
                    {dueSoonItems.length > 0 ? " و " : ""}
                  </>
                )}
                {dueSoonItems.length > 0 && (
                  <span className="font-black underline text-white">
                    ({dueSoonItems.length}) أجهزة مستحقة خلال الأيام الـ 7 القادمة
                  </span>
                )}
                ، وتتطلب فحصاً وإعادة معايرة لضمان سلامة المرضى وتفادي التوقف الإكلينيكي.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            title="إغلاق التنبيه"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Expiring & Overdue Medical Equipment */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Overdue Section */}
          {overdueItems.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-red-700 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>أجهزة متأخرة عن موعد المعايرة الإلزامي ({overdueItems.length})</span>
              </div>
              <div className="space-y-2.5">
                {overdueItems.map(({ schedule, daysRemaining }) => (
                  <div
                    key={schedule.id}
                    className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black bg-white dark:bg-[#163430] text-red-700 dark:text-red-400 px-2 py-0.5 rounded-md border border-red-200">
                          {schedule.assetId}
                        </span>
                        <h4 className="font-black text-sm text-[#193B3A] dark:text-[#EDF7F4]">
                          {schedule.assetName}
                        </h4>
                        <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                          متأخرة بـ {Math.abs(daysRemaining)} يوم
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B8581] dark:text-[#9DBBB4]">
                        <span>{schedule.department}</span>
                        <span>•</span>
                        <span className="font-mono">{schedule.model}</span>
                        <span>•</span>
                        <span>تاريخ الاستحقاق: {schedule.nextDueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Soon Section */}
          {dueSoonItems.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400">
                <Clock className="w-4 h-4" />
                <span>أجهزة تستحق المعايرة خلال نافذة 7 أيام ({dueSoonItems.length})</span>
              </div>
              <div className="space-y-2.5">
                {dueSoonItems.map(({ schedule, daysRemaining }) => (
                  <div
                    key={schedule.id}
                    className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black bg-white dark:bg-[#163430] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md border border-[#CDE5DF]">
                          {schedule.assetId}
                        </span>
                        <h4 className="font-black text-sm text-[#193B3A] dark:text-[#EDF7F4]">
                          {schedule.assetName}
                        </h4>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                          {daysRemaining === 0 ? "تنتهي اليوم!" : `متبقي ${daysRemaining} يوم`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B8581] dark:text-[#9DBBB4]">
                        <span>{schedule.department}</span>
                        <span>•</span>
                        <span className="font-mono">{schedule.model}</span>
                        <span>•</span>
                        <span>تاريخ الاستحقاق: {schedule.nextDueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-gray-50 dark:bg-[#0F201E] border-t border-gray-100 dark:border-[#1F423E] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#6B8581] dark:text-[#9DBBB4] text-center sm:text-right">
            يمكنك جدولة المهام ومباشرة الفحوصات الفنية فوراً من شاشة الصيانة الوقائية.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-[#556E69] dark:text-[#9DBBB4] hover:bg-gray-200/60 dark:hover:bg-[#1B3A35] transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={onNavigateToPpm}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#126B68] to-[#0E5250] text-white hover:brightness-110 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>الانتقال لجدول المعايرة (PPM)</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
