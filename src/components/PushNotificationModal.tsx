import React, { useState } from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Send,
  Smartphone,
  ShieldCheck,
  Volume2,
  VolumeX,
  RefreshCw,
  X,
  Info,
  Laptop,
  Flame,
  Activity,
  ExternalLink,
} from "lucide-react";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { playNotificationTone } from "../services/pushNotificationService";

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName?: string;
  userRole?: string;
}

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
  staffName = "م. طارق الخالدي",
  userRole = "مهندس أجهزة طبية",
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribersCount,
    activeSubscribers,
    logs,
    preferences,
    subscribe,
    unsubscribe,
    sendTestNotification,
    broadcastAlert,
    updatePreferences,
    refreshStatus,
  } = usePushNotifications();

  const [nameInput, setNameInput] = useState(staffName);
  const [roleInput, setRoleInput] = useState(userRole);
  const [departmentInput, setDepartmentInput] = useState("الهندسة الطبية والصيانة");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState<"عاجل" | "حرج" | "متوسط">("عاجل");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  if (!isOpen) return null;

  const handleToggleSubscription = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      if (isSubscribed) {
        const res = await unsubscribe();
        setStatusMessage({
          text: res.message || "تم إلغاء تفعيل إشعارات الدفع لهذا الجهاز",
          type: res.success ? "success" : "error",
        });
      } else {
        const res = await subscribe({
          staffName: nameInput,
          role: roleInput,
          department: departmentInput,
        });
        setStatusMessage({
          text: res.message,
          type: res.success ? "success" : "error",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: `حدث خطأ: ${err?.message || err}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestNotification = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await sendTestNotification(nameInput);
      setStatusMessage({
        text: "تم إرسال إشعار الدفع التجريبي بنجاح عبر Service Worker! ستلاحظ وصوله للنظام.",
        type: "success",
      });
    } catch (err: any) {
      setStatusMessage({
        text: `تعذر إرسال الإشعار التجريبي: ${err?.message || err}`,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;

    setIsBroadcasting(true);
    setStatusMessage(null);
    try {
      const res = await broadcastAlert({
        title: broadcastTitle,
        body: broadcastBody,
        priority: broadcastPriority,
      });
      setStatusMessage({
        text: res.message || "تم بث نداء الطوارئ لكافة أجهزة الكادر المشتركين بنجاح!",
        type: "success",
      });
      setBroadcastTitle("");
      setBroadcastBody("");
    } catch (err: any) {
      setStatusMessage({
        text: `فشل بث النداء: ${err?.message || err}`,
        type: "error",
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const selectPreset = (title: string, body: string, priority: "عاجل" | "حرج" | "متوسط") => {
    setBroadcastTitle(title);
    setBroadcastBody(body);
    setBroadcastPriority(priority);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#102422] rounded-2xl border border-[#DCE8E5] dark:border-[#1F4540] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EDF4F2] dark:border-[#1E3F3B] bg-gradient-to-r from-[#F2F9F7] to-white dark:from-[#132B28] dark:to-[#102422] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#126B68]/10 dark:bg-[#126B68]/20 flex items-center justify-center text-[#126B68] dark:text-[#38B2AC] shadow-inner">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                  نظام إشعارات الدفع (Web Push Notifications)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#126B68]/10 text-[#126B68] dark:bg-[#126B68]/30 dark:text-[#5EEAD4] border border-[#126B68]/20">
                  Service Worker النشط
                </span>
              </div>
              <p className="text-xs text-[#738884] dark:text-[#9DBBB4] mt-0.5">
                تنبيه الكادر الطبي والهندسي فورياً بالبلاغات الجديدة وتحديثات الحالات حتى عند إغلاق التطبيق
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#738884] dark:text-[#9DBBB4] hover:bg-[#EAEFEF] dark:hover:bg-[#1C3B37] hover:text-[#193B3A] dark:hover:text-white transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-[#FAFDFB] dark:bg-[#0D1E1C] px-5 py-3 border-b border-[#EDF4F2] dark:border-[#1E3F3B] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[#738884] dark:text-[#9DBBB4]">إذن المتصفح:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${
                  permission === "granted"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : permission === "denied"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {permission === "granted" ? "ممنوح (Granted)" : permission === "denied" ? "محظور (Denied)" : "في انتظار الإذن"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#738884] dark:text-[#9DBBB4]">حالة هذا الجهاز:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md ${
                  isSubscribed
                    ? "bg-[#126B68]/15 text-[#126B68] dark:bg-[#126B68]/30 dark:text-[#5EEAD4]"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {isSubscribed ? "مشترك بالخادم ✓" : "غير مشترك"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#738884] dark:text-[#9DBBB4]">الأجهزة المتصلة:</span>
              <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4] bg-white dark:bg-[#16302D] px-2 py-0.5 rounded-md border border-[#DCE8E5] dark:border-[#1F4540]">
                {subscribersCount} أجهزة
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshStatus}
            className="flex items-center gap-1 text-[11px] text-[#5A736F] dark:text-[#9DBBB4] hover:text-[#126B68] dark:hover:text-[#5EEAD4] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث الحالة
          </button>
        </div>

        {/* Notification message feedback */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-medium border-b flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                : statusMessage.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40"
                : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs hover:opacity-70 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm text-[#193B3A] dark:text-[#EDF7F4]">
          {/* Main Subscription Activation Card */}
          <div className="p-4 rounded-xl bg-[#F6FAF8] dark:bg-[#132B28] border border-[#DCE8E5] dark:border-[#1F4540]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#126B68] dark:text-[#38B2AC]" />
                  تفعيل التنبيهات الفورية لهذا الجهاز
                </h3>
                <p className="text-xs text-[#738884] dark:text-[#9DBBB4] mt-1 max-w-xl">
                  عند التفعيل، يقوم الـ Service Worker باستقبال رسائل الدفع عبر بروتوكول VAPID المشفر وعرض إشعار على سطح المكتب أو شاشة قفل الهاتف حتى في حال إغلاق المتصفح.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  disabled={isSubmitting || isLoading}
                  onClick={handleToggleSubscription}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                    isSubscribed
                      ? "bg-rose-500 hover:bg-rose-600 text-white"
                      : "bg-[#126B68] hover:bg-[#0E5451] text-white"
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <X className="w-4 h-4" />
                      إلغاء اشتراك الجهاز
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      تفعيل إشعارات الدفع
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#126B68] dark:text-[#5EEAD4] bg-white dark:bg-[#1A3835] border border-[#126B68]/30 hover:bg-[#EDF7F4] dark:hover:bg-[#1F4540] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="إرسال إشعار تجريبي لاختبار التنبيه والرنين"
                >
                  <Bell className="w-3.5 h-3.5" />
                  تجربة إشعار
                </button>
              </div>
            </div>

            {/* Device Identity form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#DCE8E5]/70 dark:border-[#1F4540]/70 text-xs">
              <div>
                <label className="block text-[#5A736F] dark:text-[#9DBBB4] font-medium mb-1">
                  اسم العضو المناوب:
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#DCE8E5] dark:border-[#1F4540] bg-white dark:bg-[#102422] text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:ring-1 focus:ring-[#126B68]"
                  placeholder="مثال: د. عبد الإله"
                />
              </div>

              <div>
                <label className="block text-[#5A736F] dark:text-[#9DBBB4] font-medium mb-1">
                  الدور الوظيفي:
                </label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#DCE8E5] dark:border-[#1F4540] bg-white dark:bg-[#102422] text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:ring-1 focus:ring-[#126B68]"
                >
                  <option value="مهندس أجهزة طبية">مهندس أجهزة طبية</option>
                  <option value="فني صيانة طبية">فني صيانة طبية</option>
                  <option value="طبيب استشاري">طبيب استشاري</option>
                  <option value="مشرف تمريض">مشرف تمريض</option>
                  <option value="مشرف سلامة وصحة مهنية">مشرف سلامة وصحة مهنية</option>
                  <option value="مدير التشغيل والمرافق">مدير التشغيل والمرافق</option>
                </select>
              </div>

              <div>
                <label className="block text-[#5A736F] dark:text-[#9DBBB4] font-medium mb-1">
                  القسم التابع له:
                </label>
                <select
                  value={departmentInput}
                  onChange={(e) => setDepartmentInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#DCE8E5] dark:border-[#1F4540] bg-white dark:bg-[#102422] text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:ring-1 focus:ring-[#126B68]"
                >
                  <option value="الهندسة الطبية والصيانة">الهندسة الطبية والصيانة</option>
                  <option value="قسم الطوارئ">قسم الطوارئ</option>
                  <option value="العناية المركزة (ICU)">العناية المركزة (ICU)</option>
                  <option value="غرف العمليات الجراحية">غرف العمليات الجراحية</option>
                  <option value="المختبر المركزي وبنك الدم">المختبر المركزي وبنك الدم</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preferences & Sound Tuning */}
          <div className="p-4 rounded-xl border border-[#DCE8E5] dark:border-[#1F4540] bg-white dark:bg-[#102422]">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#126B68] dark:text-[#38B2AC]" />
              تفضيلات أنواع التنبيهات الموجهة للكادر
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-3 p-2.5 rounded-lg bg-[#FAFDFB] dark:bg-[#132B28] border border-[#EDF4F2] dark:border-[#1E3F3B] cursor-pointer hover:border-[#126B68]/30">
                <input
                  type="checkbox"
                  checked={preferences.urgentReports}
                  onChange={(e) => updatePreferences({ urgentReports: e.target.checked })}
                  className="w-4 h-4 rounded text-[#126B68] focus:ring-[#126B68]"
                />
                <div>
                  <span className="font-semibold block text-[#193B3A] dark:text-[#EDF7F4]">
                    البلاغات الجديدة العاجلة والحرجة
                  </span>
                  <span className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                    إشعار فوري عند قيام الممرض أو الطبيب برفع بلاغ عطل
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg bg-[#FAFDFB] dark:bg-[#132B28] border border-[#EDF4F2] dark:border-[#1E3F3B] cursor-pointer hover:border-[#126B68]/30">
                <input
                  type="checkbox"
                  checked={preferences.statusUpdates}
                  onChange={(e) => updatePreferences({ statusUpdates: e.target.checked })}
                  className="w-4 h-4 rounded text-[#126B68] focus:ring-[#126B68]"
                />
                <div>
                  <span className="font-semibold block text-[#193B3A] dark:text-[#EDF7F4]">
                    تحديثات الحالات وملاحظات الفني
                  </span>
                  <span className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                    عند بدء المعالجة أو إضافة ملاحظات الصيانة وإغلاق البلاغ
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg bg-[#FAFDFB] dark:bg-[#132B28] border border-[#EDF4F2] dark:border-[#1E3F3B] cursor-pointer hover:border-[#126B68]/30">
                <input
                  type="checkbox"
                  checked={preferences.lifeSupportAlerts}
                  onChange={(e) => updatePreferences({ lifeSupportAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-[#126B68] focus:ring-[#126B68]"
                />
                <div>
                  <span className="font-semibold block text-[#193B3A] dark:text-[#EDF7F4]">
                    أجهزة حفظ الحياة واستدعاءات SFDA
                  </span>
                  <span className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                    أجهزة التنفس، غسيل الكلى، وتحذيرات هيئة الغذاء والدواء
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg bg-[#FAFDFB] dark:bg-[#132B28] border border-[#EDF4F2] dark:border-[#1E3F3B] cursor-pointer hover:border-[#126B68]/30">
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) => {
                    updatePreferences({ soundEnabled: e.target.checked });
                    if (e.target.checked) playNotificationTone("متوسط");
                  }}
                  className="w-4 h-4 rounded text-[#126B68] focus:ring-[#126B68]"
                />
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="font-semibold block text-[#193B3A] dark:text-[#EDF7F4]">
                      الرنين الصوتي الطبي (Tone Chime)
                    </span>
                    <span className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                      نغمة ثنائية التردد للتنبيه السمعي الفوري
                    </span>
                  </div>
                  {preferences.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#126B68]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Emergency Medical Broadcast Section */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 dark:from-amber-950/20 dark:via-[#102422] dark:to-orange-950/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-[#193B3A] dark:text-[#EDF7F4] flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
                بث نداء طوارئ سريري فوري (Broadcast Alert)
              </h3>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                يصل لـ {subscribersCount} أجهزة مسجلة
              </span>
            </div>
            <p className="text-xs text-[#738884] dark:text-[#9DBBB4] mb-3">
              إرسال رسالة دفع عاجلة وفورية لكافة هواتف ومحطات الكادر الطبي والهندسي في أرجاء المستشفى.
            </p>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-[11px] font-semibold text-[#5A736F] dark:text-[#9DBBB4]">
                نماذج سريعة:
              </span>
              <button
                type="button"
                onClick={() =>
                  selectPreset(
                    "🚨 عطل حرج: جهاز تنفس صناعي ICU-04",
                    "يرجى توجه مهندس الأجهزة المناوب فوراً إلى سرير 04 بالعناية المركزة.",
                    "حرج"
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A3835] border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                تنفس صناعي ICU
              </button>
              <button
                type="button"
                onClick={() =>
                  selectPreset(
                    "⚡ كود أصفر: فحص لوحة طوارئ المولد المركزي",
                    "انتقال مؤقت لخط الديزل الاحتياطي في غرف العمليات. يُطلب فني الكهرباء للمتابعة.",
                    "عاجل"
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A3835] border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                لوحة طوارئ العمليات
              </button>
              <button
                type="button"
                onClick={() =>
                  selectPreset(
                    "⚠️ تنبيه الغذاء والدواء SFDA: مضخات محاليل",
                    "إيقاف احترازي مؤقت لدفعة السيرنجات رقم B-8822 لحين مراجعة المعايرة.",
                    "متوسط"
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A3835] border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                تنبيه دوائي / SFDA
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="عنوان النداء العاجل..."
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-[#102422] text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
                <select
                  value={broadcastPriority}
                  onChange={(e) => setBroadcastPriority(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-[#102422] text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                >
                  <option value="حرج">درجة الأهمية: حرج (Critical)</option>
                  <option value="عاجل">درجة الأهمية: عاجل (Urgent)</option>
                  <option value="متوسط">درجة الأهمية: متوسط (Medium)</option>
                </select>
              </div>

              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="تفاصيل التنبيه الموجه للكادر (الموقع، نوع المشكلة، الإجراء المطلوب)..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-[#102422] text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                required
              />

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isBroadcasting || !broadcastTitle || !broadcastBody}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isBroadcasting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      بث النداء لكافة الأجهزة ({subscribersCount})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* History of Sent Notifications */}
          <div className="p-4 rounded-xl border border-[#DCE8E5] dark:border-[#1F4540] bg-white dark:bg-[#102422]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#126B68] dark:text-[#38B2AC]" />
                سجل رسائل الدفع الأخيرة (Push Audit Logs)
              </h3>
              <span className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
                {logs.length} إشعار مسجل
              </span>
            </div>

            {logs.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#738884] dark:text-[#9DBBB4]">
                لم يتم إرسال أي إشعارات بعد. قم برفع بلاغ جديد أو تجربة إشعار فحص.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {logs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg border border-[#EDF4F2] dark:border-[#1E3F3B] bg-[#FAFDFB] dark:bg-[#132B28] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#193B3A] dark:text-[#EDF7F4] truncate">
                          {log.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {log.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#738884] dark:text-[#9DBBB4] truncate mt-0.5">
                        {log.body}
                      </p>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ {log.successCount} أجهزة
                      </div>
                      <div className="text-[10px] text-[#738884] dark:text-[#9DBBB4]">
                        {new Date(log.sentAt).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Background & Standalone Operational Notice */}
          <div className="p-3.5 rounded-xl bg-[#F0F7F5] dark:bg-[#0E2220] border border-[#126B68]/20 flex items-start gap-3 text-xs">
            <Info className="w-5 h-5 text-[#126B68] dark:text-[#38B2AC] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                كيف تعمل الإشعارات عند إغلاق المتصفح؟
              </span>
              <p className="text-[#5A736F] dark:text-[#9DBBB4] leading-relaxed">
                يعمل ملف <code className="px-1 py-0.5 rounded bg-white dark:bg-[#183633] text-[#126B68] font-mono">sw.js</code> كخادم وسيط مسجل لدى نظام التشغيل (Windows / Android / macOS / iOS). عندما يقوم أي كادر برفع بلاغ جديد أو تحديث حالة صيانة، يبث خادم Express إشعار VAPID مشفر مباشرة إلى نقطة وصول Service Worker فيقوم النظام بإيقاظ جهازك وعرض التنبيه فوراً.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EDF4F2] dark:border-[#1E3F3B] bg-[#FAFDFB] dark:bg-[#0F201E] flex items-center justify-between mt-auto">
          <span className="text-[11px] text-[#738884] dark:text-[#9DBBB4]">
            منظومة عين المستشفى • إدارة الصيانة الطبية والتشغيل الذكي
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#5A736F] dark:text-[#9DBBB4] hover:text-[#193B3A] dark:hover:text-[#EDF7F4] bg-white dark:bg-[#16302D] border border-[#DCE8E5] dark:border-[#1F4540] rounded-xl hover:bg-[#F0F5F3] dark:hover:bg-[#1F423E] transition-colors cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
