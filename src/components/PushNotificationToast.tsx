import React, { useEffect, useState, useRef } from "react";
import { BellRing, X, ArrowLeft, AlertCircle } from "lucide-react";

interface PushNotificationToastProps {
  notification: {
    title: string;
    body: string;
    priority?: string;
    data?: {
      reportId?: string;
      url?: string;
      type?: string;
    };
  } | null;
  onClose: () => void;
  onOpenReport?: (reportId: string) => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notification,
  onClose,
  onOpenReport,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onCloseRef.current(), 300);
      }, 9000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  if (!notification || !isVisible) return null;

  const isUrgent =
    notification.priority === "عاجل" ||
    notification.priority === "حرج" ||
    notification.title.includes("عاجل") ||
    notification.title.includes("🚨");

  const reportId = notification.data?.reportId;

  return (
    <div className="fixed top-5 left-5 z-50 max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-top-4 duration-300">
      <div
        className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all ${
          isUrgent
            ? "bg-rose-900/95 text-white border-rose-500/50 shadow-rose-950/40"
            : "bg-[#102422]/95 text-white border-[#1F4540] shadow-black/40"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isUrgent ? "bg-rose-600 text-white animate-bounce" : "bg-[#126B68] text-white"
          }`}
        >
          <BellRing className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isUrgent ? "bg-rose-800 text-rose-100" : "bg-[#1A3835] text-[#5EEAD4]"
              }`}
            >
              إشعار دفع Service Worker
            </span>
            <span className="text-[10px] opacity-70">الآن</span>
          </div>

          <h4 className="font-bold text-sm leading-snug truncate">
            {notification.title}
          </h4>
          <p className="text-xs opacity-90 mt-1 line-clamp-2 leading-relaxed">
            {notification.body}
          </p>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
            {reportId && onOpenReport && (
              <button
                type="button"
                onClick={() => {
                  onOpenReport(reportId);
                  onClose();
                }}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-white text-[#102422] hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                معاينة البلاغ
                <ArrowLeft className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 200);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer mr-auto"
            >
              إغلاق
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 200);
          }}
          className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
