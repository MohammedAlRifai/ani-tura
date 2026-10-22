import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  DollarSign,
  Building,
  Bell,
  CheckCircle2,
  X,
  ShieldCheck,
  User,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import {
  SupplierContract,
  ContractCategory,
  ContractStatus,
  Supplier,
} from "../types";

interface NewContractModalProps {
  isOpen: boolean;
  onClose: () => Promise<boolean | void> | void;
  onSave: (contract: Omit<SupplierContract, "id" | "createdAt"> & { id?: string }) => Promise<boolean | void> | void;
  contractToEdit?: SupplierContract | null;
  suppliers?: Supplier[];
}

const CATEGORIES: ContractCategory[] = [
  "أجهزة طبية وصيانة",
  "أدوية ومحاليل",
  "مستلزمات جراحية",
  "نظافة وتعقيم",
  "غازات طبية وشبكات",
  "تقنية ومعلومات (IT)",
  "صيانة مرافق وبنية تحتية",
  "أخرى",
];

export const NewContractModal: React.FC<NewContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contractToEdit,
  suppliers = [],
}) => {
  const [title, setTitle] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [category, setCategory] = useState<ContractCategory>("أجهزة طبية وصيانة");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Default end date is 1 year from today
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
  const [endDate, setEndDate] = useState(defaultEndDate.toISOString().split("T")[0]);

  const [totalValue, setTotalValue] = useState<number>(150000);
  const [paymentTerms, setPaymentTerms] = useState<
    "شهري" | "ربع سنوي" | "نصف سنوي" | "سنوي" | "دفعة واحدة" | "عند الإنجاز"
  >("ربع سنوي");
  const [autoRenew, setAutoRenew] = useState(true);
  const [renewalAlertDays, setRenewalAlertDays] = useState<number>(30);
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [slaTerms, setSlaTerms] = useState("استجابة طارئة خلال ساعتين وتوفير قطع الغيار بنسبة جاهزية 98%");
  const [penaltyTerms, setPenaltyTerms] = useState("خصم 2% عن كل يوم تأخير في الصيانة أو توريد المستلزمات");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [signedByHospital, setSignedByHospital] = useState("د. سارة المنصور — المدير الطبي");
  const [signedBySupplier, setSignedBySupplier] = useState("");

  useEffect(() => {
    if (contractToEdit) {
      setTitle(contractToEdit.title);
      setContractNumber(contractToEdit.contractNumber);
      setSupplierName(contractToEdit.supplierName);
      setCategory(contractToEdit.category);
      setStartDate(contractToEdit.startDate);
      setEndDate(contractToEdit.endDate);
      setTotalValue(contractToEdit.totalValue);
      setPaymentTerms(contractToEdit.paymentTerms);
      setAutoRenew(contractToEdit.autoRenew);
      setRenewalAlertDays(contractToEdit.renewalAlertDays || 30);
      setScopeOfWork(contractToEdit.scopeOfWork || "");
      setSlaTerms(contractToEdit.slaTerms || "");
      setPenaltyTerms(contractToEdit.penaltyTerms || "");
      setContactPerson(contractToEdit.contactPerson || "");
      setContactPhone(contractToEdit.contactPhone || "");
      setContactEmail(contractToEdit.contactEmail || "");
      setSignedByHospital(contractToEdit.signedByHospital || "");
      setSignedBySupplier(contractToEdit.signedBySupplier || "");
    } else {
      // Reset form
      const genNum = `CNT-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
      setContractNumber(genNum);
      setTitle("");
      setSupplierName(suppliers[0]?.name || "الشركة الوطنية للحلول والتجهيزات الطبية");
      setCategory("أجهزة طبية وصيانة");
      setStartDate(new Date().toISOString().split("T")[0]);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setEndDate(nextYear.toISOString().split("T")[0]);
      setTotalValue(0);
      setPaymentTerms("ربع سنوي");
      setAutoRenew(false);
      setRenewalAlertDays(30);
      setScopeOfWork("صيانة دورية وقائية ومعايرة معتمدة وتوفير المستلزمات الأصلية");
      setSlaTerms("");
      setPenaltyTerms("");
      setContactPerson("");
      setContactPhone("");
      setContactEmail("");
      setSignedByHospital("");
      setSignedBySupplier("");
    }
  }, [contractToEdit, isOpen, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !supplierName.trim() || totalValue <= 0) return;

    // Calculate initial status based on end date
    const today = new Date();
    const end = new Date(endDate);
    const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let initialStatus: ContractStatus = "ساري";
    if (daysRemaining <= 0) {
      initialStatus = "منتهي";
    } else if (daysRemaining <= renewalAlertDays) {
      initialStatus = "قريب الانتهاء";
    }

    const saved=await onSave({
      ...(contractToEdit ? { id: contractToEdit.id } : {}),
      title: title.trim(),
      contractNumber: contractNumber.trim() || `CNT-${Date.now()}`,
      supplierName: supplierName.trim(),
      category,
      startDate,
      endDate,
      totalValue,
      paymentTerms,
      status: initialStatus,
      autoRenew,
      renewalAlertDays,
      scopeOfWork: scopeOfWork.trim(),
      slaTerms: slaTerms.trim(),
      penaltyTerms: penaltyTerms.trim(),
      contactPerson: contactPerson.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      signedByHospital: signedByHospital.trim() || undefined,
      signedBySupplier: signedBySupplier.trim() || undefined,
    });

    if(saved!==false)onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#122624] rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-[#E1EBE8] dark:border-[#1F423E] space-y-4 text-xs my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2] dark:border-[#1A3834]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#126B68]/15 dark:bg-[#126B68]/30 text-[#126B68] dark:text-[#4ECDC4] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#193B3A] dark:text-[#E3F2EE]">
                {contractToEdit ? "تحديث عقد مورد" : "إنشاء عقد مورد رقمي جديد"}
              </h3>
              <p className="text-[11px] text-[#788C88] dark:text-[#9DBBB4]">
                اتفاقيات التوريد والصيانة المعتمدة مع جدولة تنبيهات التجديد الآلية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#193B3A] hover:bg-[#E2EDE9] flex items-center justify-center text-[#5A736F] dark:text-[#9DBBB4] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Title & Ref */}
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block">
              عنوان العقد وموضوعه *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: عقد صيانة أجهزة المختبر المركزي ومطياف الكتلة..."
              className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#E3F2EE] focus:outline-none focus:border-[#126B68]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block">
                رقم المناقصة / المرجع الرسمي
              </label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="MOH-MED-2026-..."
                className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#E3F2EE] font-mono focus:outline-none focus:border-[#126B68]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block">
                تصنيف العقد *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ContractCategory)}
                className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#E3F2EE] focus:outline-none focus:border-[#126B68]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Supplier Name */}
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block">
              المورد أو الشركة المتعاقد معها *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="اسم المورد أو الوكيل الطبي..."
                className="flex-1 bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#E3F2EE] focus:outline-none focus:border-[#126B68]"
                required
              />
              {suppliers.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) setSupplierName(e.target.value);
                  }}
                  className="bg-[#F0F5F3] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl px-2 text-[11px] text-[#126B68] dark:text-[#4ECDC4] font-bold cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>اختر من المسجلين</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Dates & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F8FBFA] dark:bg-[#16302C] rounded-2xl border border-[#E1EBE8] dark:border-[#1F423E]">
            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
                <span>تاريخ بداية سريان العقد *</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white dark:bg-[#122624] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#E3F2EE] font-mono focus:outline-none focus:border-[#126B68]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C9684D]" />
                <span>تاريخ انتهاء العقد *</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white dark:bg-[#122624] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#E3F2EE] font-mono focus:outline-none focus:border-[#126B68]"
                required
              />
            </div>
          </div>

          {/* Financials & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#2B7A3D]" />
                <span>القيمة الإجمالية للعقد (ريال) *</span>
              </label>
              <input
                type="number"
                min="1"
                value={totalValue}
                onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#E3F2EE] font-bold focus:outline-none focus:border-[#126B68]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block">
                دورة وجدول الدفعات
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value as any)}
                className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#E3F2EE] focus:outline-none focus:border-[#126B68]"
              >
                <option value="شهري">شهري (12 دفعة متساوية)</option>
                <option value="ربع سنوي">ربع سنوي (4 دفعات)</option>
                <option value="نصف سنوي">نصف سنوي (دفعتان)</option>
                <option value="سنوي">سنوي (مقدم)</option>
                <option value="دفعة واحدة">دفعة واحدة نهائية</option>
                <option value="عند الإنجاز">عند إتمام الإنجاز واعتماد الفحص</option>
              </select>
            </div>
          </div>

          {/* Automatic Renewal & Alerts Settings */}
          <div className="p-3.5 bg-[#F0F8F6] dark:bg-[#1B3A36] border border-[#CDE5DF] dark:border-[#23504A] rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#126B68] dark:text-[#4ECDC4]" />
                <span className="font-black text-xs text-[#193B3A] dark:text-[#E3F2EE]">
                  تنبيهات التجديد التلقائي (Automatic Renewal Alerts)
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#126B68]"></div>
                <span className="ms-2 text-[11px] font-bold text-[#193B3A] dark:text-[#E3F2EE]">
                  {autoRenew ? "مفعل" : "معطل"}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3 text-[11px] pt-2 border-t border-[#DDECE8] dark:border-[#224A45]">
              <span className="text-[#526B66] dark:text-[#9DBBB4]">
                مهلة إطلاق تنبيه التجديد قبل انتهاء العقد:
              </span>
              <div className="flex items-center gap-1.5">
                {[15, 30, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setRenewalAlertDays(days)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      renewalAlertDays === days
                        ? "bg-[#126B68] text-white"
                        : "bg-white dark:bg-[#16302C] text-[#526B66] dark:text-[#B6D1CB] border border-[#DCE8E5] dark:border-[#224A45]"
                    }`}
                  >
                    {days} يوم
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scope of Work & SLA */}
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] block">
              نطاق العمل والتوريدات المشمولة
            </label>
            <textarea
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              rows={2}
              placeholder="وصف تفصيلي للالتزامات، الصيانة الوقائية، وتوفير قطع الغيار..."
              className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#E3F2EE] focus:outline-none focus:border-[#126B68]"
            />
          </div>

          {/* SLA Terms */}
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] dark:text-[#E3F2EE] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
              <span>شروط مستوى الخدمة وضمان الاستجابة (SLA)</span>
            </label>
            <input
              type="text"
              value={slaTerms}
              onChange={(e) => setSlaTerms(e.target.value)}
              placeholder="زمن الاستجابة للأعطال ونسبة توفر الخدمة..."
              className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#E3F2EE] focus:outline-none focus:border-[#126B68]"
            />
          </div>

          {/* Contact Person Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#788C88] dark:text-[#9DBBB4] block">
                مسؤول اتصال المورد
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="الاسم..."
                className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#E3F2EE] focus:outline-none focus:border-[#126B68]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#788C88] dark:text-[#9DBBB4] block">
                رقم الهاتف / الجوال
              </label>
              <input
                type="text"
                dir="ltr"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="050xxxxxxx"
                className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#E3F2EE] font-mono focus:outline-none focus:border-[#126B68]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#788C88] dark:text-[#9DBBB4] block">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                dir="ltr"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="info@supplier.sa"
                className="w-full bg-[#F6FAF8] dark:bg-[#16302C] border border-[#DCE8E5] dark:border-[#224A45] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#E3F2EE] font-mono focus:outline-none focus:border-[#126B68]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#EDF4F2] dark:border-[#1A3834] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DCE8E5] dark:border-[#224A45] text-[#526B66] dark:text-[#B6D1CB] font-bold cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{contractToEdit ? "حفظ التعديلات" : "اعتماد وتسجيل العقد"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

