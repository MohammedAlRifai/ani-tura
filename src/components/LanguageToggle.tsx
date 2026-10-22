import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { toggleLanguage } from "../i18n";

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "ar";
  const isArabic = currentLang.startsWith("ar");

  const handleToggle = () => {
    toggleLanguage();
  };

  return (
    <button
      id="lang-toggle-btn"
      onClick={handleToggle}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer select-none
        bg-white/10 hover:bg-white/20 text-[#D6E5E1] hover:text-white border-white/15 active:scale-95 shadow-2xs"
      title={isArabic ? "Switch interface to English (للكادر الطبي الأجنبي)" : "تبديل الواجهة إلى العربية"}
      aria-label={isArabic ? "Switch to English" : "تبديل إلى العربية"}
    >
      <Globe className="w-3.5 h-3.5 text-[#4ECDC4] shrink-0" />
      <span className="font-extrabold tracking-wide">
        {isArabic ? "English" : "العربية"}
      </span>
      <span className="text-[9px] px-1 py-0.2 rounded bg-[#126B68] text-[#F4C96B] font-black uppercase">
        {isArabic ? "EN" : "AR"}
      </span>
    </button>
  );
};
