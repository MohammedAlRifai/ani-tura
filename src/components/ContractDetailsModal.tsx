import React from "react";
import { X, ExternalLink } from "lucide-react";
import { SupplierContract } from "../types";
import { ContractDetailsContent } from "./ContractDetailsContent";

interface ContractDetailsModalProps {
  contract: SupplierContract | null;
  isOpen: boolean;
  onClose: () => Promise<boolean | void> | void;
  onRenew: (contractId: string) => Promise<boolean | void> | void;
  onEdit?: (contract: SupplierContract) => Promise<boolean | void> | void;
  onToggleStatus?: (contractId: string, newStatus: "ساري" | "معلق" | "منتهي") => Promise<boolean | void> | void;
  onOpenInTab?: (contract: SupplierContract) => Promise<boolean | void> | void;
}

export const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({
  contract,
  isOpen,
  onClose,
  onRenew,
  onEdit,
  onToggleStatus,
  onOpenInTab,
}) => {
  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#122624] rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-4 text-xs my-6">
        {/* Modal Actions Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2] dark:border-[#1A3834]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black bg-[#E9F5F2] dark:bg-[#1B3F3A] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md">
              {contract.id}
            </span>
            <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">
              {contract.supplierName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInTab && (
              <button
                type="button"
                onClick={() => {
                  onOpenInTab(contract);
                  onClose();
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#126B68] dark:text-[#4ECDC4] bg-[#E9F5F2] dark:bg-[#1B3F3A] hover:bg-[#d5ede7] rounded-xl transition-colors cursor-pointer"
                title="فتح العقد في تبويب مدمج دون مغادرة الواجهة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح في تبويب</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#193B3A] hover:bg-[#E2EDE9] flex items-center justify-center text-[#5A736F] dark:text-[#9DBBB4] transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contract Content */}
        <ContractDetailsContent
          contract={contract}
          onRenew={onRenew}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </div>
  );
};
