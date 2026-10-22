import React from "react";
import { X, ExternalLink, Minimize2, Maximize2 } from "lucide-react";

export interface ViewTabItem {
  id: string;
  type: "main" | "report" | "contract";
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  dataId?: string;
}

interface ViewTabBarProps {
  tabs: ViewTabItem[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseAllExtraTabs?: () => void;
  mainTabLabel?: string;
}

export const ViewTabBar: React.FC<ViewTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseAllExtraTabs,
  mainTabLabel = "الرئيسية",
}) => {
  // If there's only the main tab, show a subtle bar or nothing
  if (tabs.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#122624] border border-[#E1EBE8] dark:border-[#1F423E] rounded-2xl p-1 sm:p-1.5 mb-5 shadow-2xs">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full touch-pan-x">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isMain = tab.type === "main";

            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                role="button"
                tabIndex={0}
                aria-current={isActive ? "page" : undefined}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTab(tab.id);
                  }
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none shrink-0 group ${
                  isActive
                    ? "bg-[#126B68] text-white shadow-xs font-black"
                    : "bg-[#F4F8F7] dark:bg-[#16302C] text-[#55706B] dark:text-[#9DBBB4] hover:bg-[#EAF1EF] dark:hover:bg-[#1E433E] border border-transparent hover:border-[#DCE8E5] dark:hover:border-[#244C46]"
                }`}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span className="max-w-[110px] sm:max-w-[180px] md:max-w-[220px] truncate">{tab.title}</span>

                {tab.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      tab.badgeColor
                        ? tab.badgeColor
                        : isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#DCE8E5] dark:bg-[#20423D] text-[#193B3A] dark:text-[#E3F2EE]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}

                {!isMain && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className={`w-4 h-4 rounded-full flex items-center justify-center p-0.5 transition-colors cursor-pointer ${
                      isActive
                        ? "text-white/80 hover:text-white hover:bg-white/20"
                        : "text-[#8B9A97] hover:text-[#C94D4D] hover:bg-red-50 dark:hover:bg-red-950/40"
                    }`}
                    title="إغلاق التبويب"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {onCloseAllExtraTabs && tabs.length > 2 && (
          <button
            type="button"
            onClick={onCloseAllExtraTabs}
            className="text-[10px] text-[#788C88] hover:text-[#C94D4D] dark:text-[#9DBBB4] px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 whitespace-nowrap cursor-pointer transition-colors"
            title="إغلاق كافة التبويبات المفتوحة والعودة للرئيسية"
          >
            إغلاق الكل ({tabs.length - 1})
          </button>
        )}
      </div>
    </div>
  );
};
