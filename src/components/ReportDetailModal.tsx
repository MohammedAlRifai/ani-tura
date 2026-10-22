import React from "react";
import { X, ExternalLink } from "lucide-react";
import { Report, ReportStatus, Asset, InventoryItem, UsedPartItem, UserProfile } from "../types";
import { ReportDetailContent } from "./ReportDetailContent";

interface ReportDetailModalProps {
  report: Report | null;
  currentUser?: UserProfile;
  assets: Asset[];
  inventory?: InventoryItem[];
  onClose: () => void;
  onUpdateStatus: (
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
  onOpenAsset: (asset: Asset) => void;
  onOpenInTab?: (report: Report) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  currentUser,
  assets,
  inventory = [],
  onClose,
  onUpdateStatus,
  onOpenAsset,
  onOpenInTab,
}) => {
  if (!report) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="تفاصيل أمر العمل" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#122624] rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EDF4F2] dark:border-[#1E3F3B] sticky top-0 bg-white/95 dark:bg-[#122624]/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-[#E9F5F2] dark:bg-[#1D3C38] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md">
              {report.id}
            </span>
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">{report.category}</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInTab && (
              <button
                type="button"
                onClick={() => {
                  onOpenInTab(report);
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#126B68] dark:text-[#4ECDC4] bg-[#E9F5F2] dark:bg-[#1D3C38] hover:bg-[#d5ede7] rounded-xl transition-colors cursor-pointer"
                title="فتح في تبويب مدمج دون إغلاق الواجهة الحالية"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح في تبويب</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#183633] hover:bg-[#E3EDE9] flex items-center justify-center text-[#5A736F] dark:text-[#9DBBB4] cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5">
          <ReportDetailContent key={report.id+":"+(report.version||1)}
            report={report}
            currentUser={currentUser}
            assets={assets}
            inventory={inventory}
            onClose={onClose}
            onUpdateStatus={onUpdateStatus}
            onOpenAsset={onOpenAsset}
          />
        </div>
      </div>
    </div>
  );
};
