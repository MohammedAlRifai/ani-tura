import React, { useState } from "react";
import {
  Building2,
  PlusCircle,
  Search,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  FileText,
  MapPin,
  Clock,
} from "lucide-react";
import { Asset } from "../types";

interface AssetsViewProps {
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onOpenNewAsset: () => void;
  onReportAsset: (asset: Asset) => void;
  onOpenScanner: () => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
  assets,
  onSelectAsset,
  onOpenNewAsset,
  onReportAsset,
  onOpenScanner,
}) => {
  const [department, setDepartment] = useState<string>("الكل");
  const [search, setSearch] = useState("");

  const departments = React.useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      if (a.department) set.add(a.department);
    });
    return ["الكل", ...Array.from(set)];
  }, [assets]);

  const filtered = assets.filter((asset) => {
    const matchesDept = department === "الكل" || asset.department === department;
    const matchesSearch =
      !search ||
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.model.toLowerCase().includes(search.toLowerCase()) ||
      asset.serial.toLowerCase().includes(search.toLowerCase()) ||
      asset.location.toLowerCase().includes(search.toLowerCase()) ||
      asset.id.toLowerCase().includes(search.toLowerCase());

    return matchesDept && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "يعمل بكفاءة":
        return "bg-[#E5F5E8] text-[#2B7A3D] border-[#CBEAD2]";
      case "يحتاج صيانة":
        return "bg-[#FFF2D6] text-[#B86B00] border-[#F4DCAB]";
      default:
        return "bg-[#FBE6DE] text-[#C9684D] border-[#F1D3C6]";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#E1EBE8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#193B3A]">سجل الأجهزة الطبية والمرافق</h2>
            <span className="bg-[#126B68] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {filtered.length} جهاز
            </span>
          </div>
          <p className="text-xs text-[#738884] mt-0.5">
            تتبع المعدات الحيوية، المعايرة الدورية، وتاريخ الصيانة الوقائية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            aria-label="مسح كود QR للأجهزة"
            className="flex items-center justify-center gap-1.5 bg-[#E9F5F2] hover:bg-[#DDF4F0] text-[#126B68] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#CDE5DF] transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>مسح QR</span>
          </button>
          <button
            onClick={onOpenNewAsset}
            aria-label="إضافة جهاز طبي جديد"
            className="flex items-center justify-center gap-1.5 bg-[#126B68] hover:bg-[#0d5553] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة جهاز جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E1EBE8] space-y-3 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={search}
            aria-label="البحث في الأجهزة والمرافق"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الجهاز، الموديل، الرقم التسلسلي، أو الموقع..."
            className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl py-2.5 pr-10 pl-4 text-xs text-[#193B3A] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68]"
          />
          <Search className="w-4 h-4 text-[#8B9A97] absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Department chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#F0F5F3]">
          <span className="text-[11px] font-bold text-[#738884] ml-1">القسم:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              aria-pressed={department === dept}
              onClick={() => setDepartment(dept)}
              className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                department === dept
                  ? "bg-[#126B68] text-white"
                  : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="workspace-filter-summary">
        <span role="status" aria-live="polite">عرض {filtered.length} من {assets.length} جهاز</span>
        {(search || department !== "الكل") && <button onClick={() => { setSearch(""); setDepartment("الكل"); }}>مسح البحث والفلاتر</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-[#E1EBE8] p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-[#8B9A97] mx-auto" />
            <h4 className="text-sm font-bold text-[#193B3A]">لا توجد أجهزة مطابقة للبحث</h4>
            <p className="text-xs text-[#8B9A97]">تأكد من كتابة الكلمات بشكل صحيح أو اختر قسماً آخر</p>
          </div>
        ) : (
          filtered.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-[#E1EBE8] hover:border-[#126B68] p-4.5 transition-all shadow-xs flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[10px] font-bold bg-[#E9F5F2] text-[#126B68] px-1.5 py-0.5 rounded-md">
                      {asset.id}
                    </span>
                    <h3 className="text-sm font-black text-[#193B3A] mt-1 line-clamp-1">{asset.name}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getStatusBadge(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#5E7772]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B9A97]">الموديل:</span>
                    <span className="font-bold text-[#193B3A]">{asset.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B9A97]">الرقم التسلسلي:</span>
                    <span className="font-mono text-[#193B3A]">{asset.serial}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B9A97]">الموقع:</span>
                    <span className="truncate max-w-[180px] text-[#193B3A] font-medium">{asset.location}</span>
                  </div>
                  {asset.lastMaintenance && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#F0F5F3] text-[11px]">
                      <span className="text-[#8B9A97]">آخر صيانة دورية:</span>
                      <span className="text-[#2B7A3D] font-bold">{asset.lastMaintenance}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-[#F0F5F3] flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectAsset(asset)}
                  className="flex-1 py-1.5 bg-[#F6FAF8] hover:bg-[#E9F5F2] text-[#126B68] text-xs font-bold rounded-xl border border-[#DCE8E5] transition-colors flex items-center justify-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>الملف ورمز QR</span>
                </button>
                <button
                  onClick={() => onReportAsset(asset)}
                  className="py-1.5 px-3 bg-[#FBE6DE] hover:bg-[#f7d6cb] text-[#C9684D] text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                  title="تسجيل بلاغ لهذا الجهاز"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>بلاغ</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
