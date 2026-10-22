import React, { useState, useRef, useEffect } from "react";
import { Moon, Sun, Clock, ChevronDown, Check, Eye } from "lucide-react";
import { ThemePreference } from "../utils/useTheme";

interface ThemeToggleProps {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  isDark: boolean;
  isNightShift: boolean;
  activeReason: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  preference,
  setPreference,
  isDark,
  isNightShift,
  activeReason,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: {
    id: ThemePreference;
    label: string;
    sublabel: string;
    icon: typeof Moon;
    badge?: string;
  }[] = [
    {
      id: "auto",
      label: "تلقائي (الورديات & النظام)",
      sublabel: "ليلي أثناء الوردية الليلية (19:00 - 06:00) أو بحسب نظامك",
      icon: Clock,
      badge: isNightShift ? "وردية ليلية نشطة" : undefined,
    },
    {
      id: "dark",
      label: "النمط الليلي (Dark Mode)",
      sublabel: "ألوان خافتة ومريحة للعين في البيئة الطبية المعتمة",
      icon: Moon,
    },
    {
      id: "light",
      label: "النمط النهاري (Light Mode)",
      sublabel: "ألوان كلاسيكية فاتحة للعمل في وضح النهار",
      icon: Sun,
    },
  ];

  return (
    <div className="relative" ref={containerRef}>
      {/* Quick Trigger Button in Top Header */}
      <div className="flex items-center rounded-full overflow-hidden border border-white/20 bg-white/10 shadow-2xs">
        <button
          id="tour-theme-btn"
          onClick={() => setPreference(isDark ? "light" : "dark")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
            isDark
              ? "bg-[#163532] text-[#F4C96B]"
              : "bg-white/25 text-white"
          }`}
          title={`التبديل بين الفاتح والداكن (الحالي: ${isDark ? "ليلي" : "فاتح"})`}
        >
          {preference === "auto" ? (
            <Clock className="w-3.5 h-3.5 text-[#F4C96B]" />
          ) : isDark ? (
            <Moon className="w-3.5 h-3.5 text-[#F4C96B]" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-[#FDE047]" />
          )}
          <span className="text-[11px]">
            {preference === "auto" ? "تلقائي" : isDark ? "ليلي" : "فاتح"}
          </span>
        </button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-1.5 py-1.5 text-[#D6E5E1] hover:bg-white/20 border-r border-white/15 cursor-pointer"
          title="خيارات إضافية للورديات والوضع التلقائي"
          aria-label="قائمة خيارات المظهر"
        >
          <ChevronDown className="w-3 h-3 text-[#A8C7BF]" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#132A28] border border-[#CDE5DF] dark:border-[#224A45] rounded-2xl shadow-xl z-50 p-2 text-right transition-all animate-fade-in"
          dir="rtl"
        >
          {/* Header Info */}
          <div className="px-3 py-2 border-b border-[#EDF5F2] dark:border-[#1E3F3B] mb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#193B3A] dark:text-[#E2ECE8] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />
                <span>راحة العين & الورديات</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDark
                    ? "bg-[#1E433F] text-[#F4C96B] border border-[#2A5752]"
                    : "bg-[#E9F5F2] text-[#126B68]"
                }`}
              >
                {isDark ? "🌙 مظهر ليلي نشط" : "☀️ مظهر نهاري نشط"}
              </span>
            </div>
            <p className="text-[11px] text-[#6E8883] dark:text-[#8FAAA4] mt-1 leading-snug">
              {activeReason}
            </p>
          </div>

          {/* Options List */}
          <div className="space-y-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = preference === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setPreference(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-right transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#E9F5F2] dark:bg-[#1B3B38] text-[#126B68] dark:text-[#4ECDC4]"
                      : "hover:bg-[#F6FAF8] dark:hover:bg-[#163330] text-[#334D48] dark:text-[#C5DCD6]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-[#126B68] dark:bg-[#204F4B] text-white dark:text-[#F4C96B]"
                        : "bg-[#EEF5F3] dark:bg-[#1E3F3B] text-[#556E69] dark:text-[#8FAAA4]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#126B68] dark:text-[#4ECDC4]" />}
                    </div>
                    <p className="text-[10px] text-[#78918D] dark:text-[#7C9993] mt-0.5 leading-snug">
                      {opt.sublabel}
                    </p>
                    {opt.badge && (
                      <span className="inline-block mt-1 text-[9px] font-bold bg-[#F4C96B]/20 text-[#D97706] dark:text-[#F4C96B] px-1.5 py-0.2 rounded">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
