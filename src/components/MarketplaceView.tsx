import React, { useState } from "react";
import {
  Store,
  ShoppingCart,
  Search,
  CheckCircle2,
  Building2,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Package,
  Truck,
  CalendarClock,
  Clock,
} from "lucide-react";
import { Product, Supplier, PurchaseOrder } from "../types";
import { SupplierPortalView } from "./SupplierPortalView";
import { SearchEmptyState } from "./SearchEmptyState";

interface MarketplaceViewProps {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onCreateOrder: (order: Omit<PurchaseOrder, "id" | "orderDate">) => Promise<boolean> | void;
  onUpdateOrder?: (
    orderId: string,
    updates: {
      expectedDeliveryDate?: string;
      status?: PurchaseOrder["status"];
      supplierNotes?: string;
      trackingNumber?: string;
    }
  ) => Promise<boolean> | void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  products,
  suppliers,
  purchaseOrders,
  onCreateOrder,
  onUpdateOrder,
}) => {
  const [search, setSearch] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("الكل");
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "orders" | "supplier_portal">("catalog");
  const [hospitalName, setHospitalName] = useState("مستشفى الملك فهد التخصصي");

  const pendingOrdersCount = purchaseOrders.filter(
    (po) => po.status === "مقبولة" || po.status === "قيد التوصيل"
  ).length;

  const defaultUpdateOrder = (
    orderId: string,
    updates: {
      expectedDeliveryDate?: string;
      status?: PurchaseOrder["status"];
      supplierNotes?: string;
      trackingNumber?: string;
    }
  ) => {
    if (onUpdateOrder) {
      return onUpdateOrder(orderId, updates);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSupplier =
      selectedSupplierId === "الكل" || p.supplierId === selectedSupplierId;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase());

    return matchesSupplier && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const [checkoutBusy,setCheckoutBusy]=useState(false);
  const handleCheckout = async () => {
    if(!cart.length||checkoutBusy)return;setCheckoutBusy(true);
    try{const groups=new Map<string,typeof cart>();for(const item of cart){const group=groups.get(item.product.supplierName)||[];group.push(item);groups.set(item.product.supplierName,group);}
      for(const [supplierName,items] of groups){const ok=await onCreateOrder({hospitalName,supplierName,items:items.map(c=>({productId:c.product.id,productName:c.product.name,unit:c.product.unit,price:c.product.price,quantity:c.quantity})),totalAmount:items.reduce((n,c)=>n+c.product.price*c.quantity,0),status:'مسودة'});if(ok===false)return;setCart(prev=>prev.filter(x=>x.product.supplierName!==supplierName));}
      setCartOpen(false);setActiveTab('orders');
    }finally{setCheckoutBusy(false);}
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#E1EBE8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#193B3A]">طلبات الاحتياج والتوريد</h2>
            <span className="bg-[#126B68] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              الموردون والوكلاء
            </span>
          </div>
          <p className="text-xs text-[#738884] mt-0.5">
            كتالوج مرجعي داخلي ومسودات مشتريات؛ لا يوجد إرسال خارجي إلى الموردين
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="tab-btn-catalog"
            onClick={() => setActiveTab("catalog")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
            }`}
          >
            كتالوج المنتجات
          </button>
          <button
            id="tab-btn-orders"
            onClick={() => setActiveTab("orders")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
            }`}
          >
            أوامر الشراء ({purchaseOrders.length})
          </button>
          <button
            id="tab-btn-supplier-portal"
            onClick={() => setActiveTab("supplier_portal")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "supplier_portal"
                ? "bg-[#126B68] text-white shadow-2xs"
                : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>متابعة الموردين داخليًا</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingOrdersCount} معلق
              </span>
            )}
          </button>
          {cart.length > 0 && (
            <button
              id="btn-open-cart"
              onClick={() => setCartOpen(true)}
              className="px-4 py-2 bg-[#F4C96B] hover:bg-[#ebd089] text-[#193B3A] text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة ({cart.length})</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "supplier_portal" ? (
        <SupplierPortalView
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          onUpdateOrder={defaultUpdateOrder}
          onBackToMarketplace={() => setActiveTab("catalog")}
        />
      ) : activeTab === "catalog" ? (
        <>
          {/* Supplier Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-[#E1EBE8] space-y-3 shadow-xs">
            <div className="relative">
              <input
                type="text"
                value={search}
                aria-label="البحث في سوق التوريد"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن أدوية، مستلزمات طبية، شرائح تحاليل أو مورد معتمد..."
                className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl py-2.5 pr-10 pl-4 text-xs text-[#193B3A] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68]"
              />
              <Search className="w-4 h-4 text-[#8B9A97] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#F0F5F3]">
              <span className="text-[11px] font-bold text-[#738884] ml-1">المورد:</span>
              <button
                onClick={() => setSelectedSupplierId("الكل")}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedSupplierId === "الكل"
                    ? "bg-[#126B68] text-white"
                    : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
                }`}
              >
                جميع الموردين
              </button>
              {suppliers.map((sup) => (
                <button
                  key={sup.id}
                  onClick={() => setSelectedSupplierId(sup.id)}
                  className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                    selectedSupplierId === sup.id
                      ? "bg-[#126B68] text-white"
                      : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
                  }`}
                >
                  {sup.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.length === 0 && <SearchEmptyState onReset={() => { setSearch(""); setSelectedSupplierId("الكل"); }} />}
            {filteredProducts.map((p) => {
              const inCartItem = cart.find((c) => c.product.id === p.id);
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E5F5E8] text-[#2B7A3D] border border-[#CBEAD2]">
                        {p.approvalStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#5E7772]">
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">التصنيف:</span>
                        <span className="font-medium text-[#193B3A]">{p.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">المورد:</span>
                        <span className="font-medium text-[#193B3A] truncate max-w-[170px]">{p.supplierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B9A97]">توفر المورد:</span>
                        <span className="font-bold text-[#193B3A]">
                          غير مربوط — يتطلب تأكيد المورد
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#F8FBFA] p-3 rounded-xl border border-[#EEF3F1] flex items-center justify-between">
                      <span className="text-xs text-[#8B9A97]">سعر مرجعي:</span>
                      <div className="text-left">
                        <span className="text-lg font-black text-[#126B68]">{p.price}</span>
                        <span className="text-xs text-[#8B9A97] mr-1">ريال / {p.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add to order cart button */}
                  <div className="pt-2 border-t border-[#F0F5F3]">
                    {inCartItem ? (
                      <div className="flex items-center justify-between bg-[#E9F5F2] p-1.5 rounded-xl">
                        <button
                          onClick={() => updateQuantity(p.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white text-[#126B68] flex items-center justify-center font-bold shadow-xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs text-[#193B3A]">
                          {inCartItem.quantity} {p.unit} في السلة
                        </span>
                        <button
                          onClick={() => updateQuantity(p.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#126B68] text-white flex items-center justify-center font-bold shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p)}
                        className="w-full py-2 bg-[#126B68] hover:bg-[#0d5553] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>إضافة لطلب الشراء</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Purchase Orders List */
        <div className="space-y-4">
          {purchaseOrders.map((po) => (
            <div
              key={po.id}
              className="bg-white rounded-3xl border border-[#E1EBE8] p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-[#E9F5F2] text-[#126B68] font-bold px-2 py-0.5 rounded-md">
                      {po.id}
                    </span>
                    <h3 className="text-sm font-black text-[#193B3A]">{po.supplierName}</h3>
                  </div>
                  <p className="text-xs text-[#788C88] mt-1">المنشأة: {po.hospitalName}</p>
                </div>
                <div className="text-left">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      po.status === "مكتملة"
                        ? "bg-[#E5F5E8] text-[#2B7A3D]"
                        : po.status === "قيد التوصيل"
                        ? "bg-[#DDF4F0] text-[#0C756C]"
                        : "bg-[#FFF2D6] text-[#B86B00]"
                    }`}
                  >
                    {po.status}
                  </span>
                  <div className="text-[11px] text-[#8B9A97] mt-1">تاريخ الطلب: {po.orderDate}</div>
                </div>
              </div>

              {/* Items in PO */}
              <div className="bg-[#F8FBFA] p-3 rounded-2xl border border-[#EEF3F1] space-y-1.5 text-xs">
                {po.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-[#EEF3F1] last:border-0">
                    <span className="font-medium text-[#193B3A]">{it.productName}</span>
                    <span className="text-[#5A736F]">
                      {it.quantity} {it.unit} × {it.price} = {(it.quantity * it.price).toLocaleString()} ريال
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-xs font-black text-[#126B68]">
                  <span>الإجمالي الكلي للطلب:</span>
                  <span>{po.totalAmount.toLocaleString()} ريال</span>
                </div>
              </div>

              {/* Delivery & Supplier Fulfillment Tracking */}
              <div className="pt-2 border-t border-[#F0F5F3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#788C88] flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5 text-[#126B68]" />
                    موعد التوريد المتوقع:
                  </span>
                  {po.expectedDeliveryDate ? (
                    <span className="font-mono font-bold bg-[#EBF5F3] text-[#126B68] px-2.5 py-0.5 rounded-md border border-[#CDE5DF]">
                      {po.expectedDeliveryDate}
                    </span>
                  ) : (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-medium border border-amber-200">
                      بانتظار تحديد المورد للموعد
                    </span>
                  )}

                  {po.trackingNumber && (
                    <span className="text-[#5A736F] font-mono text-[11px] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                      بوليصة: {po.trackingNumber}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab("supplier_portal")}
                  className="text-xs text-[#126B68] hover:text-[#0d5553] font-bold flex items-center gap-1 cursor-pointer self-end sm:self-auto hover:underline"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>إدارة الاعتماد والاستلام الداخلي ←</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Drawer / Modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-[#E1EBE8] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#126B68]" />
                <h3 className="text-base font-black text-[#193B3A]">سلة أمر الشراء والتوريد</h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F0F5F3] flex items-center justify-center text-[#5A736F]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="p-3 bg-[#F8FBFA] rounded-2xl border border-[#EEF3F1] flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-[#193B3A] block truncate">{product.name}</span>
                    <span className="text-[11px] text-[#788C88]">
                      {product.price} ريال / {product.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="w-6 h-6 rounded-md bg-white border border-[#DCE8E5] text-[#193B3A] flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="w-6 h-6 rounded-md bg-[#126B68] text-white flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-red-500 hover:text-red-700 mr-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 bg-[#E9F5F2] p-3 rounded-2xl border border-[#CDE5DF]">
              <div className="flex justify-between font-bold text-[#193B3A]">
                <span>إجمالي قيمة أمر الشراء:</span>
                <span className="text-base font-black text-[#126B68]">{cartTotal.toLocaleString()} ريال</span>
              </div>
              <p className="text-[10px] text-[#5A736F]">
                سيتم إرسال أمر الشراء مباشرة للشركة الموردة المعتمدة مع توثيق القيد المالي
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setCartOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DCE8E5] text-[#526B66] font-bold"
              >
                متابعة التسوق
              </button>
              <button
                onClick={handleCheckout}
                  disabled={checkoutBusy}
                className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إرسال أمر الشراء الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
