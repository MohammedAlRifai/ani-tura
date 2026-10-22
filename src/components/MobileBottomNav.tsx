import React from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  FileText,
  Building2,
  QrCode,
  Menu,
  Sparkles,
} from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openScanner: () => void;
  onOpenDrawer: () => void;
  urgentReportsCount: number;
  hasPendingSync?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  openScanner,
  onOpenDrawer,
  urgentReportsCount,
  hasPendingSync = false,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-[#102421]/95 backdrop-blur-md border-t border-[#E1EBE8] dark:border-[#1A3B36] shadow-xl px-2 py-1.5 transition-colors"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto relative">
        {/* 1. Dashboard */}
        <button
          onClick={() => setActiveTab("dashboard")}
          aria-current={activeTab === "dashboard" ? "page" : undefined}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer select-none min-w-[56px] ${
            activeTab === "dashboard"
              ? "text-[#126B68] dark:text-[#4ECDC4] font-black"
              : "text-[#637D78] dark:text-[#8AA39F] hover:text-[#193B3A] dark:hover:text-white"
          }`}
        >
          <Activity
            className={`w-5 h-5 transition-transform ${
              activeTab === "dashboard" ? "scale-110 stroke-[2.5]" : ""
            }`}
          />
          <span className="text-[10px] mt-0.5 tracking-tight">الرئيسية</span>
        </button>

        {/* 2. Reports */}
        <button
          onClick={() => setActiveTab("reports")}
          aria-current={activeTab === "reports" ? "page" : undefined}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer select-none min-w-[56px] ${
            activeTab === "reports"
              ? "text-[#126B68] dark:text-[#4ECDC4] font-black"
              : "text-[#637D78] dark:text-[#8AA39F] hover:text-[#193B3A] dark:hover:text-white"
          }`}
        >
          <div className="relative">
            <FileText
              className={`w-5 h-5 transition-transform ${
                activeTab === "reports" ? "scale-110 stroke-[2.5]" : ""
              }`}
            />
            {urgentReportsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#C94D4D] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {urgentReportsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">البلاغات</span>
        </button>

        {/* 3. Center Floating Action: QR Scanner */}
        <div className="relative -top-3 flex flex-col items-center">
          <button
            onClick={openScanner}
            className="w-12 h-12 rounded-2xl bg-[#126B68] hover:bg-[#0e5754] text-white flex items-center justify-center shadow-lg shadow-[#126B68]/30 active:scale-95 transition-all border-2 border-white dark:border-[#102421] cursor-pointer group"
            title="مسح كود QR للأجهزة والمواقع"
            aria-label="مسح كود QR"
          >
            <QrCode className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[9px] font-black text-[#126B68] dark:text-[#4ECDC4] mt-0.5">
            مسح QR
          </span>
        </div>

        {/* 4. Assets */}
        <button
          onClick={() => setActiveTab("assets")}
          aria-current={activeTab === "assets" ? "page" : undefined}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer select-none min-w-[56px] ${
            activeTab === "assets"
              ? "text-[#126B68] dark:text-[#4ECDC4] font-black"
              : "text-[#637D78] dark:text-[#8AA39F] hover:text-[#193B3A] dark:hover:text-white"
          }`}
        >
          <Building2
            className={`w-5 h-5 transition-transform ${
              activeTab === "assets" ? "scale-110 stroke-[2.5]" : ""
            }`}
          />
          <span className="text-[10px] mt-0.5 tracking-tight">الأجهزة</span>
        </button>

        {/* 5. Menu / Drawer Trigger */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer select-none min-w-[56px] text-[#637D78] dark:text-[#8AA39F] hover:text-[#193B3A] dark:hover:text-white"
          aria-label="فتح القائمة الشاملة"
        >
          <div className="relative">
            <Menu className="w-5 h-5" />
            {hasPendingSync && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#102421]" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">القائمة</span>
        </button>
      </div>
    </div>
  );
};
