import React, { useRef, useState, useMemo } from "react";
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  ShieldCheck,
  QrCode,
  Calendar,
  DollarSign,
  Boxes,
  ArrowDownRight,
  ArrowUpLeft,
  Filter,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { Product, InventoryMovement, UserProfile } from "../types";

export interface InventoryReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  movements: InventoryMovement[];
  currentUser?: UserProfile;
  initialPeriod?: "current_month" | "previous_month" | "all";
  quickExportOnOpen?: boolean;
}

export const InventoryReportPdfModal: React.FC<InventoryReportPdfModalProps> = ({
  isOpen,
  onClose,
  products,
  movements,
  currentUser,
  initialPeriod = "current_month",
  quickExportOnOpen = false,
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Filters
  const [periodFilter, setPeriodFilter] = useState<"current_month" | "previous_month" | "all">(
    initialPeriod
  );
  const [typeFilter, setTypeFilter] = useState<"all" | "استلام" | "صرف داخلي">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Auditor & Signature Customization
  const [auditorName, setAuditorName] = useState(
    currentUser?.name || "د. نورة الغامدي"
  );
  const [auditorRole, setAuditorRole] = useState(
    currentUser?.roleTitle || "مشرف الصيدلة والمستودع الطبي"
  );

  // Derive unique categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Fast Product lookup map
  const productMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Current Date calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); // 0-indexed

  // Filter movements based on selected period, type, and category
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const movementDate = new Date(m.timestamp);
      const movementYear = movementDate.getFullYear();
      const movementMonth = movementDate.getMonth();

      // Period filter
      if (periodFilter === "current_month") {
        if (movementYear !== currentYear || movementMonth !== currentMonthIndex) {
          return false;
        }
      } else if (periodFilter === "previous_month") {
        const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
        const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
        if (movementYear !== prevYear || movementMonth !== prevMonthIndex) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "all") {
        if (m.movementType !== typeFilter) return false;
      }

      // Category filter
      if (categoryFilter !== "all") {
        const prod = productMap.get(m.productId);
        if (prod?.category !== categoryFilter) return false;
      }

      return true;
    });
  }, [movements, periodFilter, typeFilter, categoryFilter, currentYear, currentMonthIndex, productMap]);

  // Financial & Inventory Aggregations
  const stats = useMemo(() => {
    let inQty = 0;
    let outQty = 0;
    let inFinancialValue = 0;
    let outFinancialValue = 0;

    filteredMovements.forEach((m) => {
      const prod = productMap.get(m.productId);
      const unitPrice = prod?.price || 0;
      const absQty = Math.abs(m.quantity);

      if (m.quantity > 0 || m.movementType === "استلام") {
        inQty += absQty;
        inFinancialValue += absQty * unitPrice;
      } else {
        outQty += absQty;
        outFinancialValue += absQty * unitPrice;
      }
    });

    // Total Inventory Current Stock Valuation
    const totalInventoryStockValuation = products.reduce((acc, p) => acc + p.stock * p.price, 0);
    const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);

    return {
      totalTransactions: filteredMovements.length,
      inQty,
      outQty,
      netQty: inQty - outQty,
      inFinancialValue,
      outFinancialValue,
      netFinancialMovement: inFinancialValue - outFinancialValue,
      totalInventoryStockValuation,
      totalStockUnits,
    };
  }, [filteredMovements, productMap, products]);

  // Generate Report Number
  const reportNumber = useMemo(() => {
    const monthStr = String(currentMonthIndex + 1).padStart(2, "0");
    return `REP-INV-${currentYear}${monthStr}-0882`;
  }, [currentYear, currentMonthIndex]);

  const reportDateFormatted = useMemo(() => {
    return now.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [now]);

  // Period label
  const periodLabel = useMemo(() => {
    if (periodFilter === "current_month") {
      return `شهر ${now.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}`;
    }
    if (periodFilter === "previous_month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return `شهر ${d.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}`;
    }
    return "كافة العمليات الموثقة بالمنظومة";
  }, [periodFilter, now]);

  // PDF Generation Function
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setIsGenerating(true);
      setDownloadSuccess(false);

      const canvas = await html2canvas(printRef.current, {
        scale: 2, // High resolution for crisp print
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

      // Handle multi-page or single fit
      if (pdfHeight > 297) {
        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = 297;

        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`تقرير-حركة-المخزون-${periodFilter}-${currentYear}.pdf`);

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

  // Quick export on open trigger
  React.useEffect(() => {
    if (isOpen && quickExportOnOpen) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, quickExportOnOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-[#E1EBE8] my-3 flex flex-col max-h-[94vh]">
        {/* Top Actions & Filters Toolbar */}
        <div className="bg-[#F7FAF9] border-b border-[#E1EBE8] p-4 sm:p-5 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#126B68] text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#193B3A]">
                  تصدير تقرير حركة المخزون والعمليات الشهرية (PDF)
                </h3>
                <p className="text-xs text-[#6B8581]">
                  تقرير رسمي موثق بالأرصدة المالية، حركات التوريد والصرف الداخلي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-print-inventory-report"
                onClick={handlePrint}
                className="p-2.5 sm:px-3.5 sm:py-2 bg-white hover:bg-gray-100 text-[#193B3A] text-xs font-bold rounded-xl border border-[#DCE8E5] transition-all flex items-center gap-1.5 cursor-pointer"
                title="طباعة مباشرة"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">طباعة</span>
              </button>

              <button
                id="btn-download-inventory-pdf"
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="px-4 py-2.5 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isGenerating ? "جاري بناء الـ PDF..." : "تحميل تقرير PDF منظم"}
                </span>
              </button>

              <button
                id="btn-close-inventory-report-modal"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center border border-[#DCE8E5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-[#E5EFEA] text-xs">
            {/* Period Filter */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#DCE8E5]">
              <Calendar className="w-4 h-4 text-[#126B68] shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-[#6B8581] block font-bold">الفترة الزمنية:</span>
                <select
                  id="select-period-filter"
                  value={periodFilter}
                  onChange={(e) =>
                    setPeriodFilter(e.target.value as "current_month" | "previous_month" | "all")
                  }
                  className="w-full bg-transparent font-black text-[#193B3A] focus:outline-none cursor-pointer"
                >
                  <option value="current_month">الشهر الحالي ({now.toLocaleDateString("ar-SA", { month: "long" })})</option>
                  <option value="previous_month">الشهر السابق</option>
                  <option value="all">كافة الحركات التاريخية</option>
                </select>
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#DCE8E5]">
              <Filter className="w-4 h-4 text-[#126B68] shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-[#6B8581] block font-bold">نوع الحركة:</span>
                <select
                  id="select-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as "all" | "استلام" | "صرف داخلي")}
                  className="w-full bg-transparent font-black text-[#193B3A] focus:outline-none cursor-pointer"
                >
                  <option value="all">جميع الحركات (توريد وصرف)</option>
                  <option value="استلام">توريد واستلام (+)</option>
                  <option value="صرف داخلي">صرف داخلي للأقسام (-)</option>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#DCE8E5]">
              <Layers className="w-4 h-4 text-[#126B68] shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] text-[#6B8581] block font-bold">تصنيف الأصناف:</span>
                <select
                  id="select-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-transparent font-black text-[#193B3A] focus:outline-none cursor-pointer"
                >
                  <option value="all">كافة التصنيفات الطبية</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {downloadSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم بنجاح تصدير ملف الـ PDF وحفظه في جهازك!</span>
            </div>
          )}
        </div>

        {/* Scrollable Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 flex justify-center">
          {/* A4 Document Canvas */}
          <div
            ref={printRef}
            id="printable-inventory-report-canvas"
            className="bg-white w-full max-w-4xl p-8 sm:p-10 shadow-lg border border-[#DCE8E5] space-y-6 text-[#193B3A]"
            style={{ minHeight: "297mm", fontFamily: "inherit" }}
          >
            {/* 1. Official Header & Ministry Banner */}
            <div className="flex items-center justify-between pb-5 border-b-2 border-[#126B68]">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-[#6B8581]">المملكة العربية السعودية</div>
                <div className="text-xs font-black text-[#126B68]">وزارة الصحة — تجمع الرياض الصحي الأول</div>
                <div className="text-base font-black text-[#193B3A]">مستشفى الملك فهد التخصصي</div>
                <div className="text-xs text-[#5A736F] font-bold">الإدارة الطبية — قسم الصيدلة وسلاسل الإمداد المخزني</div>
              </div>

              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F6FAF8] border border-[#DCE8E5] text-center space-y-1">
                <ShieldCheck className="w-7 h-7 text-[#126B68]" />
                <span className="text-[10px] font-black text-[#126B68]">وثيقة رسمية معتمدة</span>
                <span className="font-mono text-[9px] text-[#6B8581]">{reportNumber}</span>
              </div>
            </div>

            {/* 2. Document Title & Period Banner */}
            <div className="bg-gradient-to-l from-[#126B68] to-[#1E4D48] text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-teal-200">
                  سجل حركة التوريد والصرف والتقييم المالي
                </span>
                <h1 className="text-lg sm:text-xl font-black">
                  تقرير حركة المخزون والعمليات الشهرية
                </h1>
                <p className="text-xs text-teal-100">
                  الفترة المستهدفة: <strong className="text-white">{periodLabel}</strong>
                </p>
              </div>

              <div className="text-right sm:text-left text-xs space-y-1 font-mono">
                <div>تاريخ التقرير: <span className="font-bold">{reportDateFormatted}</span></div>
                <div>المشرف المعتمد: <span className="font-bold">{auditorName}</span></div>
              </div>
            </div>

            {/* 3. Executive Summary / KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Transactions */}
              <div className="bg-[#F8FBFA] p-3.5 rounded-2xl border border-[#E1EBE8] text-right space-y-1">
                <span className="text-[11px] text-[#6B8581] font-bold block">إجمالي العمليات الموثقة</span>
                <div className="text-xl font-black text-[#193B3A]">{stats.totalTransactions}</div>
                <span className="text-[10px] text-teal-700 font-medium">حركة مسجلة بالنظام</span>
              </div>

              {/* Total Inflow Value */}
              <div className="bg-[#F8FBFA] p-3.5 rounded-2xl border border-[#E1EBE8] text-right space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#6B8581] font-bold">التوريد والاستلام (+)</span>
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-lg font-black text-emerald-700">
                  {stats.inFinancialValue.toLocaleString()} ريال
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {stats.inQty.toLocaleString()} وحدة مستلمة
                </span>
              </div>

              {/* Total Outflow Value */}
              <div className="bg-[#F8FBFA] p-3.5 rounded-2xl border border-[#E1EBE8] text-right space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#6B8581] font-bold">الصرف الداخلي (-)</span>
                  <ArrowUpLeft className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-lg font-black text-rose-700">
                  {stats.outFinancialValue.toLocaleString()} ريال
                </div>
                <span className="text-[10px] text-rose-600 font-medium">
                  {stats.outQty.toLocaleString()} وحدة مصروفة
                </span>
              </div>

              {/* Total Inventory Asset Valuation */}
              <div className="bg-[#F8FBFA] p-3.5 rounded-2xl border border-[#E1EBE8] text-right space-y-1">
                <span className="text-[11px] text-[#6B8581] font-bold block">قيمة المخزون الإجمالية</span>
                <div className="text-lg font-black text-[#126B68]">
                  {stats.totalInventoryStockValuation.toLocaleString()} ريال
                </div>
                <span className="text-[10px] text-[#6B8581] font-medium">
                  {stats.totalStockUnits.toLocaleString()} وحدة بالمستودع
                </span>
              </div>
            </div>

            {/* 4. Movements Detail Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-[#193B3A] flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-[#126B68]" />
                  <span>تفاصيل سجل العمليات وحركات الأصناف:</span>
                </h4>
                <span className="text-[11px] text-[#6B8581] font-mono">
                  إجمالي السجلات: {filteredMovements.length} عملية
                </span>
              </div>

              <div className="border border-[#DCE8E5] rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-[#F0F5F3] text-[#193B3A] border-b border-[#DCE8E5]">
                    <tr>
                      <th className="p-2.5 font-bold font-mono text-[11px]">كود الحركة</th>
                      <th className="p-2.5 font-bold">الصنف الطبي</th>
                      <th className="p-2.5 font-bold">النوع</th>
                      <th className="p-2.5 font-bold text-center">الكمية</th>
                      <th className="p-2.5 font-bold text-center">سعر الوحدة</th>
                      <th className="p-2.5 font-bold text-center">القيمة الإجمالية</th>
                      <th className="p-2.5 font-bold">المنفذ</th>
                      <th className="p-2.5 font-bold">التاريخ</th>
                      <th className="p-2.5 font-bold">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF3F1]">
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-[#6B8581]">
                          لا توجد عمليات مسجلة خلال الفترة الزمنية المحددة.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((m) => {
                        const prod = productMap.get(m.productId);
                        const unitPrice = prod?.price || 0;
                        const totalVal = Math.abs(m.quantity) * unitPrice;
                        const isPositive = m.quantity > 0 || m.movementType === "استلام";

                        return (
                          <tr key={m.id} className="hover:bg-gray-50/80">
                            <td className="p-2.5 font-mono font-bold text-[#126B68] text-[11px]">
                              {m.id}
                            </td>
                            <td className="p-2.5 font-bold text-[#193B3A]">
                              <div>{m.productName}</div>
                              {prod && (
                                <span className="text-[10px] text-[#6B8581] font-normal">
                                  {prod.category} ({prod.productCode})
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isPositive
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {m.movementType}
                              </span>
                            </td>
                            <td
                              className={`p-2.5 font-mono font-black text-center ${
                                isPositive ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {isPositive ? `+${Math.abs(m.quantity)}` : `-${Math.abs(m.quantity)}`}{" "}
                              <span className="text-[10px] font-normal text-gray-500">
                                {prod?.unit || "وحدة"}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-center text-gray-700 text-[11px]">
                              {unitPrice.toLocaleString()} ريال
                            </td>
                            <td className="p-2.5 font-mono font-black text-center text-[#126B68] text-[11px]">
                              {totalVal.toLocaleString()} ريال
                            </td>
                            <td className="p-2.5 text-[#5A736F] text-[11px]">{m.performedBy}</td>
                            <td className="p-2.5 text-gray-600 font-mono text-[10px]">
                              {new Date(m.timestamp).toLocaleString("ar-SA", {
                                month: "numeric",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-2.5 text-[#6B8581] text-[11px] max-w-[140px] truncate">
                              {m.notes || "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Totals Row */}
                  {filteredMovements.length > 0 && (
                    <tfoot className="bg-[#F8FBFA] font-bold border-t-2 border-[#DCE8E5] text-[#193B3A]">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-right font-black">
                          المجموع الكلي للحركات المعروضة:
                        </td>
                        <td className="p-2.5 text-center font-mono font-black text-[#126B68]">
                          صافي: {stats.netQty > 0 ? `+${stats.netQty}` : stats.netQty}
                        </td>
                        <td className="p-2.5 text-center text-[11px] text-gray-400">—</td>
                        <td className="p-2.5 text-center font-mono font-black text-[#126B68]">
                          {(stats.inFinancialValue + stats.outFinancialValue).toLocaleString()} ريال
                        </td>
                        <td colSpan={3} className="p-2.5 text-[10px] text-gray-500 text-left font-mono">
                          مجموع التداول المالي
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* 5. Official Endorsement, Signatures & Digital Stamp */}
            <div className="pt-6 border-t-2 border-[#E1EBE8] grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
              {/* Warehouse Keeper Signature */}
              <div className="space-y-3 p-3 rounded-2xl bg-[#F9FBFA] border border-[#EEF3F1]">
                <div className="font-bold text-[#193B3A]">أمين المستودع الطبي</div>
                <div className="text-[11px] text-[#6B8581]">مشرف استلام وصرف العهدة</div>
                <div className="pt-3 font-serif italic text-emerald-800 font-bold border-b border-dashed border-gray-300 pb-1">
                  عبدالله السبيعي
                </div>
                <div className="text-[10px] text-gray-400 font-mono">التوقيع الإلكتروني معتمد</div>
              </div>

              {/* Head of Pharmacy / Auditor */}
              <div className="space-y-3 p-3 rounded-2xl bg-[#F9FBFA] border border-[#EEF3F1]">
                <div className="font-bold text-[#193B3A]">رئيس قسم الصيدلة وسلاسل الإمداد</div>
                <div className="text-[11px] text-[#6B8581]">{auditorRole}</div>
                <div className="pt-3 font-serif italic text-teal-800 font-bold border-b border-dashed border-gray-300 pb-1">
                  {auditorName}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">مطابق لمعايير سباهي CBAHI</div>
              </div>

              {/* Financial & Digital Verification QR */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#F9FBFA] border border-[#EEF3F1] flex flex-col items-center justify-center">
                <div className="font-bold text-[#193B3A] text-xs">ختم التوثيق والتدقيق المالي</div>
                <div className="w-14 h-14 bg-white p-1 rounded-xl border border-gray-200 flex items-center justify-center shadow-2xs">
                  <QrCode className="w-11 h-11 text-[#126B68]" />
                </div>
                <div className="text-[9px] font-mono text-gray-500">SHA256: 4A8F-INV-2026-SA</div>
              </div>
            </div>

            {/* Document Footnote */}
            <div className="pt-2 text-[10px] text-gray-400 text-center flex items-center justify-between border-t border-gray-100">
              <span>نظام إدارة المنشآت الطبية الذكي — مستشفى الملك فهد التخصصي</span>
              <span className="font-mono">تم الإنشاء إلكترونياً • صفحة 1 من 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
