import React from "react";
import { X, Check, Shield, User, Wrench, Package, Stethoscope, Award, ShieldCheck, Clock } from "lucide-react";
import { UserProfile, UserRole } from "../types";

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onOpenAuditLog?: (userId?: string) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onOpenAuditLog,
}) => {
  if (!isOpen) return null;

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <Shield className="w-5 h-5 text-[#F4C96B]" />;
      case "biomedical":
        return <Wrench className="w-5 h-5 text-[#60A5FA]" />;
      case "pharmacist":
        return <Package className="w-5 h-5 text-[#34D399]" />;
      case "doctor":
        return <Stethoscope className="w-5 h-5 text-[#FBBF24]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E1EBE8] space-y-4 text-xs text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E9F5F2] text-[#126B68] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#193B3A]">إدارة الحسابات والصلاحيات (RBAC)</h3>
              <p className="text-[11px] text-[#788C88]">تبديل الهوية واستعراض سجل النشاط والرقابة الإدارية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F5F3] hover:bg-[#E3EDE9] flex items-center justify-center text-[#5A736F] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Environment Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
          <span className="font-black block mb-0.5">وضع المعاينة والعرض التجريبي (Demo Mode):</span>
          ميزة التبديل الفوري بين الهويات مخصصة لاختبار وتقييم مصفوفة الصلاحيات الإكلينيكية والإدارية (RBAC). في بيئة الإنتاج الفعلي، يخضع كل موظف لجلسة تسجيل دخول معتمدة ومعزولة.
        </div>
        {onOpenAuditLog && (
          <div className="bg-[#F0F8F6] p-3 rounded-2xl border border-[#C9E0D9] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#126B68] shrink-0" />
              <div>
                <span className="font-black text-[#193B3A] text-xs block">سجل الرقابة الإدارية العام</span>
                <span className="text-[10px] text-[#5A736F]">مراقبة وتدقيق كافة عمليات المستخدمين الموثقة</span>
              </div>
            </div>
            <button
              onClick={() => {
                onOpenAuditLog("all");
                onClose();
              }}
              className="px-3 py-1.5 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
            >
              عرض السجل العام
            </button>
          </div>
        )}

        {/* Roles List */}
        <div className="space-y-3">
          {users.map((u) => {
            const isSelected = u.id === currentUser.id;
            return (
              <div
                key={u.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isSelected
                    ? "bg-[#F0F8F6] border-[#126B68] shadow-xs ring-2 ring-[#126B68]/15"
                    : "bg-white border-[#E1EBE8] hover:border-[#126B68]/50 hover:bg-[#F9FCFB]"
                }`}
              >
                <div
                  onClick={() => {
                    onSelectUser(u);
                    onClose();
                  }}
                  className="flex items-start gap-3.5 cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${u.avatarBg} text-white shadow-xs`}
                  >
                    {getRoleIcon(u.role)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-[#193B3A]">{u.name}</span>
                      {isSelected && (
                        <span className="bg-[#126B68] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          الحساب النشط
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-bold text-[#126B68]">
                      {u.roleTitle} • <span className="text-[#788C88]">{u.department}</span>
                    </div>

                    <p className="text-[11px] text-[#5A736F] leading-relaxed pt-0.5">{u.description}</p>
                  </div>
                </div>

                {/* Account Actions Strip: Switch User + View Audit Log */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAuditLog?.(u.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 text-[#126B68] hover:text-[#0e5754] text-[11px] font-bold rounded-lg border border-[#DCE8E5] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title={`عرض سجل نشاط وعمليات ${u.name}`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#126B68]" />
                    <span>سجل النشاط والعمليات (Audit Log)</span>
                  </button>

                  {!isSelected && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectUser(u);
                        onClose();
                      }}
                      className="text-[11px] font-bold text-[#126B68] hover:underline cursor-pointer"
                    >
                      تفعيل الحساب ←
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Informational note */}
        <div className="bg-[#F8FBFA] p-3 rounded-2xl border border-[#EEF3F1] text-[10px] text-[#738884] space-y-1">
          <span className="font-bold text-[#193B3A] block">عن نظام الصلاحيات المتقدم (RBAC):</span>
          <p>
            يقوم النظام بتكييف التبويبات المتاحة، تنبيهات الإجراءات، والصلاحيات الإدارية والسريرية بناءً على الدور الوظيفي المختار لدعم سلاسة التشغيل ومنع الأخطاء.
          </p>
        </div>
      </div>
    </div>
  );
};
