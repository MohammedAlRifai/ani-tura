import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Boxes,
  Wrench,
  ShoppingCart,
  Plus,
  Minus,
  RefreshCw,
  Zap,
  PackageCheck,
  Building2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
} from "lucide-react";
import { Asset, Product, PurchaseOrder, InventoryMovement, Report, UserProfile } from "../types";

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => Promise<boolean> | void;
  assets: Asset[];
  products: Product[];
  purchaseOrders?: PurchaseOrder[];
  reports?: Report[];
  onFoundAsset: (asset: Asset) => Promise<boolean> | void;
  onAddMovement?: (movement: Omit<InventoryMovement, "id" | "timestamp">) => Promise<boolean> | void;
  onCreatePurchaseOrder?: (order: Omit<PurchaseOrder, "id" | "orderDate">) => Promise<boolean> | void;
  currentUser?: UserProfile;
}

type ScanMode = "all" | "spare_parts" | "assets";
type SparePartAction = "movement" | "purchase_order";

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  assets,
  products,
  purchaseOrders = [],
  reports = [],
  onFoundAsset,
  onAddMovement,
  onCreatePurchaseOrder,
  currentUser,
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>("all");
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Scanned result state
  const [scannedResult, setScannedResult] = useState<
    | { type: "asset"; data: Asset }
    | { type: "product"; data: Product }
    | null
  >(null);

  // Spare part action configuration
  const [selectedAction, setSelectedAction] = useState<SparePartAction>("movement");
  
  // Movement form state
  const [movementType, setMovementType] = useState<"صرف داخلي" | "استلام" | "تعديل">("صرف داخلي");
  const [movementQty, setMovementQty] = useState(1);
  const [linkedReportId, setLinkedReportId] = useState<string>("");
  const [movementNotes, setMovementNotes] = useState("");

  // Purchase Order form state
  const [poQty, setPoQty] = useState(10);
  const [selectedPoTarget, setSelectedPoTarget] = useState<string>("new");

  // Local stock cache when user performs actions inside modal
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  // Camera stream and barcode detector handling
  useEffect(() => {
    if (!isOpen || scannedResult) return;

    let stream: MediaStream | null = null;
    let scanInterval: any = null;

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: cameraFacing,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
            setHasCamera(true);

            // Check if torch/flashlight is supported
            const track = stream.getVideoTracks()[0];
            const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities && "torch" in capabilities) {
              setTorchSupported(true);
            }

            // Real-time Barcode Detection if supported by browser
            if (typeof window !== "undefined" && "BarcodeDetector" in window) {
              try {
                const detector = new (window as any).BarcodeDetector({
                  formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "data_matrix"],
                });

                scanInterval = setInterval(async () => {
                  if (videoRef.current && videoRef.current.readyState >= 2) {
                    try {
                      const barcodes = await detector.detect(videoRef.current);
                      if (barcodes && barcodes.length > 0) {
                        const raw = barcodes[0].rawValue;
                        if (raw) {
                          handleLookup(raw);
                        }
                      }
                    } catch (e) {
                      // ignore frame detection error
                    }
                  }
                }, 450);
              } catch (err) {
                console.log("BarcodeDetector setup:", err);
              }
            }
          }
        }
      } catch (err) {
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, cameraFacing, scannedResult]);

  // Reset modal state on close
  useEffect(() => {
    if (!isOpen) {
      setScannedResult(null);
      setErrorMsg("");
      setSuccessMsg("");
      setManualCode("");
      setIsTorchOn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle camera flashlight
  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.log("Torch toggle failed", e);
    }
  };

  // Flip camera between front and back
  const flipCamera = () => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Central lookup logic for Assets and Spare Parts
  const handleLookup = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    setErrorMsg("");
    setSuccessMsg("");

    // Match Spare Part / Inventory Product
    const matchedProduct = products.find(
      (p) =>
        p.productCode.toUpperCase() === clean ||
        `PRD-${p.id}`.toUpperCase() === clean ||
        p.name.toUpperCase().includes(clean) ||
        clean.includes(p.productCode.toUpperCase()) ||
        (clean.startsWith("SP-") && p.productCode.toUpperCase().includes(clean))
    );

    // Match Asset
    const matchedAsset = assets.find(
      (a) =>
        a.id.toUpperCase() === clean ||
        a.qrCode.toUpperCase() === clean ||
        a.serial.toUpperCase() === clean ||
        a.qrCode.replace("AIN-", "").toUpperCase() === clean ||
        clean.includes(a.qrCode.toUpperCase())
    );

    if (scanMode === "spare_parts") {
      if (matchedProduct) {
        setScannedResult({ type: "product", data: matchedProduct });
        setCurrentStock(matchedProduct.stock);
        setMovementQty(1);
        setPoQty(Math.max(8, matchedProduct.minStockAlert * 2 - matchedProduct.stock));
        return;
      } else if (matchedAsset) {
        setScannedResult({ type: "asset", data: matchedAsset });
        return;
      }
    } else if (scanMode === "assets") {
      if (matchedAsset) {
        setScannedResult({ type: "asset", data: matchedAsset });
        return;
      } else if (matchedProduct) {
        setScannedResult({ type: "product", data: matchedProduct });
        setCurrentStock(matchedProduct.stock);
        return;
      }
    } else {
      // Universal detection
      if (matchedProduct) {
        setScannedResult({ type: "product", data: matchedProduct });
        setCurrentStock(matchedProduct.stock);
        setMovementQty(1);
        setPoQty(Math.max(8, matchedProduct.minStockAlert * 2 - matchedProduct.stock));
        return;
      }
      if (matchedAsset) {
        setScannedResult({ type: "asset", data: matchedAsset });
        return;
      }
    }

    setErrorMsg(`لم يتم العثور على صنف أو جهاز مطابق للرمز: ${clean}`);
  };

  // Submit Inventory Movement
  const handleConfirmMovement = async () => {
    if (!scannedResult || scannedResult.type !== "product" || !onAddMovement) return;
    const product = scannedResult.data;

    const qtyMultiplier = movementType === "صرف داخلي" ? -1 : 1;
    const finalQty = movementQty * qtyMultiplier;

    // Reference note
    let refCode = linkedReportId ? `مرتبط ببلاغ: ${linkedReportId}` : "مسح باركود ميداني";

    const saved=await onAddMovement({
      productId: product.id,
      productName: product.name,
      movementType,
      quantity: finalQty,
      referenceCode: refCode,
      notes: movementNotes || `صرف قطعة غيار ${product.productCode} بواسطة ماسح الأكواد`,
      performedBy: currentUser ? `${currentUser.name} (${currentUser.roleTitle})` : "مهندس الصيانة الميدانية",
    });

    if(saved===false)return;
    const newLocalStock = Math.max(0, (currentStock ?? product.stock) + finalQty);
    setCurrentStock(newLocalStock);
    setSuccessMsg(
      `تم توثيق حركة (${movementType}: ${movementQty} ${product.unit}) بنجاح! الرصيد المتبقي: ${newLocalStock} ${product.unit}`
    );
  };

  // Submit Purchase Order Link
  const handleConfirmPurchaseOrder = async () => {
    if (!scannedResult || scannedResult.type !== "product" || !onCreatePurchaseOrder) return;
    const product = scannedResult.data;

    const totalAmount = poQty * product.price;

    const saved=await onCreatePurchaseOrder({
      hospitalName: "مستشفى الملك فهد التخصصي — التموين الطبي",
      supplierName: product.supplierName || "موردو الرعاية الطبية",
      items: [
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          price: product.price,
          quantity: poQty,
        },
      ],
      totalAmount,
      status: "مسودة",
      autoReplenished: false,
    });

    if(saved===false)return;
    setSuccessMsg(
      `تم إعداد مسودة أمر الشراء رقم التوريد للقطعة (${product.name}) بكمية ${poQty} ${product.unit} وإرساله للمورد بنجاح!`
    );
  };

  // Filter spare parts & consumables for quick testing
  const sparePartPresets = products.filter(
    (p) => p.productCode.startsWith("SP-") || p.category.includes("قطع غيار") || p.category.includes("مستلزمات")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E1EBE8] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EDF4F2] bg-[#193B3A] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#126B68] flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">ماسح الأكواد والباركود الذكي</h3>
                <span className="bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#10B981]/30">
                  كاميرا نشطة
                </span>
              </div>
              <p className="text-[11px] text-[#A7C2BD]">
                مسح قطع الغيار وربطها بالمخزون وأوامر الشراء أو فحص الأجهزة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scan Mode Selector Tabs */}
        {!scannedResult && (
          <div className="flex border-b border-[#EDF4F2] bg-[#F6FAF8] p-1.5 gap-1 text-xs font-bold">
            <button
              onClick={() => setScanMode("all")}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                scanMode === "all"
                  ? "bg-white text-[#126B68] shadow-xs font-black"
                  : "text-[#667E7A] hover:text-[#193B3A]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تلقائي شامل (الكل)</span>
            </button>

            <button
              onClick={() => setScanMode("spare_parts")}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                scanMode === "spare_parts"
                  ? "bg-white text-[#126B68] shadow-xs font-black"
                  : "text-[#667E7A] hover:text-[#193B3A]"
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>قطع الغيار والمخزون</span>
            </button>

            <button
              onClick={() => setScanMode("assets")}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                scanMode === "assets"
                  ? "bg-white text-[#126B68] shadow-xs font-black"
                  : "text-[#667E7A] hover:text-[#193B3A]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>الأجهزة والمرافق</span>
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Main Scanning Viewfinder (When no code is yet locked) */}
          {!scannedResult ? (
            <>
              {/* Camera Container */}
              <div className="relative w-full h-56 sm:h-64 bg-[#0a0f0e] rounded-2xl overflow-hidden flex items-center justify-center border-2 border-[#126B68] shadow-inner">
                {hasCamera ? (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2 text-[#8B9A97]">
                    <div className="w-12 h-12 rounded-2xl bg-[#126B68]/20 flex items-center justify-center mx-auto text-[#10B981]">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-white font-black">جاهزية الكاميرا والماسح الضوئي</p>
                    <p className="text-[11px] text-[#A7C2BD] max-w-xs mx-auto">
                      وجه كاميرا الهاتف نحو ملصق الباركود أو الـ QR لقطعة الغيار أو الجهاز
                    </p>
                  </div>
                )}

                {/* Laser Overlay & Target Reticle */}
                <div className="absolute inset-6 border border-white/30 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-t-2 border-r-2 border-[#10B981] rounded-tr-md"></div>
                    <div className="w-5 h-5 border-t-2 border-l-2 border-[#10B981] rounded-tl-md"></div>
                  </div>

                  {/* Laser Scanning Animation */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#10B981] to-transparent shadow-[0_0_12px_#10B981] animate-pulse"></div>

                  <div className="flex justify-between">
                    <div className="w-5 h-5 border-b-2 border-r-2 border-[#10B981] rounded-br-md"></div>
                    <div className="w-5 h-5 border-b-2 border-l-2 border-[#10B981] rounded-bl-md"></div>
                  </div>
                </div>

                {/* Camera In-Screen Controls */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2 rounded-xl backdrop-blur-md transition-colors cursor-pointer ${
                        isTorchOn ? "bg-[#F4C96B] text-[#193B3A]" : "bg-black/40 text-white hover:bg-black/60"
                      }`}
                      title="فلاش الكاميرا"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={flipCamera}
                    className="p-2 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-colors cursor-pointer"
                    title="تبديل الكاميرا"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Status chip at bottom */}
                <div className="absolute bottom-3 bg-black/60 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
                  <span>
                    {scanMode === "spare_parts"
                      ? "وضع مسح قطع الغيار والمخزون"
                      : scanMode === "assets"
                      ? "وضع مسح كود الأجهزة والمرافق"
                      : "المسح التلقائي الميداني"}
                  </span>
                </div>
              </div>

              {/* Manual Input Search */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#193B3A] flex items-center justify-between">
                  <span>إدخال كود الباركود / الرقم المرجعي يدوياً:</span>
                  <span className="text-[10px] text-[#6B8581]">مثال: SP-VENT-FLT أو AST-001</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="أدخل كود الصنف أو الجهاز..."
                      className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl pr-3 pl-8 py-2.5 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68] font-mono"
                      onKeyDown={(e) => e.key === "Enter" && handleLookup(manualCode)}
                    />
                    <Barcode className="w-4 h-4 text-[#8C9E9A] absolute left-3 top-3" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLookup(manualCode)}
                    className="px-4 py-2.5 bg-[#126B68] hover:bg-[#0d5553] text-white font-black rounded-xl flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>مطابقة</span>
                  </button>
                </div>

                {errorMsg && (
                  <p className="text-red-600 text-[11px] font-bold flex items-center gap-1 mt-1 bg-red-50 p-2 rounded-lg border border-red-100">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </p>
                )}
              </div>

              {/* Quick Presets for 1-Click Spare Part & Asset Testing */}
              <div className="space-y-2 pt-2 border-t border-[#EDF4F2]">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#738884]">
                  <span>قطع غيار وأجهزة سريعة للاختبار الفوري:</span>
                  <span className="text-[10px] text-[#126B68]">انقر لمطابقة الكود فوراً</span>
                </div>

                {/* Spare Parts Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-[#193B3A] flex items-center gap-1">
                    <Boxes className="w-3 h-3 text-[#126B68]" />
                    <span>قطع الغيار والمستهلكات الطبية:</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {sparePartPresets.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleLookup(p.productCode)}
                        className="p-2 rounded-xl bg-[#F6FAF8] hover:bg-[#EAF5F2] border border-[#DCE8E5] hover:border-[#126B68]/40 text-right transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-[#126B68] font-bold">
                            {p.productCode}
                          </span>
                          <span className="text-[9px] bg-white px-1.5 py-0.2 rounded border border-[#DCE8E5] font-bold text-[#6B8581]">
                            مخزون: {p.stock}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#193B3A] truncate block mt-0.5 group-hover:text-[#126B68]">
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Asset Chips */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-extrabold text-[#193B3A] flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#126B68]" />
                    <span>الأجهزة الطبية:</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {assets.slice(0, 2).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleLookup(a.qrCode)}
                        className="p-2 rounded-xl bg-[#F6FAF8] hover:bg-[#EAF5F2] border border-[#DCE8E5] text-right transition-all cursor-pointer"
                      >
                        <span className="font-mono text-[10px] text-[#126B68] font-bold block">
                          {a.qrCode}
                        </span>
                        <span className="text-[11px] font-bold text-[#193B3A] truncate block">
                          {a.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Scanned Result Card & Automated Actions */
            <div className="space-y-4 animate-fade-in">
              {/* Back to scanning button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setScannedResult(null);
                    setSuccessMsg("");
                    setErrorMsg("");
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-[#126B68] hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>مسح كود أو صنف آخر</span>
                </button>

                <span className="text-[10px] font-bold bg-[#E9F5F2] text-[#126B68] px-2 py-0.5 rounded-md">
                  تمت المطابقة والتعرف بنجاح
                </span>
              </div>

              {/* Success Notification */}
              {successMsg && (
                <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl flex items-start gap-2.5 text-[#065F46] animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                  <div className="text-xs font-bold leading-relaxed">{successMsg}</div>
                </div>
              )}

              {/* Case 1: Scanned item is a Product / Spare Part */}
              {scannedResult.type === "product" && (
                <div className="space-y-3.5">
                  {/* Spare Part Summary Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F6FAF8] to-[#EEF7F4] border border-[#CDE5DF] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#126B68] text-white flex items-center justify-center shrink-0">
                          <Boxes className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-black text-[#126B68] bg-white px-2 py-0.5 rounded-md border border-[#CDE5DF]">
                              {scannedResult.data.productCode}
                            </span>
                            <span className="text-[10px] bg-[#DDF4F0] text-[#126B68] font-bold px-2 py-0.5 rounded-md">
                              {scannedResult.data.category}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-[#193B3A] mt-1">
                            {scannedResult.data.name}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Stock & Commercial Metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DCE8E5] text-center">
                      <div className="bg-white p-2 rounded-xl border border-[#DCE8E5]">
                        <span className="text-[10px] text-[#738884] block">الرصيد بالمستودع</span>
                        <span className={`text-sm font-black ${
                          (currentStock ?? scannedResult.data.stock) <= scannedResult.data.minStockAlert
                            ? "text-[#DC2626]"
                            : "text-[#10B981]"
                        }`}>
                          {currentStock ?? scannedResult.data.stock} {scannedResult.data.unit}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-[#DCE8E5]">
                        <span className="text-[10px] text-[#738884] block">حد الأمان الأدنى</span>
                        <span className="text-sm font-black text-[#193B3A]">
                          {scannedResult.data.minStockAlert} {scannedResult.data.unit}
                        </span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-[#DCE8E5]">
                        <span className="text-[10px] text-[#738884] block">سعر الوحدة</span>
                        <span className="text-sm font-black text-[#126B68]">
                          {scannedResult.data.price} ريال
                        </span>
                      </div>
                    </div>

                    {(currentStock ?? scannedResult.data.stock) <= scannedResult.data.minStockAlert && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#B45309] bg-[#FFFBEB] p-2 rounded-xl border border-[#FDE68A] font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>تنبيه عاجل: رصيد القطعة يقترب من النفاد ويستوجب إعادة الطلب.</span>
                      </div>
                    )}
                  </div>

                  {/* Action Mode Toggle */}
                  <div className="flex bg-[#F0F5F3] p-1 rounded-xl gap-1 text-xs font-bold">
                    <button
                      onClick={() => setSelectedAction("movement")}
                      className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedAction === "movement"
                          ? "bg-white text-[#126B68] shadow-xs font-black"
                          : "text-[#667E7A] hover:text-[#193B3A]"
                      }`}
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>حركة مخزون فورية</span>
                    </button>

                    <button
                      onClick={() => setSelectedAction("purchase_order")}
                      className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedAction === "purchase_order"
                          ? "bg-white text-[#126B68] shadow-xs font-black"
                          : "text-[#667E7A] hover:text-[#193B3A]"
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>أمر شراء توريد</span>
                    </button>
                  </div>

                  {/* Sub-Panel A: Direct Inventory Movement */}
                  {selectedAction === "movement" && (
                    <div className="p-4 bg-white border border-[#E1EBE8] rounded-2xl space-y-3">
                      <h5 className="font-black text-[#193B3A] text-xs flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-[#126B68]" />
                        <span>توثيق حركة القطعة تلقائياً في السجل الطبي:</span>
                      </h5>

                      {/* Movement Type Select */}
                      <div className="grid grid-cols-3 gap-2">
                        {(["صرف داخلي", "استلام", "تعديل"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setMovementType(type)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                              movementType === type
                                ? "bg-[#126B68] text-white border-[#126B68]"
                                : "bg-[#F6FAF8] text-[#556966] border-[#DCE8E5] hover:bg-[#EAF5F2]"
                            }`}
                          >
                            {type === "صرف داخلي" ? "صرف صيانة (-)" : type === "استلام" ? "استلام (+)" : "تعديل جرد"}
                          </button>
                        ))}
                      </div>

                      {/* Quantity Selector with Stepper */}
                      <div className="flex items-center justify-between bg-[#F6FAF8] p-2.5 rounded-xl border border-[#DCE8E5]">
                        <span className="font-bold text-[#193B3A]">الكمية المراد حركتها:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMovementQty((q) => Math.max(1, q - 1))}
                            className="w-8 h-8 rounded-lg bg-white border border-[#DCE8E5] flex items-center justify-center font-bold text-[#193B3A] hover:bg-gray-50 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-black text-sm text-[#193B3A]">
                            {movementQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMovementQty((q) => q + 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-[#DCE8E5] flex items-center justify-center font-bold text-[#193B3A] hover:bg-gray-50 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] text-[#738884] font-bold">
                            {scannedResult.data.unit}
                          </span>
                        </div>
                      </div>

                      {/* Link with Report or Asset */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#556966] block">
                          ربط ببلاغ صيانة أو جهاز مستهدف (اختياري):
                        </label>
                        <select
                          value={linkedReportId}
                          onChange={(e) => setLinkedReportId(e.target.value)}
                          className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl px-3 py-2 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                        >
                          <option value="">بدون ربط (حركة مستودعية عامة)</option>
                          {reports.slice(0, 5).map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.id}: {r.title} ({r.location})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Notes */}
                      <input
                        type="text"
                        value={movementNotes}
                        onChange={(e) => setMovementNotes(e.target.value)}
                        placeholder="ملاحظات الصيانة (مثال: تم تركيب الفلتر في جناح العمليات 3)..."
                        className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl px-3 py-2 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                      />

                      {/* Confirm Button */}
                      <button
                        type="button"
                        onClick={handleConfirmMovement}
                        className="w-full py-2.5 bg-[#126B68] hover:bg-[#0e5754] text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>تسجيل وتأكيد حركة المخزون</span>
                      </button>
                    </div>
                  )}

                  {/* Sub-Panel B: Direct Purchase Order Link */}
                  {selectedAction === "purchase_order" && (
                    <div className="p-4 bg-white border border-[#E1EBE8] rounded-2xl space-y-3">
                      <h5 className="font-black text-[#193B3A] text-xs flex items-center gap-1.5">
                        <ShoppingCart className="w-4 h-4 text-[#126B68]" />
                        <span>إصدار أمر شراء فوري لتعويض رصيد القطعة:</span>
                      </h5>

                      <div className="bg-[#F6FAF8] p-3 rounded-xl border border-[#DCE8E5] space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#6B8581]">المورد المعتمد:</span>
                          <span className="text-[#193B3A]">{scannedResult.data.supplierName}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#6B8581]">سعر الوحدة بالريال:</span>
                          <span className="text-[#193B3A]">{scannedResult.data.price} ريال</span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center justify-between bg-[#F6FAF8] p-2.5 rounded-xl border border-[#DCE8E5]">
                        <span className="font-bold text-[#193B3A]">كمية التوريد المطلوبة:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPoQty((q) => Math.max(1, q - 5))}
                            className="w-8 h-8 rounded-lg bg-white border border-[#DCE8E5] flex items-center justify-center font-bold text-[#193B3A] hover:bg-gray-50 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-black text-sm text-[#193B3A]">
                            {poQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPoQty((q) => q + 5)}
                            className="w-8 h-8 rounded-lg bg-white border border-[#DCE8E5] flex items-center justify-center font-bold text-[#193B3A] hover:bg-gray-50 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] text-[#738884] font-bold">
                            {scannedResult.data.unit}
                          </span>
                        </div>
                      </div>

                      {/* Total Amount Summary */}
                      <div className="flex items-center justify-between bg-[#E9F5F2] p-3 rounded-xl border border-[#CDE5DF]">
                        <span className="font-bold text-[#193B3A]">إجمالي قيمة أمر الشراء:</span>
                        <span className="font-black text-sm text-[#126B68]">
                          {(poQty * scannedResult.data.price).toLocaleString()} ريال
                        </span>
                      </div>

                      {/* Confirm Purchase Order */}
                      <button
                        type="button"
                        onClick={handleConfirmPurchaseOrder}
                        className="w-full py-2.5 bg-[#126B68] hover:bg-[#0e5754] text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>اعتماد وإصدار أمر الشراء فوراً</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: Scanned item is an Asset */}
              {scannedResult.type === "asset" && (
                <div className="p-4 rounded-2xl bg-[#F6FAF8] border border-[#DCE8E5] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#126B68] text-white flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-black text-[#126B68] bg-white px-2 py-0.5 rounded-md border border-[#DCE8E5]">
                        {scannedResult.data.qrCode}
                      </span>
                      <h4 className="text-sm font-black text-[#193B3A] mt-1">
                        {scannedResult.data.name}
                      </h4>
                      <p className="text-[11px] text-[#6B8581]">
                        {scannedResult.data.model} • {scannedResult.data.location}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DCE8E5] text-xs">
                    <div className="bg-white p-2 rounded-xl border border-[#DCE8E5]">
                      <span className="text-[10px] text-[#738884] block">الرقم التسلسلي</span>
                      <span className="font-mono font-bold text-[#193B3A]">{scannedResult.data.serial}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-[#DCE8E5]">
                      <span className="text-[10px] text-[#738884] block">الحالة التشغيلية</span>
                      <span className="font-bold text-[#126B68]">{scannedResult.data.status}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFoundAsset(scannedResult.data);
                    }}
                    className="w-full py-2.5 bg-[#126B68] hover:bg-[#0e5754] text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>فتح الملف الفني الكامل للجهاز</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
