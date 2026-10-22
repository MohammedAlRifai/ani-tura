import React, { useState, useEffect } from "react";
import { X, Camera, Upload, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import { ReportPriority } from "../types";

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    location: string;
    category: string;
    priority: ReportPriority;
    description: string;
    imageUri?: string;
    assetId?: string;
  }) => Promise<boolean> | void;
  preselectedAssetId?: string;
  preselectedAssetName?: string;
  preselectedAssetLocation?: string;
  categories?: string[];
  hospitalLocations?: string[];
}

export const NewReportModal: React.FC<NewReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  preselectedAssetId,
  preselectedAssetName,
  preselectedAssetLocation,
  categories = ["أجهزة طبية", "مرافق", "كهرباء", "سلامة", "غازات طبية", "تكييف"],
  hospitalLocations = [
    "قسم الطوارئ — الدور الأرضي",
    "العناية المركزة (ICU) — الدور الأول",
    "العيادات الخارجية — البرج الشرقي",
    "المختبر المركزي — الدور الأرضي",
    "غرف العمليات الجراحية — الدور الثاني",
    "أجنحة التنويم — الدور الثالث",
  ],
}) => {
  const [title, setTitle] = useState(
    preselectedAssetName ? `عطل في جهاز: ${preselectedAssetName}` : ""
  );
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState(categories[0] || "أجهزة طبية");
  const [priority, setPriority] = useState<ReportPriority>("متوسط");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(()=>{if(isOpen){setTitle(preselectedAssetName?`عطل في جهاز: ${preselectedAssetName}`:"");setLocation(preselectedAssetLocation||"");setDescription("");setImageUri(undefined);}},[isOpen,preselectedAssetId]);
  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>10*1024*1024){alert("ارفع صورة PNG أو JPG أو WebP أقل من 10MB");return;}
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) {
      alert("يرجى ملء جميع الحقول الإلزامية");
      return;
    }

    setIsSubmitting(true);
    const saved = await onSubmit({
      title: title.trim(),
      location: location.trim(),
      category,
      priority,
      description: description.trim(),
      imageUri,
      assetId: preselectedAssetId,
    });
    setIsSubmitting(false);
    if(saved!==false)onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="تسجيل بلاغ" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E1EBE8]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EDF4F2] sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h3 className="text-lg font-black text-[#193B3A]">تسجيل بلاغ عطل أو صيانة</h3>
            <p className="text-xs text-[#788C88]">التوثيق الفوري يضمن سرعة الاستجابة الميدانية</p>
          </div>
          <button
            aria-label="إغلاق نافذة البلاغ"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F5F3] hover:bg-[#E3EDE9] flex items-center justify-center text-[#5A736F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {preselectedAssetId && (
            <div className="p-3 bg-[#E9F5F2] rounded-xl border border-[#CDE5DF] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#126B68]" />
              <span className="font-bold text-[#193B3A]">
                مرتبط بالجهاز: {preselectedAssetName} ({preselectedAssetId})
              </span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] block">عنوان البلاغ *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: توقف شاشة جهاز تخطيط القلب أو تسريب ماء..."
              className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] block">موقع المشكلة في المستشفى *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="المبنى، الدور، رقم الغرفة أو الجناح..."
              className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
              required
            />
            {/* Quick Location suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hospitalLocations.slice(0, 3).map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className="text-[10px] bg-[#F0F5F3] hover:bg-[#E1EBE8] text-[#526B66] px-2 py-0.5 rounded-md"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] block">تصنيف العطل</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] block">درجة الأولوية *</label>
              <div className="grid grid-cols-3 gap-1">
                {(["عاجل", "متوسط", "منخفض"] as ReportPriority[]).map((pri) => (
                  <button
                    type="button"
                    key={pri}
                    onClick={() => setPriority(pri)}
                    className={`py-2 text-[11px] font-bold rounded-xl border transition-all ${
                      priority === pri
                        ? pri === "عاجل"
                          ? "bg-[#C9684D] text-white border-[#C9684D]"
                          : pri === "متوسط"
                          ? "bg-[#B86B00] text-white border-[#B86B00]"
                          : "bg-[#2B7A3D] text-white border-[#2B7A3D]"
                        : "bg-[#F6FAF8] text-[#526B66] border-[#DCE8E5] hover:bg-gray-100"
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] block">تفاصيل المشكلة والملاحظات الفنية *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="صف ما حدث بدقة، رمز الخطأ الظاهر على الشاشة، وتأثير العطل على سير العمل..."
              className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
              required
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] block">إرفاق صورة توضيحية (اختياري)</label>
            {imageUri ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#DCE8E5] h-36 bg-black/5 flex items-center justify-center">
                <img src={imageUri} alt="معاينة المرفق" className="h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setImageUri(undefined)}
                  className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#CDE5DF] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#F6FAF8] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#E9F5F2] flex items-center justify-center text-[#126B68]">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="font-bold text-[#126B68]">اضغط لالتقاط صورة أو رفع ملف</span>
                  <p className="text-[10px] text-[#8B9A97] mt-0.5">PNG, JPG بحد أقصى 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#EDF4F2] flex items-center justify-end gap-2">
            <button
              type="button"
              aria-label="إغلاق نافذة البلاغ"
            onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#DCE8E5] text-[#526B66] font-bold hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-black shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>إرسال البلاغ فوراً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
