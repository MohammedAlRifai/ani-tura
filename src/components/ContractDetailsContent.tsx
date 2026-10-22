import React from "react";
import {
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  DollarSign,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Printer,
  RefreshCw,
  Edit3,
  Ban,
} from "lucide-react";
import { SupplierContract } from "../types";

export interface ContractDetailsContentProps {
  contract: SupplierContract;
  onRenew: (contractId: string) => Promise<boolean | void> | void;
  onEdit?: (contract: SupplierContract) => Promise<boolean | void> | void;
  onToggleStatus?: (contractId: string, newStatus: "ساري" | "معلق" | "منتهي") => Promise<boolean | void> | void;
  isTabMode?: boolean;
}

export const ContractDetailsContent: React.FC<ContractDetailsContentProps> = ({
  contract,
  onRenew,
  onEdit,
  onToggleStatus,
  isTabMode = false,
}) => {
  const today = new Date();
  const endDate = new Date(contract.endDate);
  const startDate = new Date(contract.startDate);

  // Time calculations
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const percentElapsed = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));

  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = !isExpired && daysRemaining <= contract.renewalAlertDays;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Banner with Title and Contract ID */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F6FAF8] dark:bg-[#152E2B] border border-[#E1EBE8] dark:border-[#1F423E]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#126B68]/10 dark:bg-[#126B68]/30 text-[#126B68] dark:text-[#4ECDC4] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold bg-[#E9F5F2] dark:bg-[#1B3F3A] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md">
                {contract.id}
              </span>
              <span className="font-mono text-[10px] text-[#738884] dark:text-[#9DBBB4]">
                مرجع المناقصة: {contract.contractNumber}
              </span>
              <span className="text-[10px] bg-[#E9F5F2] dark:bg-[#1B3F3A] text-[#126B68] dark:text-[#4ECDC4] font-bold px-2 py-0.5 rounded-full">
                {contract.category}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#193B3A] dark:text-[#E3F2EE] mt-1">
              {contract.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white dark:bg-[#1B3B37] border border-[#DCE8E5] dark:border-[#224A45] text-[#126B68] dark:text-[#4ECDC4] rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-gray-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(contract)}
              className="px-3 py-1.5 bg-white dark:bg-[#1B3B37] border border-[#DCE8E5] dark:border-[#224A45] text-[#193B3A] dark:text-[#E3F2EE] rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-gray-50"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>
          )}
        </div>
      </div>

      {/* Expiration Alert Banner */}
      {isExpired ? (
        <div className="p-3.5 bg-[#FFF2F0] dark:bg-[#3D1E1B] border border-[#FADCD9] dark:border-[#5A2D28] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#B83828] dark:text-[#F8A499]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-xs">تنبيه حرج: انتهت صلاحية هذا العقد!</p>
              <p className="text-[11px] opacity-90">
                انتهى العقد منذ {Math.abs(daysRemaining)} يوماً ({contract.endDate}). يلزم التجديد لضمان استمرار الدعم السريري.
              </p>
            </div>
          </div>
          <button
            onClick={() => onRenew(contract.id)}
            className="px-3.5 py-1.5 bg-[#B83828] hover:bg-[#9E2F22] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer self-end sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تجديد العقد فوراً</span>
          </button>
        </div>
      ) : isExpiringSoon ? (
        <div className="p-3.5 bg-[#FFF9E6] dark:bg-[#3B3219] border border-[#FDE8B3] dark:border-[#574B26] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#9A6200] dark:text-[#F8D278]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-xs">تنبيه التجديد التلقائي: شارف العقد على الانتهاء</p>
              <p className="text-[11px] opacity-90">
                متبقي {daysRemaining} يوماً فقط حتى تاريخ الانتهاء ({contract.endDate}).
                {contract.autoRenew ? " (مفعل التجديد التلقائي)" : " (يتطلب اعتماد يدوي)"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onRenew(contract.id)}
            className="px-3.5 py-1.5 bg-[#9A6200] hover:bg-[#805200] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer self-end sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تجديد لمدة سنة</span>
          </button>
        </div>
      ) : null}

      {/* Key Contract Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#F8FBFA] dark:bg-[#16302C] p-3 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E]">
          <span className="text-[10px] text-[#788C88] dark:text-[#9DBBB4] font-bold block">القيمة الإجمالية</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base font-black text-[#193B3A] dark:text-[#E3F2EE]">
              {contract.totalValue.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#788C88]">ريال</span>
          </div>
          <span className="text-[10px] text-[#126B68] dark:text-[#4ECDC4] font-semibold block mt-0.5">
            دفع {contract.paymentTerms}
          </span>
        </div>

        <div className="bg-[#F8FBFA] dark:bg-[#16302C] p-3 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E]">
          <span className="text-[10px] text-[#788C88] dark:text-[#9DBBB4] font-bold block">المورد المعتمد</span>
          <div className="mt-1">
            <span className="text-xs font-black text-[#193B3A] dark:text-[#E3F2EE] block truncate">
              {contract.supplierName}
            </span>
            <span className="text-[10px] text-[#788C88] dark:text-[#9DBBB4] block">
              جهة التعاقد الرئيسية
            </span>
          </div>
        </div>

        <div className="bg-[#F8FBFA] dark:bg-[#16302C] p-3 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E]">
          <span className="text-[10px] text-[#788C88] dark:text-[#9DBBB4] font-bold block">الحالة التشغيلية</span>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                contract.status === "ساري"
                  ? "bg-[#E5F5E8] text-[#2B7A3D] dark:bg-[#1E432A] dark:text-[#76D28C]"
                  : contract.status === "معلق"
                  ? "bg-[#FFF2D6] text-[#B86B00] dark:bg-[#473617] dark:text-[#F3C769]"
                  : "bg-[#FDE8E8] text-[#C94D4D] dark:bg-[#4A1E1E] dark:text-[#F08C8C]"
              }`}
            >
              {contract.status}
            </span>
          </div>
          <span className="text-[10px] text-[#788C88] dark:text-[#9DBBB4] block mt-0.5">
            تنتهي: {contract.endDate}
          </span>
        </div>

        <div className="bg-[#F8FBFA] dark:bg-[#16302C] p-3 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E]">
          <span className="text-[10px] text-[#788C88] dark:text-[#9DBBB4] font-bold block">نوع التجديد</span>
          <span className="text-xs font-black text-[#193B3A] dark:text-[#E3F2EE] block mt-1">
            {contract.autoRenew ? "تجديد سنوي تلقائي" : "تجديد سنوي بموافقة"}
          </span>
          <span className="text-[10px] text-[#788C88] dark:text-[#9DBBB4] block mt-0.5">
            {contract.autoRenew ? "🔄 تجديد مبرمج" : "يدوي"}
          </span>
        </div>
      </div>

      {/* Contract Duration Progress Bar */}
      <div className="bg-[#F8FBFA] dark:bg-[#16302C] p-3.5 rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-[#193B3A] dark:text-[#E3F2EE]">
            المسار الزمني للعقد ({percentElapsed}% منقضي)
          </span>
          <span className="text-[#788C88] dark:text-[#9DBBB4] font-mono">
            {contract.startDate} ← {contract.endDate}
          </span>
        </div>
        <div className="w-full bg-[#E1EBE8] dark:bg-[#203D39] h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isExpired
                ? "bg-[#C94D4D]"
                : isExpiringSoon
                ? "bg-[#B86B00]"
                : "bg-[#126B68] dark:bg-[#4ECDC4]"
            }`}
            style={{ width: `${percentElapsed}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#788C88] dark:text-[#9DBBB4]">
          <span>البداية: {contract.startDate}</span>
          <span>
            {isExpired ? "انتهى العقد" : `متبقي ${daysRemaining} يوم`} (مهلة التنبيه: {contract.renewalAlertDays} يوم)
          </span>
          <span>الانتهاء: {contract.endDate}</span>
        </div>
      </div>

      {/* Scope of Work & SLA Clauses */}
      <div className="space-y-3">
        {contract.scopeOfWork && (
          <div className="bg-white dark:bg-[#122624] p-3 rounded-xl border border-[#E1EBE8] dark:border-[#1F423E]">
            <span className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block mb-1">
              نطاق العمل والتوريدات المشمولة:
            </span>
            <p className="text-[11px] text-[#526B66] dark:text-[#B6D1CB] leading-relaxed">
              {contract.scopeOfWork}
            </p>
          </div>
        )}

        {contract.slaTerms && (
          <div className="bg-white dark:bg-[#122624] p-3 rounded-xl border border-[#E1EBE8] dark:border-[#1F423E]">
            <span className="font-bold text-[#193B3A] dark:text-[#E3F2EE] flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
              <span>شروط مستوى الخدمة وضمان الاستجابة (SLA):</span>
            </span>
            <p className="text-[11px] text-[#526B66] dark:text-[#B6D1CB] leading-relaxed">
              {contract.slaTerms}
            </p>
          </div>
        )}

        {contract.penaltyTerms && (
          <div className="bg-white dark:bg-[#122624] p-3 rounded-xl border border-[#E1EBE8] dark:border-[#1F423E]">
            <span className="font-bold text-[#C9684D] dark:text-[#F39A82] block mb-1">
              الشروط الجزائية وغرامات التأخير:
            </span>
            <p className="text-[11px] text-[#526B66] dark:text-[#B6D1CB] leading-relaxed">
              {contract.penaltyTerms}
            </p>
          </div>
        )}
      </div>

      {/* Contact & Official Signatures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-[#F8FBFA] dark:bg-[#16302C] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-1.5">
          <span className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block">مسؤول الاتصال الفني للمورد:</span>
          <div className="space-y-1 text-[11px] text-[#526B66] dark:text-[#B6D1CB]">
            <p className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
              <span>{contract.contactPerson}</span>
            </p>
            <p className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
              <span dir="ltr">{contract.contactPhone}</span>
            </p>
            <p className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
              <span>{contract.contactEmail}</span>
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#F8FBFA] dark:bg-[#16302C] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-1.5">
          <span className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block">التوقيعات والاعتماد الرسمي:</span>
          <div className="space-y-1 text-[11px] text-[#526B66] dark:text-[#B6D1CB]">
            <p className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2B7A3D]" />
              <span>المستشفى: {contract.signedByHospital || "مدير المستشفى / المدير الطبي"}</span>
            </p>
            <p className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2B7A3D]" />
              <span>المورد: {contract.signedBySupplier || "الممثل القانوني للشركة"}</span>
            </p>
            {contract.lastRenewedDate && (
              <p className="text-[10px] text-[#126B68] font-semibold mt-1">
                آخر تجديد معتمد: {contract.lastRenewedDate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="pt-3 border-t border-[#EDF4F2] dark:border-[#1A3834] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onToggleStatus && (
            <button
              type="button"
              onClick={() =>
                onToggleStatus(
                  contract.id,
                  contract.status === "معلق" ? "ساري" : "معلق"
                )
              }
              className="px-3 py-2 bg-[#F0F5F3] dark:bg-[#193B3A] hover:bg-[#E2EDE9] text-[#526B66] dark:text-[#B6D1CB] font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{contract.status === "معلق" ? "إلغاء التعليق" : "تعليق مؤقت"}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRenew(contract.id)}
          className="px-4 py-2 bg-[#126B68] hover:bg-[#0d5553] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تجديد العقد لسنة إضافية</span>
        </button>
      </div>
    </div>
  );
};
