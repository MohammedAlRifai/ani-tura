import React, { useState } from "react";
import { X, Building2, CheckCircle2 } from "lucide-react";
import { Asset } from "../types";

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => Promise<boolean> | void;
  onSubmit: (asset: Omit<Asset, "id" | "updatedAt" | "qrCode">) => Promise<boolean> | void;
  departments?: string[];
  locations?: string[];
}

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments = ["الطوارئ", "العناية المركزة", "العيادات الخارجية", "المختبرات", "العمليات", "أجنحة التنويم"],
  locations = [],
}) => {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [location, setLocation] = useState(locations[0] || "");
  const [department, setDepartment] = useState(departments[0] || "الطوارئ");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serial.trim() || !location.trim()) {
      alert("يرجى ملء اسم الجهاز، الرقم التسلسلي، والموقع");
      return;
    }

    const saved = await onSubmit({
      name: name.trim(),
      model: model.trim() || "قياسي",
      serial: serial.trim(),
      location: location.trim(),
      department,
      vendor: vendor.trim() || "الوكيل المعتمد",
      status: "يعمل بكفاءة",
      lastMaintenance: new Date().toISOString().split("T")[0],
      notes: notes.trim() || undefined,
    });
    if(saved!==false)onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E1EBE8]">
        <div className="flex items-center justify-between p-5 border-b border-[#EDF4F2] sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h3 className="text-lg font-black text-[#193B3A]">تسجيل أصل أو جهاز طبي جديد</h3>
            <p className="text-xs text-[#788C88]">توليد كود QR آلي وتوثيق المعايرة في النظام</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F5F3] hover:bg-[#E3EDE9] flex items-center justify-center text-[#5A736F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] block">اسم الجهاز أو المعدة *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: جهاز صدمات القلب الآلي (Defibrillator)..."
              className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] block">الموديل (Model)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="مثال: HeartStart XL+"
                className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] block">الرقم التسلسلي (Serial No) *</label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="مثال: SN-772910"
                className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] block">القسم المخصص</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#193B3A] block">الموقع التفصيلي *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="الدور، رقم الغرفة، أو الجناح..."
                className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] block">المورد أو الوكيل المحلي</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="مثال: الشركة المتقدمة للتجهيزات الطبية"
              className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#193B3A] block">ملاحظات أولية وتوصيات المعايرة</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="أي اشتراطات خاصة بالتشغيل أو الصيانة..."
              className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-3 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
            />
          </div>

          <div className="pt-3 border-t border-[#EDF4F2] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#DCE8E5] text-[#526B66] font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-black flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تسجيل الجهاز وتوليد QR</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
