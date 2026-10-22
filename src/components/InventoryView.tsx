import React, { useState, useMemo } from "react";
import { SearchEmptyState } from "./SearchEmptyState";
import {
  Boxes,
  PlusCircle,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpLeft,
  RefreshCw,
  Package,
  History,
  CheckCircle2,
  Minus,
  Plus,
  Zap,
  ShoppingCart,
  TrendingDown,
  Download,
  FileSpreadsheet,
  Calendar,
  Layers,
} from "lucide-react";
import { Product, InventoryMovement, UserRole, UserProfile } from "../types";
import { InventoryReportPdfModal } from "./InventoryReportPdfModal";

interface InventoryViewProps {
  products: Product[];
  movements: InventoryMovement[];
  onAddMovement: (movement: Omit<InventoryMovement, "id" | "timestamp">) => Promise<boolean> | void;
  onAddNewProduct?: (prod: Omit<Product, "id">) => void;
  onAutoReplenish?: () => Promise<void> | void;
  currentUserRole?: UserRole;
  currentUser?: UserProfile;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  movements,
  onAddMovement,
  onAutoReplenish,
  currentUserRole,
  currentUser,
}) => {
  const [search, setSearch] = useState("");
  const [lotNumber,setLotNumber]=useState("");
  const [expiryDate,setExpiryDate]=useState("");
  const [movementBusy,setMovementBusy]=useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"items" | "history">("items");
  const [isAutoReplenishing, setIsAutoReplenishing] = useState(false);
  const [autoReplenishSuccess, setAutoReplenishSuccess] = useState(false);

  // PDF Export States
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [quickExportMode, setQuickExportMode] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<"current_month" | "previous_month" | "all">("current_month");

  // Form states for movement
  const [movementType, setMovementType] = useState<"استلام" | "صرف داخلي" | "تعديل">("استلام");
  const [qty, setQty] = useState(10);
  const [notes, setNotes] = useState("");
  const [performedBy, setPerformedBy] = useState(
    currentUser?.name ||
      (currentUserRole === "pharmacist"
        ? "د. نورة الغامدي (الصيدلية)"
        : "مشرف المستودع الطبي")
  );

  // Calculate monthly stats for quick summary
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthMovements = useMemo(() => {
    return movements.filter((m) => {
      const d = new Date(m.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [movements, currentMonth, currentYear]);

  const handleQuickExport = () => {
    setReportPeriod("current_month");
    setQuickExportMode(true);
    setPdfModalOpen(true);
  };

  const handleCustomPdfExport = () => {
    setReportPeriod("current_month");
    setQuickExportMode(false);
    setPdfModalOpen(true);
  };

  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);

  const handleRunAutoReplenish = async () => {
    if (!onAutoReplenish || lowStockProducts.length === 0) return;
    setIsAutoReplenishing(true);
    setAutoReplenishSuccess(false);
    try {
      await onAutoReplenish();
      setAutoReplenishSuccess(true);
      setTimeout(() => setAutoReplenishSuccess(false), 5000);
    } finally {
      setIsAutoReplenishing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productCode.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase());

    const matchesLowStock = !filterLowStock || p.stock <= p.minStockAlert;

    return matchesSearch && matchesLowStock;
  });

  const handleOpenMovement = (prod: Product, defaultType: "استلام" | "صرف داخلي") => {
    setLotNumber("");setExpiryDate("");
    setSelectedProduct(prod);
    setMovementType(defaultType);
    setQty(10);
    setNotes("");
    setMovementModalOpen(true);
  };

  const submitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || qty <= 0) return;

    if(!Number.isInteger(qty)||(movementType!=="استلام"&&qty>selectedProduct.stock)){alert("الكمية غير صحيحة أو تتجاوز الرصيد");return;}
    const actualQty = movementType === "استلام" ? qty : -qty;

    setMovementBusy(true);
    const saved = await onAddMovement({
      lotNumber,expiryDate,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      movementType,
      quantity: actualQty,
      notes: notes.trim() || undefined,
      performedBy,
    });

    setMovementBusy(false);if(saved!==false)setMovementModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#E1EBE8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#193B3A]">إدارة المخزون والمستلزمات الطبية</h2>
            <span className="bg-[#126B68] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {products.length} صنف
            </span>
          </div>
          <p className="text-xs text-[#738884] mt-0.5">
            متابعة أرصدة الأدوية، المحاليل، المستهلكات، وسجل حركات التوريد والصرف
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="tab-btn-items"
            onClick={() => setActiveSubTab("items")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === "items"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              قائمة الأصناف
            </span>
          </button>
          <button
            id="tab-btn-history"
            onClick={() => setActiveSubTab("history")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === "history"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <History className="w-4 h-4" />
              سجل الحركات ({movements.length})
            </span>
          </button>

          {/* Quick Export Button */}
          <button
            id="btn-quick-export-inventory"
            onClick={handleQuickExport}
            className="px-3.5 py-2 bg-[#F4C96B] hover:bg-[#ebd089] text-[#193B3A] text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            title="تصدير سريع للتقرير المالي والمخزني الشهري كملف PDF"
          >
            <Zap className="w-3.5 h-3.5 text-[#193B3A]" />
            <span>تصدير سريع</span>
          </button>

          {/* Detailed PDF Report Modal Button */}
          <button
            id="btn-open-pdf-report"
            onClick={handleCustomPdfExport}
            className="px-3.5 py-2 bg-[#E9F5F2] hover:bg-[#d8ece8] text-[#126B68] text-xs font-bold rounded-xl border border-[#CDE5DF] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="تخصيص وتصدير تقرير حركة المخزون كملف PDF منظم"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تقرير حركة المخزون (PDF)</span>
          </button>
        </div>
      </div>

      {activeSubTab === "items" ? (
        <>
          {/* Smart Auto-Replenishment Engine Card */}
          {lowStockProducts.length > 0 && (
            <div className="bg-gradient-to-r from-[#FFF9EE] via-[#FFF3DC] to-[#FFF9EE] border-2 border-[#F4DCAB] p-4 sm:p-5 rounded-3xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#B86B00] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#8C4A00]">
                        اقتراح إعادة الطلب
                      </h3>
                      <span className="bg-[#F4C96B] text-[#193B3A] text-[10px] font-black px-2 py-0.5 rounded-md">
                        ميزة مؤتمتة
                      </span>
                    </div>
                    <p className="text-xs text-[#9B5C08] mt-0.5 leading-relaxed">
                      تم رصد <span className="font-black text-[#C9684D]">{lowStockProducts.length} أصناف</span> هبطت دون حد الأمان. يمكن للمنظومة إعداد مسودات احتياج للمراجعة والاعتماد دون إنشاء فواتير أو إرسال للمورد.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunAutoReplenish}
                  disabled={isAutoReplenishing}
                  className="px-4 py-2.5 bg-[#B86B00] hover:bg-[#995800] text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 disabled:opacity-50 shrink-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {isAutoReplenishing ? "جاري تشغيل الأتمتة..." : "إعداد مسودات احتياج"}
                  </span>
                </button>
              </div>

              {autoReplenishSuccess && (
                <div className="bg-[#E5F5E8] border border-[#CBEAD2] text-[#2B7A3D] p-3 rounded-2xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-[#2B7A3D] shrink-0" />
                  <span>
                    تم بنجاح توليد أوامر الشراء للموردين المعتمدين وتوثيق الفواتير المستحقة تلقائياً!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-[#E1EBE8] space-y-3 shadow-xs">
            <div className="relative">
              <input
                type="text"
                value={search}
                aria-label="البحث في أصناف المخزون"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم الدواء، الكود، التصنيف، أو الشركة الموردة..."
                className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl py-2.5 pr-10 pl-4 text-xs text-[#193B3A] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68]"
              />
              <Search className="w-4 h-4 text-[#8B9A97] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-between pt-1 border-t border-[#F0F5F3] text-xs">
              <button
                onClick={() => setFilterLowStock(!filterLowStock)}
                aria-pressed={filterLowStock}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  filterLowStock
                    ? "bg-[#FFF2D6] text-[#B86B00] border border-[#F4DCAB]"
                    : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#B86B00]" />
                <span>إظهار الأصناف المنخفضة فقط (تنبيه إعادة الطلب)</span>
              </button>
              <span className="text-[#8B9A97] text-[11px]">المعروض: {filteredProducts.length} صنف</span>
            </div>
          </div>

          {/* Product Cards */}
          {filteredProducts.length === 0 && <SearchEmptyState onReset={() => { setSearch(""); setFilterLowStock(false); }} />}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const isLow = p.stock <= p.minStockAlert;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-[#E1EBE8] hover:border-[#126B68] p-4.5 shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-[10px] bg-[#E9F5F2] text-[#126B68] font-bold px-1.5 py-0.5 rounded-md">
                          {p.productCode}
                        </span>
                        <h3 className="text-sm font-black text-[#193B3A] mt-1 line-clamp-1">{p.name}</h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                          isLow
                            ? "bg-[#FBE6DE] text-[#C9684D] border-[#F1D3C6] animate-pulse"
                            : "bg-[#E5F5E8] text-[#2B7A3D] border-[#CBEAD2]"
                        }`}
                      >
                        {isLow ? "يقترب من النفاد" : "متوفر"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#5E7772]">
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">التصنيف:</span>
                        <span className="font-medium text-[#193B3A]">{p.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">المورد:</span>
                        <span className="font-medium text-[#193B3A] truncate max-w-[180px]">{p.supplierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">الوحدة والسعر:</span>
                        <span className="font-bold text-[#126B68]">
                          {p.price} ريال / {p.unit}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#F8FBFA] p-3 rounded-xl border border-[#EEF3F1] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#8B9A97] block">الرصيد المسجل بالمستودع</span>
                        <span className={`text-xl font-black ${isLow ? "text-[#C9684D]" : "text-[#193B3A]"}`}>
                          {p.stock}{" "}
                          <span className="text-xs font-normal text-[#8B9A97]">{p.unit}</span>
                        </span>
                      </div>
                      {/أدوية|محاليل|كواشف/.test(p.category)&&<p className="text-xs">الموثق بدفعات صالحة: {(p.batches||[]).filter(b=>b.expiryDate>new Date().toISOString().slice(0,10)).reduce((n,b)=>n+b.quantity,0)}</p>}
                      <div className="text-left text-[10px] text-[#8B9A97]">
                        <span>حد الأمان الأدنى:</span>
                        <div className="font-bold text-[#193B3A]">{p.minStockAlert}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for stock in / out */}
                  <div className="pt-2 border-t border-[#F0F5F3] flex items-center gap-2">
                    <button
                      onClick={() => handleOpenMovement(p, "استلام")}
                      className="flex-1 py-2 bg-[#E9F5F2] hover:bg-[#DDF4F0] text-[#126B68] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5 text-[#2B7A3D]" />
                      <span>توريد +</span>
                    </button>
                    <button
                      onClick={() => handleOpenMovement(p, "صرف داخلي")}
                      className="flex-1 py-2 bg-[#F6FAF8] hover:bg-[#F0F5F3] text-[#5A736F] text-xs font-bold rounded-xl border border-[#DCE8E5] transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowUpLeft className="w-3.5 h-3.5 text-[#C9684D]" />
                      <span>صرف -</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Movement History Section with Monthly Analytics & Quick Export */
        <div className="space-y-4">
          {/* Monthly Operations Snapshot Banner */}
          <div className="bg-gradient-to-l from-[#F0F7F5] via-[#F8FBFA] to-white p-4 sm:p-5 rounded-3xl border border-[#DCE8E5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#126B68] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  حركات الشهر ({now.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })})
                </span>
                <span className="text-xs text-[#193B3A] font-black bg-white px-2.5 py-0.5 rounded-lg border border-[#DCE8E5]">
                  {currentMonthMovements.length} حركة موثقة
                </span>
              </div>
              <p className="text-xs text-[#5A736F]">
                كافة عمليات التوريد والاستلام والصرف الداخلي بين الأقسام مدققة ومطابقة للأرصدة
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-banner-quick-export"
                onClick={handleQuickExport}
                className="px-4 py-2.5 bg-[#F4C96B] hover:bg-[#ebd089] text-[#193B3A] text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="تصدير سريع للتقرير المالي والمخزني الشهري كملف PDF فوراً"
              >
                <Zap className="w-4 h-4 text-[#193B3A]" />
                <span>تصدير سريع للتقرير المالي والمخزني</span>
              </button>

              <button
                id="btn-banner-pdf-export"
                onClick={handleCustomPdfExport}
                className="px-4 py-2.5 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="تصدير تقرير حركة المخزون كملف PDF منظم"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير حركة المخزون (PDF)</span>
              </button>
            </div>
          </div>

          {/* Movement History Table */}
          <div className="bg-white rounded-3xl border border-[#E1EBE8] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#EEF3F1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#193B3A]">سجل العمليات وحركات المخزون اللحظية</h3>
                <span className="text-xs text-[#8B9A97]">موثقة باسم المستخدم والتاريخ والأرصدة المستلمة والمصروفة</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-table-quick-export"
                  onClick={handleQuickExport}
                  className="px-3 py-1.5 bg-[#F4C96B] hover:bg-[#ebd089] text-[#193B3A] text-xs font-black rounded-xl flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-[#193B3A]" />
                  <span>تصدير سريع</span>
                </button>
                <button
                  id="btn-table-pdf-export"
                  onClick={handleCustomPdfExport}
                  className="px-3 py-1.5 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير كملف PDF</span>
                </button>
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F8FBFA] text-[#738884] border-b border-[#EEF3F1]">
                <tr>
                  <th className="p-3.5 font-bold">كود الحركة</th>
                  <th className="p-3.5 font-bold">الصنف</th>
                  <th className="p-3.5 font-bold">نوع الحركة</th>
                  <th className="p-3.5 font-bold">الكمية</th>
                  <th className="p-3.5 font-bold">المنفذ</th>
                  <th className="p-3.5 font-bold">الوقت</th>
                  <th className="p-3.5 font-bold">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3F1]">
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-[#F9FCFB] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#126B68]">{m.id}</td>
                      <td className="p-3.5 font-bold text-[#193B3A]">{m.productName}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            m.movementType === "استلام"
                              ? "bg-[#E5F5E8] text-[#2B7A3D]"
                              : "bg-[#FFF2D6] text-[#B86B00]"
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className={`p-3.5 font-bold ${isPositive ? "text-[#2B7A3D]" : "text-[#C9684D]"}`}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="p-3.5 text-[#5A736F]">{m.performedBy}</td>
                      <td className="p-3.5 text-[#8B9A97]">
                        {new Date(m.timestamp).toLocaleString("ar-SA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3.5 text-[#738884] max-w-xs truncate">{m.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* Quick Movement Modal */}
      {movementModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-[#E1EBE8] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2]">
              <div>
                <h3 className="text-base font-black text-[#193B3A]">تسجيل حركة مخزون</h3>
                <p className="text-xs text-[#788C88]">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setMovementModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F0F5F3] hover:bg-[#E3EDE9] flex items-center justify-center text-[#5A736F]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitMovement} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] block">نوع العملية</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType("استلام")}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      movementType === "استلام"
                        ? "bg-[#126B68] text-white border-[#126B68]"
                        : "bg-[#F6FAF8] text-[#526B66] border-[#DCE8E5]"
                    }`}
                  >
                    توريد واستلام (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType("صرف داخلي")}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      movementType === "صرف داخلي"
                        ? "bg-[#C9684D] text-white border-[#C9684D]"
                        : "bg-[#F6FAF8] text-[#526B66] border-[#DCE8E5]"
                    }`}
                  >
                    صرف لقسم / عيادة (-)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] block">الكمية ({selectedProduct.unit})</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-2.5 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                  required
                />
              </div>

              {selectedProduct&&/أدوية|محاليل|كواشف/.test(selectedProduct.category)&&<div className="space-y-3 p-3 border rounded-xl"><p>الصرف من دفعات صالحة موثقة، حسب الأقرب انتهاءً. الرصيد التجريبي غير الموثق لا يُصرف.</p>{movementType==="استلام"&&<><label className="block">رقم الدفعة<input required value={lotNumber} onChange={e=>setLotNumber(e.target.value)} className="w-full border rounded-lg p-2" /></label><label className="block">تاريخ الصلاحية<input required type="date" value={expiryDate} onChange={e=>setExpiryDate(e.target.value)} className="w-full border rounded-lg p-2" /></label></>}</div>}
              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] block">اسم المسؤول / المستلم</label>
                <input
                  type="text"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-2.5 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] block">ملاحظات أو رقم طلب الصرف</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: طلبية عاجلة لقسم الطوارئ..."
                  className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-2.5 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMovementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E5] text-[#526B66] font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit" disabled={movementBusy}
                  className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الحركة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Movements & Financial Report PDF Modal */}
      <InventoryReportPdfModal
        isOpen={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false);
          setQuickExportMode(false);
        }}
        products={products}
        movements={movements}
        currentUser={currentUser}
        initialPeriod={reportPeriod}
        quickExportOnOpen={quickExportMode}
      />
    </div>
  );
};
