import React, { useState } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  PlusCircle,
  Filter,
  Camera,
  ExternalLink,
  BellRing,
} from "lucide-react";
import { Report, ReportStatus, ReportPriority } from "../types";

interface ReportsViewProps {
  reports: Report[];
  onOpenNewReport: () => void;
  onSelectReport: (report: Report) => void;
  onUpdateStatus: (id: string, newStatus: ReportStatus, notes?: string) => void;
  onOpenPushModal?: () => void;
  isPushSubscribed?: boolean;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  onOpenNewReport,
  onSelectReport,
  onUpdateStatus,
  onOpenPushModal,
  isPushSubscribed = false,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("الكل");
  const [filterPriority, setFilterPriority] = useState<string>("الكل");
  const [search, setSearch] = useState("");

  const filtered = reports.filter((r) => {
    const matchesStatus = filterStatus === "الكل" || r.status === filterStatus;
    const matchesPriority = filterPriority === "الكل" || r.priority === filterPriority;
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getPriorityBadge = (priority: ReportPriority) => {
    switch (priority) {
      case "عاجل":
        return "bg-[#FBE6DE] text-[#C9684D] border-[#F1D3C6]";
      case "متوسط":
        return "bg-[#FFF2D6] text-[#B86B00] border-[#F4DCAB]";
      default:
        return "bg-[#E5F5E8] text-[#2B7A3D] border-[#CBEAD2]";
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "جديد":
        return "bg-[#FFF2D6] text-[#B86B00]";
      case "قيد المعالجة":
        return "bg-[#DDF4F0] text-[#0C756C]";
      case "مغلق":
        return "bg-[#E5F5E8] text-[#2B7A3D]";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#E1EBE8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#193B3A]">إدارة البلاغات والأعطال</h2>
            <span className="bg-[#126B68] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {filtered.length} بلاغ
            </span>
          </div>
          <p className="text-xs text-[#738884] mt-0.5">
            تتبع ومراقبة بلاغات الصيانة، السلامة، والأعطال الفنية للمرافق والأجهزة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPushModal && (
            <button
              onClick={onOpenPushModal}
              className={`flex items-center justify-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all shrink-0 cursor-pointer shadow-2xs ${
                isPushSubscribed
                  ? "bg-[#F0F8F6] text-[#126B68] border-[#BDE0D8] hover:bg-[#E3F2EE]"
                  : "bg-[#FAFDFB] text-[#5A736F] border-[#DCE8E5] hover:bg-[#F0F5F3]"
              }`}
              title="إدارة إشعارات الدفع (Service Worker) لتنبيه الكادر الطبي بالبلاغات"
            >
              <BellRing
                className={`w-4 h-4 ${
                  isPushSubscribed ? "text-[#126B68] animate-pulse" : "text-amber-500"
                }`}
              />
              <span>إشعارات الدفع {isPushSubscribed ? "(نشطة ✓)" : ""}</span>
            </button>
          )}

          <button
            onClick={onOpenNewReport}
            className="flex items-center justify-center gap-2 bg-[#126B68] hover:bg-[#0d5553] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل بلاغ جديد</span>
          </button>
        </div>
      </div>

      {/* Push notification prompt banner if not subscribed */}
      {!isPushSubscribed && onOpenPushModal && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-[#F2F9F7] to-teal-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#126B68]/15 flex items-center justify-center text-[#126B68] shrink-0">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#193B3A] block">
                تابع بلاغاتك أولًا بأول
              </span>
              <p className="text-[#5A736F] text-[11px] mt-0.5">
                احصل على تنبيهات صوتية واهتزازية فورية عند تسجيل بلاغات جديدة أو تحديث حالات الأعطال حتى عند إغلاق المتصفح.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenPushModal}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#126B68] hover:bg-[#0e5754] transition-colors shrink-0 self-start sm:self-center cursor-pointer shadow-xs"
          >
            تفعيل التنبيهات الآن
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E1EBE8] space-y-3 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={search}
            aria-label="البحث في البلاغات"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برقم البلاغ، الموقع، نوع الجهاز، أو الوصف..."
            className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl py-2.5 pr-10 pl-4 text-xs text-[#193B3A] placeholder-[#8B9A97] focus:outline-none focus:border-[#126B68]"
          />
          <Search className="w-4 h-4 text-[#8B9A97] absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status and Priority Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F0F5F3]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#738884] ml-1">الحالة:</span>
            {["الكل", "جديد", "قيد المعالجة", "بانتظار الاعتماد", "مغلق"].map((status) => (
              <button
                key={status}
                aria-pressed={filterStatus === status}
                onClick={() => setFilterStatus(status)}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                  filterStatus === status
                    ? "bg-[#126B68] text-white"
                    : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#738884] ml-1">الأولوية:</span>
            {["الكل", "عاجل", "متوسط", "منخفض"].map((pri) => (
              <button
                key={pri}
                aria-pressed={filterPriority === pri}
                onClick={() => setFilterPriority(pri)}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                  filterPriority === pri
                    ? "bg-[#193B3A] text-white"
                    : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
                }`}
              >
                {pri}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="workspace-filter-summary">
        <span role="status" aria-live="polite">عرض {filtered.length} من {reports.length} بلاغ</span>
        {(search || filterStatus !== "الكل" || filterPriority !== "الكل") && <button onClick={() => { setSearch(""); setFilterStatus("الكل"); setFilterPriority("الكل"); }}>مسح البحث والفلاتر</button>}
      </div>
      {/* Reports List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E1EBE8] p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-[#8B9A97] mx-auto" />
            <h4 className="text-sm font-bold text-[#193B3A]">لا توجد بلاغات مطابقة</h4>
            <p className="text-xs text-[#8B9A97]">جرب تغيير شروط البحث أو الفلاتر أعلاه</p>
          </div>
        ) : (
          filtered.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-[#E1EBE8] hover:border-[#126B68] p-4.5 transition-all shadow-xs space-y-3"
            >
              <p className="text-xs">{report.assignedEngineer?`مسند إلى: ${report.assignedEngineer}`:"بانتظار الإسناد"}{report.responseDueAt&&` · هدف الاستجابة: ${new Date(report.responseDueAt).toLocaleString("ar-SA")}`}{report.responseDueAt&&!report.startedAt&&new Date(report.responseDueAt).getTime()<Date.now()&&report.status!=="مغلق"&&" · تجاوز هدف الاستجابة"}</p>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-[#E9F5F2] text-[#126B68] px-2 py-0.5 rounded-md">
                      {report.id}
                    </span>
                    <h3
                      onClick={() => onSelectReport(report)}
                      className="text-sm font-black text-[#193B3A] cursor-pointer hover:text-[#126B68] transition-colors"
                    >
                      {report.title}
                    </h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getPriorityBadge(report.priority)}`}>
                      {report.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#526B66] leading-relaxed">{report.description}</p>
                </div>

                {report.imageUri && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#DCE8E5] shrink-0">
                    <img src={report.imageUri} alt="مرفق البلاغ" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {report.technicianNotes && (
                <div className="bg-[#F8FBFA] border-r-2 border-[#126B68] p-2.5 rounded-lg text-xs text-[#45615D]">
                  <span className="font-bold text-[#193B3A]">ملاحظات الفني: </span>
                  {report.technicianNotes}
                </div>
              )}

              {/* Footer Meta & Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-[#F0F5F3] text-xs">
                <div className="flex items-center gap-3 text-[#788C88] flex-wrap text-[11px]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#126B68]" />
                    {report.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(report.createdAt).toLocaleDateString("ar-SA", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-[#126B68]">{report.category}</span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {report.status === "جديد" && (
                    <button
                      onClick={() => onUpdateStatus(report.id, "قيد المعالجة")}
                      className="px-2.5 py-1 bg-[#DDF4F0] hover:bg-[#c9eee8] text-[#0C756C] font-bold text-[11px] rounded-lg transition-colors"
                    >
                      بدء المعالجة
                    </button>
                  )}
                  {report.status === "قيد المعالجة" && (
                    <button
                      onClick={() => onSelectReport(report)}
                      className="px-2.5 py-1 bg-[#E5F5E8] hover:bg-[#d2edd7] text-[#2B7A3D] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      استكمال أمر العمل
                    </button>
                  )}
                  <button
                    onClick={() => onSelectReport(report)}
                    className="px-2.5 py-1 bg-[#F0F5F3] hover:bg-[#E1EBE8] text-[#193B3A] font-bold text-[11px] rounded-lg transition-colors"
                  >
                    تفاصيل
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
