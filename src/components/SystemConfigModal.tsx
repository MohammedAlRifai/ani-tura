import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Hash,
  Building2,
  Layers,
  Home,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Download,
  Upload,
  Eye,
  Info,
  QrCode,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { SystemFlexibilityConfig, CodeRuleConfig } from "../types";

interface SystemConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemFlexibilityConfig;
  onSaveConfig: (updatedConfig: SystemFlexibilityConfig) => Promise<boolean> | void;
  onResetDefaults: () => void;
}

export const SystemConfigModal: React.FC<SystemConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<"codes" | "departments" | "categories" | "housing">("codes");
  const [currentConfig, setCurrentConfig] = useState<SystemFlexibilityConfig>(() =>
    JSON.parse(JSON.stringify(config))
  );

  // New item inputs
  const [newDepartment, setNewDepartment] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newReportCategory, setNewReportCategory] = useState("");
  const [newAssetCategory, setNewAssetCategory] = useState("");
  const [newHousingType, setNewHousingType] = useState("");
  const [newHousingStatus, setNewHousingStatus] = useState("");

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(()=>{if(isOpen)setCurrentConfig(structuredClone(config));},[isOpen]);
  if (!isOpen) return null;

  const handleUpdateCodeRule = (
    key: keyof SystemFlexibilityConfig["codeRules"],
    field: keyof CodeRuleConfig,
    value: any
  ) => {
    setCurrentConfig((prev) => {
      const updated = { ...prev };
      const rule = { ...updated.codeRules[key], [field]: value };
      
      // Update example preview automatically
      const seqStr = String(rule.currentSequence).padStart(rule.digits, "0");
      rule.example = `${rule.prefix}${seqStr}${rule.suffix || ""}`;
      
      updated.codeRules = {
        ...updated.codeRules,
        [key]: rule,
      };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    const saved=await onSaveConfig(currentConfig);if(saved===false)return;
    setHasUnsavedChanges(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Add handlers
  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    if (currentConfig.departments.includes(newDepartment.trim())) return;
    setCurrentConfig((prev) => ({
      ...prev,
      departments: [...prev.departments, newDepartment.trim()],
    }));
    setNewDepartment("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveDepartment = (dept: string) => {
    setCurrentConfig((prev) => ({
      ...prev,
      departments: prev.departments.filter((d) => d !== dept),
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    if (currentConfig.hospitalLocations.includes(newLocation.trim())) return;
    setCurrentConfig((prev) => ({
      ...prev,
      hospitalLocations: [...prev.hospitalLocations, newLocation.trim()],
    }));
    setNewLocation("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveLocation = (loc: string) => {
    setCurrentConfig((prev) => ({
      ...prev,
      hospitalLocations: prev.hospitalLocations.filter((l) => l !== loc),
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddReportCategory = () => {
    if (!newReportCategory.trim()) return;
    if (currentConfig.reportCategories.includes(newReportCategory.trim())) return;
    setCurrentConfig((prev) => ({
      ...prev,
      reportCategories: [...prev.reportCategories, newReportCategory.trim()],
    }));
    setNewReportCategory("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveReportCategory = (cat: string) => {
    setCurrentConfig((prev) => ({
      ...prev,
      reportCategories: prev.reportCategories.filter((c) => c !== cat),
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddAssetCategory = () => {
    if (!newAssetCategory.trim()) return;
    if (currentConfig.assetCategories.includes(newAssetCategory.trim())) return;
    setCurrentConfig((prev) => ({
      ...prev,
      assetCategories: [...prev.assetCategories, newAssetCategory.trim()],
    }));
    setNewAssetCategory("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveAssetCategory = (cat: string) => {
    setCurrentConfig((prev) => ({
      ...prev,
      assetCategories: prev.assetCategories.filter((c) => c !== cat),
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddHousingType = () => {
    if (!newHousingType.trim()) return;
    if (currentConfig.housingUnitTypes.includes(newHousingType.trim())) return;
    setCurrentConfig((prev) => ({
      ...prev,
      housingUnitTypes: [...prev.housingUnitTypes, newHousingType.trim()],
    }));
    setNewHousingType("");
    setHasUnsavedChanges(true);
  };

  const handleRemoveHousingType = (type: string) => {
    setCurrentConfig((prev) => ({
      ...prev,
      housingUnitTypes: prev.housingUnitTypes.filter((t) => t !== type),
    }));
    setHasUnsavedChanges(true);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentConfig, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hospital-eye-config-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.codeRules && imported.departments) {
          setCurrentConfig(imported);
          setHasUnsavedChanges(true);
          alert("تم استيراد ملف الإعدادات بنجاح. انقر على «حفظ التعديلات» للتطبيق في النظام.");
        }
      } catch {
        alert("ملف الإعدادات غير صالح");
      }
    };
    reader.readAsText(file);
  };

  const codeRuleList = Object.entries(currentConfig.codeRules) as [
    keyof SystemFlexibilityConfig["codeRules"],
    CodeRuleConfig
  ][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#0E2421] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E1EBE8] dark:border-[#1E3B37] overflow-hidden text-xs">
        <section className="p-4 border-b space-y-2"><h3>أهداف الاستجابة للبلاغات (بالدقائق)</h3><p>إعداد داخلي للمنشأة، لا يمثل معيار اعتماد. يطبق على البلاغات الجديدة بعد الحفظ.</p><div className="flex flex-wrap gap-3">{(["عاجل","متوسط","منخفض"] as const).map(priority=><label key={priority}>{priority}<input type="number" min="1" value={currentConfig.responseTimeMinutes?.[priority]||""} onChange={e=>{setCurrentConfig(prev=>({...prev,responseTimeMinutes:{عاجل:15,متوسط:120,منخفض:1440,...prev.responseTimeMinutes,[priority]:Number(e.target.value)}}));setHasUnsavedChanges(true);}} className="block border rounded-lg p-2 w-28" /></label>)}</div></section>
        {/* Header */}
        <div className="p-5 border-b border-[#EDF4F2] dark:border-[#1A3833] flex items-center justify-between bg-gradient-to-r from-[#F6FAF8] to-white dark:from-[#0E2421] dark:to-[#122E2A]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#126B68]/15 text-[#126B68] dark:text-[#2DD4BF] flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  مركز التحكم وقواعد النظام المرنة
                </h3>
                <span className="bg-[#126B68] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  تحكم شامل ومرن
                </span>
              </div>
              <p className="text-xs text-[#788C88] dark:text-[#8FAAA4] mt-0.5">
                تخصيص قواعد توليد الأكواد، على أي أساس كُتبت، وإدارة كافة الأقسام والتصنيفات بديناميكية تامة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              title="تصدير كملف إعدادات JSON"
              className="p-2 rounded-xl bg-[#F0F5F3] dark:bg-[#163632] hover:bg-[#E3EDE9] text-[#5A736F] dark:text-[#9FB7B2] flex items-center gap-1 font-bold text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تصدير</span>
            </button>
            <label
              title="استيراد إعدادات"
              className="p-2 rounded-xl bg-[#F0F5F3] dark:bg-[#163632] hover:bg-[#E3EDE9] text-[#5A736F] dark:text-[#9FB7B2] flex items-center gap-1 font-bold text-[11px] cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">استيراد</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F0F5F3] dark:bg-[#163632] hover:bg-[#E3EDE9] text-[#5A736F] dark:text-[#9FB7B2] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#EDF4F2] dark:border-[#1A3833] bg-[#FAFDFB] dark:bg-[#0B1E1B] overflow-x-auto">
          <button
            onClick={() => setActiveTab("codes")}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === "codes"
                ? "bg-white dark:bg-[#0E2421] text-[#126B68] dark:text-[#2DD4BF] border-[#126B68] shadow-xs"
                : "border-transparent text-[#788C88] dark:text-[#8FAAA4] hover:text-[#193B3A]"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>قواعد وتوليد الأكواد ({codeRuleList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === "departments"
                ? "bg-white dark:bg-[#0E2421] text-[#126B68] dark:text-[#2DD4BF] border-[#126B68] shadow-xs"
                : "border-transparent text-[#788C88] dark:text-[#8FAAA4] hover:text-[#193B3A]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>الأقسام والمواقع الطبية ({currentConfig.departments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-white dark:bg-[#0E2421] text-[#126B68] dark:text-[#2DD4BF] border-[#126B68] shadow-xs"
                : "border-transparent text-[#788C88] dark:text-[#8FAAA4] hover:text-[#193B3A]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>تصنيفات البلاغات والأجهزة</span>
          </button>
          <button
            onClick={() => setActiveTab("housing")}
            className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === "housing"
                ? "bg-white dark:bg-[#0E2421] text-[#126B68] dark:text-[#2DD4BF] border-[#126B68] shadow-xs"
                : "border-transparent text-[#788C88] dark:text-[#8FAAA4] hover:text-[#193B3A]"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>خيارات السكن والمجمعات</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: CODE GENERATION RULES */}
          {activeTab === "codes" && (
            <div className="space-y-4">
              <div className="bg-[#EBF7F4] dark:bg-[#123632] border border-[#C5E8E0] dark:border-[#1E4D47] rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#126B68] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-[#126B68] dark:text-[#2DD4BF]">
                    على أي أساس تُكتب أكواد النظام؟
                  </h4>
                  <p className="text-[11px] text-[#2C5954] dark:text-[#A7D1C9] leading-relaxed">
                    تمت صياغة كافة الأكواد الافتراضية وفقاً للمرجعيات الصحية المعتمدة بالمملكة (الهيئة العامة للغذاء والدواء SFDA، المركز السعودي لاعتماد المنشآت الصحية CBAHI، وهيئة الزكاة والضريبة والجمارك ZATCA). تتيح لك هذه اللوحة تغيير البادئة (Prefix)، عدد الأرقام، والعداد، ليتم اعتماد الترقيم الجديد فوراً في كافة النوافذ والباركودات.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codeRuleList.map(([key, rule]) => (
                  <div
                    key={key}
                    className="bg-[#F8FCFA] dark:bg-[#122A26] rounded-2xl border border-[#DCE8E5] dark:border-[#1A3D37] p-4.5 space-y-3.5 hover:border-[#126B68] transition-colors shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-[#193B3A] dark:text-[#EDF7F4] text-sm">
                          {rule.name}
                        </h4>
                        <span className="text-[10px] text-[#126B68] dark:text-[#2DD4BF] bg-[#E9F5F2] dark:bg-[#163D37] px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                          المرجع: {rule.standardRef}
                        </span>
                      </div>
                      <div className="text-left bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1E463F] px-2.5 py-1 rounded-xl shadow-xs">
                        <span className="text-[10px] text-[#788C88] block">المعاينة الحية:</span>
                        <span className="font-mono text-xs font-black text-[#126B68] dark:text-[#2DD4BF]">
                          {rule.example}
                        </span>
                      </div>
                    </div>

                    {/* Scientific Rationale */}
                    <div className="bg-white dark:bg-[#0B1E1B] rounded-xl p-2.5 border border-[#EEF3F1] dark:border-[#1A3D37] text-[11px] text-[#55716C] dark:text-[#9ABBB4] leading-relaxed">
                      <strong className="text-[#193B3A] dark:text-[#D1E6E1] block mb-0.5">
                        الأساس المعتمد للصياغة:
                      </strong>
                      <textarea
                        value={rule.rationale}
                        onChange={(e) => handleUpdateCodeRule(key, "rationale", e.target.value)}
                        rows={2}
                        className="w-full bg-[#FAFDFB] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-lg p-1.5 text-[11px] text-[#193B3A] dark:text-[#E2ECE8] focus:outline-none focus:border-[#126B68]"
                      />
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#788C88] dark:text-[#8FAAA4] block">
                          البادئة (Prefix)
                        </label>
                        <input
                          type="text"
                          value={rule.prefix}
                          onChange={(e) => handleUpdateCodeRule(key, "prefix", e.target.value)}
                          className="w-full font-mono font-bold bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#788C88] dark:text-[#8FAAA4] block">
                          عدد الخانات
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={rule.digits}
                          onChange={(e) => handleUpdateCodeRule(key, "digits", parseInt(e.target.value) || 3)}
                          className="w-full font-mono font-bold bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#788C88] dark:text-[#8FAAA4] block">
                          العداد القادم
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={rule.currentSequence}
                          onChange={(e) =>
                            handleUpdateCodeRule(key, "currentSequence", parseInt(e.target.value) || 1)
                          }
                          className="w-full font-mono font-bold bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENTS & LOCATIONS */}
          {activeTab === "departments" && (
            <div className="space-y-6">
              {/* Departments */}
              <div className="bg-[#F8FCFA] dark:bg-[#122A26] rounded-2xl border border-[#DCE8E5] dark:border-[#1A3D37] p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#193B3A] dark:text-[#EDF7F4] text-sm">
                      أقسام ومراكز المستشفى الطبية
                    </h4>
                    <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                      الأقسام المتاحة في القوائم المنسدلة عند تسجيل الأجهزة، البلاغات، والمستخدمين
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#126B68] dark:text-[#2DD4BF] bg-white dark:bg-[#0B1E1B] px-2.5 py-1 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F]">
                    {currentConfig.departments.length} قسم معتمد
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDepartment())}
                    placeholder="اكتب اسم القسم الجديد (مثال: وحدة قسطرة القلب، الرعاية الملطفة)..."
                    className="flex-1 bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    className="px-4 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentConfig.departments.map((dept) => (
                    <div
                      key={dept}
                      className="bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]"
                    >
                      <span>{dept}</span>
                      <button
                        onClick={() => handleRemoveDepartment(dept)}
                        className="text-[#E53E3E] hover:bg-[#FEE2E2] dark:hover:bg-[#451A1A] w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                        title="حذف القسم"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hospital Locations */}
              <div className="bg-[#F8FCFA] dark:bg-[#122A26] rounded-2xl border border-[#DCE8E5] dark:border-[#1A3D37] p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#193B3A] dark:text-[#EDF7F4] text-sm">
                      مواقع ومباني المستشفى (Hospital Locations & Wards)
                    </h4>
                    <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                      المواقع الميدانية لتحديد مكان الأجهزة وبلاغات الأعطال
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#126B68] dark:text-[#2DD4BF] bg-white dark:bg-[#0B1E1B] px-2.5 py-1 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F]">
                    {currentConfig.hospitalLocations.length} موقع
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLocation())}
                    placeholder="اكتب الموقع الجديد (مثال: البرج الجنوبي — الدور الرابع، مبنى بنك الدم)..."
                    className="flex-1 bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className="px-4 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentConfig.hospitalLocations.map((loc) => (
                    <div
                      key={loc}
                      className="bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]"
                    >
                      <span>{loc}</span>
                      <button
                        onClick={() => handleRemoveLocation(loc)}
                        className="text-[#E53E3E] hover:bg-[#FEE2E2] dark:hover:bg-[#451A1A] w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                        title="حذف الموقع"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES & CLASSIFICATIONS */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              {/* Report Categories */}
              <div className="bg-[#F8FCFA] dark:bg-[#122A26] rounded-2xl border border-[#DCE8E5] dark:border-[#1A3D37] p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#193B3A] dark:text-[#EDF7F4] text-sm">
                      تصنيفات بلاغات الصيانة والأعطال
                    </h4>
                    <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                      تصنيفات الأعطال لفرز التذاكر وتوجيهها للفني المختص
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#126B68] dark:text-[#2DD4BF] bg-white dark:bg-[#0B1E1B] px-2.5 py-1 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F]">
                    {currentConfig.reportCategories.length} تصنيف
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReportCategory}
                    onChange={(e) => setNewReportCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddReportCategory())}
                    placeholder="اكتب التصنيف الجديد (مثال: شبكات حاسب وطابعات طبية، تعقيم ومغاسل)..."
                    className="flex-1 bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                  <button
                    type="button"
                    onClick={handleAddReportCategory}
                    className="px-4 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentConfig.reportCategories.map((cat) => (
                    <div
                      key={cat}
                      className="bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]"
                    >
                      <span>{cat}</span>
                      <button
                        onClick={() => handleRemoveReportCategory(cat)}
                        className="text-[#E53E3E] hover:bg-[#FEE2E2] dark:hover:bg-[#451A1A] w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                        title="حذف التصنيف"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asset Categories */}
              <div className="bg-[#F8FCFA] dark:bg-[#122A26] rounded-2xl border border-[#DCE8E5] dark:border-[#1A3D37] p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#193B3A] dark:text-[#EDF7F4] text-sm">
                      تصنيفات الأجهزة الطبية (Medical Device Classes)
                    </h4>
                    <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                      تصنيفات درجة خطورة وتأثير الجهاز الطبي على صحة المريض
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#126B68] dark:text-[#2DD4BF] bg-white dark:bg-[#0B1E1B] px-2.5 py-1 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F]">
                    {currentConfig.assetCategories.length} فئات
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAssetCategory}
                    onChange={(e) => setNewAssetCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAssetCategory())}
                    placeholder="اكتب فئة الأجهزة الجديدة..."
                    className="flex-1 bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                  <button
                    type="button"
                    onClick={handleAddAssetCategory}
                    className="px-4 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentConfig.assetCategories.map((cat) => (
                    <div
                      key={cat}
                      className="bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]"
                    >
                      <span>{cat}</span>
                      <button
                        onClick={() => handleRemoveAssetCategory(cat)}
                        className="text-[#E53E3E] hover:bg-[#FEE2E2] dark:hover:bg-[#451A1A] w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                        title="حذف الفئة"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HOUSING OPTIONS */}
          {activeTab === "housing" && (
            <div className="space-y-6">
              {/* Housing Unit Types */}
              <div className="bg-[#F8FCFA] dark:bg-[#122A26] rounded-2xl border border-[#DCE8E5] dark:border-[#1A3D37] p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#193B3A] dark:text-[#EDF7F4] text-sm">
                      أنواع الوحدات السكنية المعتمدة
                    </h4>
                    <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                      أنواع الشقق والغرف المتاحة لسكن الأطباء والتمريض والكوادر
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#126B68] dark:text-[#2DD4BF] bg-white dark:bg-[#0B1E1B] px-2.5 py-1 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F]">
                    {currentConfig.housingUnitTypes.length} نوع
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHousingType}
                    onChange={(e) => setNewHousingType(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHousingType())}
                    placeholder="اكتب نوع الوحدة السكنية (مثال: شقة ثلاث غرف، بنتهاوس استشاريين)..."
                    className="flex-1 bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                  <button
                    type="button"
                    onClick={handleAddHousingType}
                    className="px-4 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentConfig.housingUnitTypes.map((type) => (
                    <div
                      key={type}
                      className="bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]"
                    >
                      <span>{type}</span>
                      <button
                        onClick={() => handleRemoveHousingType(type)}
                        className="text-[#E53E3E] hover:bg-[#FEE2E2] dark:hover:bg-[#451A1A] w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                        title="حذف النوع"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Housing Statuses */}
              <div className="bg-[#F8FCFA] dark:bg-[#122A26] rounded-2xl border border-[#DCE8E5] dark:border-[#1A3D37] p-4.5 space-y-3">
                <div>
                  <h4 className="font-bold text-[#193B3A] dark:text-[#EDF7F4] text-sm">
                    حالات التسكين الميدانية
                  </h4>
                  <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                    الحالات المستخدمة لتصنيف جاهزية وإشغال الشقق والوحدات
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {currentConfig.housingStatuses.map((st) => (
                    <span
                      key={st}
                      className="bg-white dark:bg-[#0B1E1B] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl px-3 py-1.5 text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-[#EDF4F2] dark:border-[#1A3833] bg-[#FAFDFB] dark:bg-[#0B1E1B] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm("هل أنت متأكد من استعادة كافة القيم الافتراضية الأصلية للنظام؟")) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F] text-[#788C88] dark:text-[#8FAAA4] hover:bg-white dark:hover:bg-[#122A26] font-bold flex items-center gap-1.5 text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الإعدادات الافتراضية</span>
            </button>

            {saveSuccessNotice && (
              <span className="text-[#2B7A3D] dark:text-[#4ADE80] text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ وتطبيق التعديلات بنجاح!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F] text-[#526B66] dark:text-[#9FB7B2] font-bold"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-[#126B68] hover:bg-[#0e5754] text-white font-bold flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق التغييرات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
