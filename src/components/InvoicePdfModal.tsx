import React, { useRef, useState } from "react";
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  FileCheck,
  Building2,
  ShieldCheck,
  QrCode,
  Calendar,
  DollarSign,
  PenTool,
  Sparkles,
  Layers,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { PurchaseOrder, UserProfile } from "../types";

interface InvoicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder;
  currentUser?: UserProfile;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  isOpen,
  onClose,
  order,
  currentUser,
}) => {
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  // Signature customizer
  const [signerName, setSignerName] = useState(
    currentUser ? currentUser.name : "د. عبد الرحمن الشهري"
  );
  const [signerRole, setSignerRole] = useState(
    currentUser ? currentUser.roleTitle : "مدير الإدارة المالية وسلاسل الإمداد"
  );
  const [includeVat, setIncludeVat] = useState(true);

  if (!isOpen) return null;

  // Calculation metrics
  const subtotal = order.totalAmount;
  const vatAmount = includeVat ? subtotal * 0.15 : 0;
  const grandTotal = subtotal + vatAmount;

  const invoiceNumber = `INV-${order.id.replace("PO-", "")}-2026`;
  const invoiceDate = order.orderDate || new Date().toISOString().split("T")[0];
  const signatureHash = `SHA256-${order.id}-9A8B7C-OK`;

  // PDF Generation using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsGenerating(true);
      setDownloadSuccess(false);

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // High resolution for sharp text and signatures
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(`فاتورة-أمر-شراء-${order.id}.pdf`);

      setIsGenerating(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E1EBE8] my-4 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDF4F2] bg-[#193B3A] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#126B68] flex items-center justify-center text-white">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  معاينة وتوليد الفاتورة الإلكترونية المعتمدة
                </h3>
                <span className="bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#10B981]/30">
                  ZATCA Standard
                </span>
              </div>
              <p className="text-[11px] text-[#A7C2BD]">
                أمر الشراء رقم {order.id} • {order.supplierName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Print Button */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs font-bold"
              title="طباعة مباشرة"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>

            {/* Instant PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-black flex items-center gap-2 shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري تحضير PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>تم التحميل بنجاح!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تحميل PDF فوري</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customization bar */}
        <div className="bg-[#F6FAF8] border-b border-[#EDF4F2] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#193B3A] flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-[#126B68]" />
              <span>بيانات التوقيع الإلكتروني:</span>
            </span>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="bg-white border border-[#DCE8E5] rounded-lg px-2.5 py-1 text-xs font-bold text-[#193B3A] focus:outline-none focus:border-[#126B68]"
              placeholder="اسم الموقع المعتمد"
            />
            <input
              type="text"
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              className="bg-white border border-[#DCE8E5] rounded-lg px-2.5 py-1 text-xs text-[#526B66] focus:outline-none focus:border-[#126B68] hidden md:block"
              placeholder="المسمى الوظيفي"
            />
          </div>

          <label className="flex items-center gap-1.5 font-bold text-[#193B3A] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeVat}
              onChange={(e) => setIncludeVat(e.target.checked)}
              className="rounded accent-[#126B68]"
            />
            <span>تضمين ضريبة القيمة المضافة (15% VAT)</span>
          </label>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#E9EFEB] flex justify-center">
          {/* Printable Invoice Page (Styled like authentic A4 e-Invoice) */}
          <div
            ref={invoiceRef}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 sm:p-10 border border-[#D5E2DE] text-[#193B3A] space-y-6 select-text"
            style={{ minHeight: "840px" }}
          >
            {/* Header: Organization Identity & Tax Details */}
            <div className="flex justify-between items-start pb-6 border-b-2 border-[#126B68]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#126B68] flex items-center justify-center text-white p-2">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#193B3A] tracking-tight">
                      منظومة عين المستشفى الطبية
                    </h2>
                    <p className="text-xs font-bold text-[#126B68]">
                      إدارة التموين الطبي والمشتريات التشغيلية
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-[#6B8581] leading-relaxed pt-1">
                  <div>مستشفى الملك فهد التخصصي — المجمع الطبي المركزي</div>
                  <div>الرقم الضريبي للمنشأة: <span className="font-mono font-bold text-[#193B3A]">300192837400003</span></div>
                  <div>السجل التجاري: <span className="font-mono font-bold text-[#193B3A]">1010884920</span></div>
                </div>
              </div>

              {/* Invoice Meta Box */}
              <div className="text-left space-y-1">
                <div className="inline-block bg-[#193B3A] text-white px-3 py-1 rounded-xl text-xs font-black">
                  فاتورة ضريبية رسمية
                </div>
                <div className="text-[11px] text-[#6B8581] pt-1">
                  <div>رقم الفاتورة: <span className="font-mono font-black text-[#126B68]">{invoiceNumber}</span></div>
                  <div>رقم أمر الشراء: <span className="font-mono font-bold text-[#193B3A]">{order.id}</span></div>
                  <div>تاريخ الإصدار: <span className="font-mono text-[#193B3A]">{invoiceDate}</span></div>
                  <div>حالة الاعتماد: <span className="font-bold text-[#10B981]">معتمد ومطابق</span></div>
                </div>
              </div>
            </div>

            {/* Bill To & Supplier Information */}
            <div className="grid grid-cols-2 gap-4 bg-[#F8FBFA] p-4 rounded-2xl border border-[#E1EBE8] text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#738884] block">المورد المعتمد (البائع):</span>
                <p className="font-black text-sm text-[#193B3A]">{order.supplierName}</p>
                <p className="text-[11px] text-[#6B8581]">شريك سلاسل الإمداد المعتمد لمنظومة عين</p>
                <p className="text-[10px] text-[#8B9A97]">طريقة الدفع: تحويل بنكي معتمد (آجل 30 يوماً)</p>
              </div>

              <div className="space-y-1 border-r border-[#DCE8E5] pr-4">
                <span className="text-[10px] font-black text-[#738884] block">الجهة المستفيدة (المشتري):</span>
                <p className="font-black text-sm text-[#193B3A]">{order.hospitalName}</p>
                <p className="text-[11px] text-[#6B8581]">قسم الصيدلية والمستودعات الطبية المركزية</p>
                <p className="text-[10px] text-[#8B9A97]">موقع التسليم: رصيف الاستلام والتفتيش الفني</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-[#193B3A] text-white">
                    <th className="p-2.5 rounded-tr-xl font-bold">#</th>
                    <th className="p-2.5 font-bold">الصنف / قطع الغيار / المستلزم الطبي</th>
                    <th className="p-2.5 font-bold text-center">الوحدة</th>
                    <th className="p-2.5 font-bold text-center">الكمية</th>
                    <th className="p-2.5 font-bold text-left">سعر الوحدة</th>
                    <th className="p-2.5 rounded-tl-xl font-bold text-left">الإجمالي (ريال)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF4F2] border-b border-[#DCE8E5]">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-[#F9FCFB]">
                        <td className="p-2.5 text-[#738884] font-bold">{index + 1}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-[#193B3A] block">{item.productName}</span>
                          <span className="text-[10px] text-[#8C9E9A] font-mono">كود الصنف: PRD-{item.productId}</span>
                        </td>
                        <td className="p-2.5 text-center text-[#556966]">{item.unit}</td>
                        <td className="p-2.5 text-center font-bold font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-left font-mono">{item.price.toLocaleString()}</td>
                        <td className="p-2.5 text-left font-bold font-mono text-[#193B3A]">
                          {(item.price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-[#8C9E9A]">
                        لا توجد بنود مدخلة في أمر الشراء
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals and Calculation Box */}
            <div className="flex justify-end pt-2">
              <div className="w-72 bg-[#F8FBFA] p-4 rounded-2xl border border-[#DCE8E5] space-y-2 text-xs">
                <div className="flex justify-between text-[#6B8581] font-bold">
                  <span>المجموع الفرعي الخاضع للضريبة:</span>
                  <span className="font-mono text-[#193B3A]">{subtotal.toLocaleString()} ر.س</span>
                </div>

                {includeVat && (
                  <div className="flex justify-between text-[#6B8581] font-bold">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono text-[#193B3A]">{vatAmount.toLocaleString()} ر.س</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black text-[#126B68] pt-2 border-t border-[#DCE8E5]">
                  <span>الإجمالي الكلي المستحق:</span>
                  <span className="font-mono text-base font-black">{grandTotal.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>

            {/* Default Cryptographic Electronic Signature & Stamp Section */}
            <div className="pt-6 border-t border-[#DCE8E5] grid grid-cols-2 gap-4 items-end">
              {/* ZATCA QR Code Simulation */}
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 bg-[#F6FAF8] border border-[#CDE5DF] rounded-xl p-1.5 flex flex-col items-center justify-center shrink-0">
                  <QrCode className="w-14 h-14 text-[#193B3A]" />
                  <span className="text-[7px] text-[#738884] font-bold font-mono">ZATCA e-Invoice</span>
                </div>
                <div className="text-[10px] text-[#738884] space-y-0.5">
                  <p className="font-bold text-[#193B3A] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                    <span>توقيع إلكتروني مشفر معتمد</span>
                  </p>
                  <p className="font-mono text-[9px] text-[#8C9E9A] truncate max-w-[180px]">
                    {signatureHash}
                  </p>
                  <p>تم التوليد آلياً عبر نظام إدارة المستشفيات عين</p>
                </div>
              </div>

              {/* Official Electronic Signature & Verification Stamp */}
              <div className="border border-[#CDE5DF] bg-[#F8FBFA] p-3.5 rounded-2xl relative overflow-hidden">
                {/* Visual Official Hospital Stamp Watermark */}
                <div className="absolute left-2 top-2 w-20 h-20 rounded-full border-2 border-dashed border-[#126B68]/30 flex items-center justify-center rotate-12 pointer-events-none">
                  <span className="text-[8px] font-black text-[#126B68]/50 text-center leading-tight">
                    معتمد رسمياً<br />عين المستشفى<br />APPROVED
                  </span>
                </div>

                <div className="relative z-10 space-y-1 text-xs">
                  <span className="text-[10px] text-[#738884] font-bold block">التوقيع والاعتماد الإلكتروني:</span>
                  
                  {/* Stylized Digital Signature Simulation */}
                  <div className="py-1">
                    <span className="font-serif italic font-black text-base text-[#126B68] tracking-wider block">
                      {signerName}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-[#193B3A]">{signerName}</p>
                  <p className="text-[10px] text-[#6B8581]">{signerRole}</p>
                  <div className="flex items-center gap-1 text-[9px] text-[#10B981] font-bold pt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>تم التحقق من الصلاحية والتوقيع المشفر</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[9px] text-[#9CA3AF] pt-4 border-t border-[#EEF3F1]">
              هذه الفاتورة الإلكترونية صادرة آلياً من منظومة «عين المستشفى» وتعتبر وثيقة مالية رسمية نافذة بموجب الأنظمة واللوائح المعتمدة.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
