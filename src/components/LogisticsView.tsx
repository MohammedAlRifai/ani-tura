import React, { useState, useMemo } from "react";
import {
  Truck,
  Building,
  Users,
  MapPin,
  Calendar,
  PlusCircle,
  CheckCircle2,
  Clock,
  Home,
  Wrench,
  AlertCircle,
  Edit2,
  Trash2,
  Search,
  Filter,
  UserCheck,
  UserX,
  Phone,
  Layers,
  Sparkles,
  Sliders,
  X,
} from "lucide-react";
import { Compound, HousingUnit, TransportRequest, ServiceRequest } from "../types";

interface LogisticsViewProps {
  compounds: Compound[];
  housingUnits: HousingUnit[];
  transportRequests: TransportRequest[];
  serviceRequests: ServiceRequest[];
  onAddCompound: (compound: Compound) => Promise<boolean | void> | void;
  onUpdateCompound: (compound: Compound) => Promise<boolean | void> | void;
  onDeleteCompound: (id: string) => Promise<boolean | void> | void;
  onAddHousingUnit: (unit: HousingUnit) => Promise<boolean | void> | void;
  onUpdateHousingUnit: (unit: HousingUnit) => Promise<boolean | void> | void;
  onDeleteHousingUnit: (id: string) => Promise<boolean | void> | void;
  onAddServiceRequest: (req: ServiceRequest) => Promise<boolean | void> | void;
  onUpdateServiceRequestStatus: (id: string, status: string) => Promise<boolean | void> | void;
  onAddTransportRequest: (req: Omit<TransportRequest, "id" | "date">) => Promise<boolean | void> | void;
  onUpdateTransportRequestStatus?: (id: string, status: "جديد" | "مخصص" | "مكتمل") => Promise<boolean | void> | void;
  housingUnitTypes?: string[];
  housingStatuses?: string[];
  onOpenSystemConfig?: () => Promise<boolean | void> | void;
}

export const LogisticsView: React.FC<LogisticsViewProps> = ({
  compounds,
  housingUnits,
  transportRequests,
  serviceRequests,
  onAddCompound,
  onUpdateCompound,
  onDeleteCompound,
  onAddHousingUnit,
  onUpdateHousingUnit,
  onDeleteHousingUnit,
  onAddServiceRequest,
  onUpdateServiceRequestStatus,
  onAddTransportRequest,
  onUpdateTransportRequestStatus,
  housingUnitTypes = ["شقة سكنية (عائلية)", "استوديو فردي", "فيلا كوادر قيادية", "جناح أطباء مناوبين", "سكن تمريض مشترك"],
  housingStatuses = ["مشغولة", "شاغرة", "صيانة وترميم", "محجوزة لوصول جديد"],
  onOpenSystemConfig,
}) => {
  const [activeTab, setActiveTab] = useState<"housing" | "transport" | "services">("housing");

  // Filter & Search states for housing units
  const [selectedCompoundFilter, setSelectedCompoundFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCompoundModalOpen, setIsCompoundModalOpen] = useState(false);
  const [editingCompound, setEditingCompound] = useState<Compound | null>(null);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<HousingUnit | null>(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newTransportModal, setNewTransportModal] = useState(false);

  // Compound form state
  const [compoundName, setCompoundName] = useState("");
  const [compoundAddress, setCompoundAddress] = useState("");
  const [compoundUnits, setCompoundUnits] = useState(20);
  const [compoundManager, setCompoundManager] = useState("");
  const [compoundPhone, setCompoundPhone] = useState("");
  const [compoundStatus, setCompoundStatus] = useState("نشط");

  // Unit form state
  const [unitCode, setUnitCode] = useState("");
  const [unitCompound, setUnitCompound] = useState("");
  const [unitType, setUnitType] = useState(housingUnitTypes[0] || "شقة");
  const [unitCapacity, setUnitCapacity] = useState(2);
  const [unitOccupants, setUnitOccupants] = useState(0);
  const [unitStatus, setUnitStatus] = useState("شاغرة");
  const [unitEmployee, setUnitEmployee] = useState("");
  const [unitDepartment, setUnitDepartment] = useState("");
  const [unitPhone, setUnitPhone] = useState("");
  const [unitNotes, setUnitNotes] = useState("");

  // Service request form state
  const [srvTitle, setSrvTitle] = useState("");
  const [srvLocation, setSrvLocation] = useState("");
  const [srvCategory, setSrvCategory] = useState<"نظافة" | "صيانة" | "أمن" | "تموين">("صيانة");
  const [srvPriority, setSrvPriority] = useState<"عاجل" | "عادي">("عادي");

  // Transport form state
  const [title, setTitle] = useState("");
  const [requester, setRequester] = useState("");
  const [route, setRoute] = useState("");
  const [priority, setPriority] = useState<"عاجل" | "مجدول" | "منخفض">("مجدول");
  const [passengers, setPassengers] = useState(4);

  // Compound Modal Open Helpers
  const openNewCompoundModal = () => {
    setEditingCompound(null);
    setCompoundName("");
    setCompoundAddress("");
    setCompoundUnits(24);
    setCompoundManager("");
    setCompoundPhone("");
    setCompoundStatus("نشط");
    setIsCompoundModalOpen(true);
  };

  const openEditCompoundModal = (comp: Compound) => {
    setEditingCompound(comp);
    setCompoundName(comp.name);
    setCompoundAddress(comp.address);
    setCompoundUnits(comp.units);
    setCompoundManager(comp.manager);
    setCompoundPhone(comp.phone || "");
    setCompoundStatus(comp.status);
    setIsCompoundModalOpen(true);
  };

  const handleSaveCompound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compoundName.trim()) return;

    if (editingCompound) {
      const saved=await onUpdateCompound({
        ...editingCompound,
        name: compoundName.trim(),
        address: compoundAddress.trim(),
        units: compoundUnits,
        manager: compoundManager.trim() || "مشرف الإسكان",
        phone: compoundPhone.trim() || undefined,
        status: compoundStatus,
      });
      if(saved===false)return;
    } else {
      const newCompound: Compound = {
        id: `CMP-${Date.now().toString().slice(-4)}`,
        name: compoundName.trim(),
        address: compoundAddress.trim() || "الحرم الطبي",
        units: compoundUnits,
        occupied: 0,
        manager: compoundManager.trim() || "مشرف الإسكان",
        phone: compoundPhone.trim() || undefined,
        status: compoundStatus,
      };
      const saved=await onAddCompound(newCompound);
      if(saved===false)return;
    }
    setIsCompoundModalOpen(false);
  };

  // Housing Unit Modal Open Helpers
  const openNewUnitModal = () => {
    setEditingUnit(null);
    setUnitCode("");
    setUnitCompound(compounds[0]?.name || "سكن الكوادر الطبية");
    setUnitType(housingUnitTypes[0] || "شقة سكنية (عائلية)");
    setUnitCapacity(2);
    setUnitOccupants(0);
    setUnitStatus("شاغرة");
    setUnitEmployee("");
    setUnitDepartment("");
    setUnitPhone("");
    setUnitNotes("");
    setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (unit: HousingUnit) => {
    setEditingUnit(unit);
    setUnitCode(unit.unit);
    setUnitCompound(unit.compound);
    setUnitType(unit.type);
    setUnitCapacity(unit.capacity);
    setUnitOccupants(unit.occupants);
    setUnitStatus(unit.status);
    setUnitEmployee(unit.employee || "");
    setUnitDepartment(unit.department || "");
    setUnitPhone(unit.phone || "");
    setUnitNotes(unit.notes || "");
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode.trim()) return;

    const isOccupied = unitStatus === "مشغولة" || (unitEmployee.trim().length > 0 && unitStatus !== "صيانة وترميم" && unitStatus !== "صيانة");
    const effStatus = unitEmployee.trim().length > 0 && unitStatus === "شاغرة" ? "مشغولة" : unitStatus;
    const effOccupants = isOccupied ? Math.max(1, unitOccupants || 1) : 0;

    if (editingUnit) {
      const saved=await onUpdateHousingUnit({
        ...editingUnit,
        unit: unitCode.trim(),
        compound: unitCompound,
        type: unitType,
        capacity: unitCapacity,
        occupants: effOccupants,
        status: effStatus,
        employee: unitEmployee.trim() || undefined,
        department: unitDepartment.trim() || undefined,
        phone: unitPhone.trim() || undefined,
        notes: unitNotes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      });
      if(saved===false)return;
    } else {
      const newUnit: HousingUnit = {
        id: `U-${Date.now().toString().slice(-5)}`,
        compound: unitCompound,
        unit: unitCode.trim(),
        type: unitType,
        capacity: unitCapacity,
        occupants: effOccupants,
        status: effStatus,
        employee: unitEmployee.trim() || undefined,
        department: unitDepartment.trim() || undefined,
        phone: unitPhone.trim() || undefined,
        notes: unitNotes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      const saved=await onAddHousingUnit(newUnit);
      if(saved===false)return;
    }
    setIsUnitModalOpen(false);
  };

  // Quick Check-out action
  const handleQuickCheckout = (unit: HousingUnit) => {
    if (confirm(`هل أنت متأكد من إخلاء الوحدة «${unit.unit}» وتحويل حالتها إلى شاغرة؟`)) {
      onUpdateHousingUnit({
        ...unit,
        employee: undefined,
        department: undefined,
        phone: undefined,
        occupants: 0,
        status: "شاغرة",
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Service Request Handler
  const handleCreateServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;

    const newReq: ServiceRequest = {
      id: `SR-${Date.now().toString().slice(-4)}`,
      title: srvTitle.trim(),
      location: srvLocation.trim() || "مجمع السكن الطبي",
      category: srvCategory,
      priority: srvPriority,
      status: "جديد",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    const saved=await onAddServiceRequest(newReq);
      if(saved===false)return;
    setSrvTitle("");
    setSrvLocation("");
    setIsServiceModalOpen(false);
  };

  // Transport Request Handler
  const handleCreateTransport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !route.trim()) return;

    const saved=await onAddTransportRequest({
      title: title.trim(),
      requester: requester.trim() || "إدارة العمليات",
      route: route.trim(),
      priority,
      status: "جديد",
      passengers,
    });
    if(saved===false)return;

    setTitle("");
    setRequester("");
    setRoute("");
    setNewTransportModal(false);
  };

  // Filter housing units
  const filteredUnits = useMemo(() => {
    return housingUnits.filter((unit) => {
      const matchCompound = selectedCompoundFilter === "all" || unit.compound === selectedCompoundFilter;
      const matchStatus = selectedStatusFilter === "all" || unit.status === selectedStatusFilter;
      const matchSearch =
        !searchQuery.trim() ||
        unit.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.compound.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (unit.employee && unit.employee.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (unit.department && unit.department.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCompound && matchStatus && matchSearch;
    });
  }, [housingUnits, selectedCompoundFilter, selectedStatusFilter, searchQuery]);

  // Total stats for housing
  const totalOccupied = housingUnits.filter((u) => u.status === "مشغولة").length;
  const totalVacant = housingUnits.filter((u) => u.status === "شاغرة").length;
  const totalMaintenance = housingUnits.filter((u) => u.status === "صيانة" || u.status === "صيانة وترميم").length;

  return (
    <div className="space-y-6 pb-12 text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0E2421] p-5 rounded-3xl border border-[#E1EBE8] dark:border-[#1E3B37] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#193B3A] dark:text-[#EDF7F4]">
              إدارة السكن وأسطول النقل والخدمات
            </h2>
            <span className="bg-[#126B68] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              تحكم كامل
            </span>
          </div>
          <p className="text-xs text-[#738884] dark:text-[#8FAAA4] mt-0.5">
            تسكين الكادر الطبي، تخصيص الوحدات، إدارة مجمعات الإسكان، ومتابعة الصيانة اللوجستية
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSystemConfig && (
            <button
              onClick={onOpenSystemConfig}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-[#EBF7F4] dark:bg-[#163D37] text-[#126B68] dark:text-[#2DD4BF] hover:bg-[#DDF4F0] flex items-center gap-1.5 transition-colors border border-[#C5E8E0] dark:border-[#1F4E46]"
              title="تخصيص قواعد النظام وقوائم الأقسام"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>إعدادات النظام المرنة</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-[#F0F5F3] dark:bg-[#163632] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("housing")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "housing"
                  ? "bg-[#126B68] text-white shadow-xs"
                  : "text-[#5A736F] dark:text-[#9FB7B2] hover:text-[#193B3A]"
              }`}
            >
              سكن الكوادر ({housingUnits.length})
            </button>
            <button
              onClick={() => setActiveTab("transport")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "transport"
                  ? "bg-[#126B68] text-white shadow-xs"
                  : "text-[#5A736F] dark:text-[#9FB7B2] hover:text-[#193B3A]"
              }`}
            >
              أسطول النقل ({transportRequests.length})
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "services"
                  ? "bg-[#126B68] text-white shadow-xs"
                  : "text-[#5A736F] dark:text-[#9FB7B2] hover:text-[#193B3A]"
              }`}
            >
              خدمات المرافق ({serviceRequests.length})
            </button>
          </div>
        </div>
      </div>

      {/* HOUSING TAB */}
      {activeTab === "housing" && (
        <div className="space-y-6">
          {/* Housing Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#0E2421] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1E3B37] shadow-xs">
              <span className="text-[11px] text-[#788C88] dark:text-[#8FAAA4] block font-bold">
                إجمالي الوحدات السكنية
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  {housingUnits.length}
                </span>
                <span className="text-[10px] text-[#788C88]">في {compounds.length} مجمعات</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0E2421] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1E3B37] shadow-xs">
              <span className="text-[11px] text-[#0C756C] dark:text-[#2DD4BF] block font-bold">
                الوحدات المشغولة (أطباء وتمريض)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#0C756C] dark:text-[#2DD4BF]">
                  {totalOccupied}
                </span>
                <span className="text-[10px] text-[#0C756C]/80">
                  {housingUnits.length ? Math.round((totalOccupied / housingUnits.length) * 100) : 0}% إشغال
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0E2421] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1E3B37] shadow-xs">
              <span className="text-[11px] text-[#2B7A3D] dark:text-[#4ADE80] block font-bold">
                الوحدات الشاغرة الجاهزة
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#2B7A3D] dark:text-[#4ADE80]">
                  {totalVacant}
                </span>
                <span className="text-[10px] text-[#2B7A3D]/80">متاحة للتسكين الفوري</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0E2421] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1E3B37] shadow-xs">
              <span className="text-[11px] text-[#B86B00] dark:text-[#FBBF24] block font-bold">
                تحت الصيانة والتجهيز
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#B86B00] dark:text-[#FBBF24]">
                  {totalMaintenance}
                </span>
                <span className="text-[10px] text-[#B86B00]/80">تجهيز ومفروشات</span>
              </div>
            </div>
          </div>

          {/* Compounds Cards with Edit / Add */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  مجمعات الإسكان الطبي المعتمدة ({compounds.length})
                </h3>
                <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                  المجمعات التابعة للمستشفى مع نسب الإشغال والوحدات المتاحة
                </p>
              </div>
              <button
                type="button"
                onClick={openNewCompoundModal}
                className="px-3.5 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة مجمع سكني</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compounds.map((comp) => {
                const compUnits = housingUnits.filter((u) => u.compound === comp.name);
                const actualCount = compUnits.length > 0 ? compUnits.length : comp.units;
                const actualOccupied = compUnits.length > 0
                  ? compUnits.filter((u) => u.status === "مشغولة").length
                  : comp.occupied;
                const occupancyPct = actualCount > 0 ? Math.round((actualOccupied / actualCount) * 100) : 0;

                return (
                  <div
                    key={comp.id}
                    className="bg-white dark:bg-[#0E2421] rounded-3xl border border-[#E1EBE8] dark:border-[#1E3B37] p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#E9F5F2] dark:bg-[#163D37] text-[#126B68] dark:text-[#2DD4BF] flex items-center justify-center">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4]">
                              {comp.name}
                            </h3>
                            <span className="font-mono text-[10px] text-[#788C88] bg-[#F0F5F3] dark:bg-[#163632] px-1.5 py-0.5 rounded">
                              {comp.id}
                            </span>
                          </div>
                          <p className="text-xs text-[#788C88] dark:text-[#8FAAA4] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#126B68]" />
                            {comp.address}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E5F5E8] dark:bg-[#133824] text-[#2B7A3D] dark:text-[#4ADE80]">
                          {comp.status}
                        </span>
                        <button
                          onClick={() => openEditCompoundModal(comp)}
                          className="p-1.5 rounded-lg text-[#5A736F] dark:text-[#9FB7B2] hover:bg-[#F0F5F3] dark:hover:bg-[#163632] transition-colors"
                          title="تعديل بيانات المجمع"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف مجمع «${comp.name}»؟`)) {
                              onDeleteCompound(comp.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#E53E3E] hover:bg-[#FEE2E2] dark:hover:bg-[#451A1A] transition-colors"
                          title="حذف المجمع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5 bg-[#F8FBFA] dark:bg-[#122A26] p-3 rounded-2xl border border-[#EEF3F1] dark:border-[#1A3D37]">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6E8581] dark:text-[#8FAAA4] font-bold">
                          نسبة الإشغال الإجمالية:
                        </span>
                        <span className="font-extrabold text-[#126B68] dark:text-[#2DD4BF]">
                          {occupancyPct}%
                        </span>
                      </div>
                      <div className="w-full bg-[#E1EBE8] dark:bg-[#1D443E] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#126B68] dark:bg-[#2DD4BF] h-full rounded-full transition-all"
                          style={{ width: `${occupancyPct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#8B9A97] dark:text-[#7A9892] pt-1">
                        <span>الوحدات المشغولة: {actualOccupied}</span>
                        <span>الوحدات المتاحة: {Math.max(0, actualCount - actualOccupied)}</span>
                        <span>إجمالي الوحدات: {actualCount}</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#788C88] dark:text-[#8FAAA4] flex items-center justify-between pt-1">
                      <span>مشرف المجمع: {comp.manager} {comp.phone ? `(${comp.phone})` : ""}</span>
                      <button
                        onClick={() => setSelectedCompoundFilter(comp.name)}
                        className="text-[#126B68] dark:text-[#2DD4BF] font-bold hover:underline"
                      >
                        عرض شقق المجمع ←
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Housing Units Management Table & Filters */}
          <div className="bg-white dark:bg-[#0E2421] rounded-3xl border border-[#E1EBE8] dark:border-[#1E3B37] overflow-hidden shadow-xs space-y-3">
            {/* Table Control Header */}
            <div className="p-4 border-b border-[#EEF3F1] dark:border-[#1A3833] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFDFB] dark:bg-[#0B1E1B]">
              <div>
                <h3 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  الوحدات السكنية للكادر الطبي ({filteredUnits.length} وحدة)
                </h3>
                <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                  توزيع الكوادر، بيانات التسكين، وتعديل حالة الشقق فورياً
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openNewUnitModal}
                  className="px-3.5 py-2 bg-[#126B68] hover:bg-[#0e5754] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة وحدة سكنية</span>
                </button>
              </div>
            </div>

            {/* Filters bar */}
            <div className="p-3 px-4 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8B9A97] absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث برقم الوحدة، اسم الطبيب، القسم، أو المجمع..."
                  className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl pr-9 pl-3 py-2 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCompoundFilter}
                  onChange={(e) => setSelectedCompoundFilter(e.target.value)}
                  className="bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl px-3 py-2 text-xs text-[#193B3A] dark:text-[#EDF7F4] font-bold focus:outline-none focus:border-[#126B68]"
                >
                  <option value="all">كافة المجمعات السكنية</option>
                  {compounds.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl px-3 py-2 text-xs text-[#193B3A] dark:text-[#EDF7F4] font-bold focus:outline-none focus:border-[#126B68]"
                >
                  <option value="all">كافة الحالات</option>
                  <option value="مشغولة">مشغولة</option>
                  <option value="شاغرة">شاغرة</option>
                  <option value="صيانة">صيانة</option>
                  <option value="محجوزة">محجوزة</option>
                </select>
              </div>
            </div>

            {/* Units List */}
            <div className="divide-y divide-[#EEF3F1] dark:divide-[#1A3833]">
              {filteredUnits.length === 0 ? (
                <div className="p-8 text-center text-[#788C88] dark:text-[#8FAAA4] space-y-2">
                  <Home className="w-8 h-8 mx-auto text-[#CBDAD5]" />
                  <p className="font-bold">لا توجد وحدات سكنية مطابقة للبحث أو التصفية الحالية</p>
                  <button
                    onClick={() => {
                      setSelectedCompoundFilter("all");
                      setSelectedStatusFilter("all");
                      setSearchQuery("");
                    }}
                    className="text-[#126B68] dark:text-[#2DD4BF] font-bold underline text-xs"
                  >
                    إعادة ضبط عوامل التصفية
                  </button>
                </div>
              ) : (
                filteredUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F9FCFB] dark:hover:bg-[#122A26] transition-colors text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#193B3A] dark:text-[#EDF7F4]">
                          {unit.unit}
                        </span>
                        <span className="text-[10px] bg-[#F0F5F3] dark:bg-[#163632] px-2 py-0.5 rounded-md text-[#526B66] dark:text-[#9FB7B2] font-bold">
                          {unit.type}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            unit.status === "مشغولة"
                              ? "bg-[#DDF4F0] dark:bg-[#0F3833] text-[#0C756C] dark:text-[#2DD4BF]"
                              : unit.status === "شاغرة"
                              ? "bg-[#E5F5E8] dark:bg-[#133824] text-[#2B7A3D] dark:text-[#4ADE80]"
                              : "bg-[#FFF2D6] dark:bg-[#3D2D0C] text-[#B86B00] dark:text-[#FBBF24]"
                          }`}
                        >
                          {unit.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4] flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-[#126B68]" />
                        <span>{unit.compound}</span>
                      </p>

                      {unit.employee ? (
                        <div className="flex items-center gap-3 pt-0.5 text-[11px]">
                          <span className="text-[#126B68] dark:text-[#2DD4BF] font-bold flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>الشاغل: {unit.employee}</span>
                          </span>
                          {unit.department && (
                            <span className="text-[#788C88] dark:text-[#8FAAA4]">
                              ({unit.department})
                            </span>
                          )}
                          {unit.phone && (
                            <span className="text-[#788C88] dark:text-[#8FAAA4] flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{unit.phone}</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#2B7A3D] dark:text-[#4ADE80] font-bold">
                          الوحدة جاهزة للتسكين الفوري
                        </p>
                      )}

                      {unit.notes && (
                        <p className="text-[11px] text-[#8B9A97] dark:text-[#7A9892] italic">
                          ملاحظة: {unit.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 sm:self-center shrink-0">
                      <div className="text-left text-[11px] text-[#8B9A97] dark:text-[#8FAAA4]">
                        <span className="block font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                          {unit.occupants} / {unit.capacity} فرد
                        </span>
                        <span>السعة القصوى</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {unit.employee && (
                          <button
                            onClick={() => handleQuickCheckout(unit)}
                            title="إخلاء الوحدة السكنية"
                            className="p-1.5 rounded-lg text-[#D97706] hover:bg-[#FEF3C7] dark:hover:bg-[#45320F] transition-colors"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditUnitModal(unit)}
                          title="تعديل بيانات الوحدة"
                          className="p-1.5 rounded-lg text-[#126B68] dark:text-[#2DD4BF] hover:bg-[#E9F5F2] dark:hover:bg-[#163D37] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف الوحدة «${unit.unit}» نهائياً؟`)) {
                              onDeleteHousingUnit(unit.id);
                            }
                          }}
                          title="حذف الوحدة"
                          className="p-1.5 rounded-lg text-[#E53E3E] hover:bg-[#FEE2E2] dark:hover:bg-[#451A1A] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRANSPORT TAB */}
      {activeTab === "transport" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#F6FAF8] dark:bg-[#122A26] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1E3B37]">
            <div>
              <h3 className="text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                رحلات أسطول النقل المجدولة والعاجلة
              </h3>
              <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                تأمين نقل مناوبات الكوادر وعينات المختبر بين المجمعات والمستشفى
              </p>
            </div>
            <button
              onClick={() => setNewTransportModal(true)}
              className="px-4 py-2 bg-[#126B68] hover:bg-[#0d5553] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>طلب رحلة نقل</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transportRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-[#0E2421] rounded-2xl border border-[#E1EBE8] dark:border-[#1E3B37] p-4.5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] bg-[#E9F5F2] dark:bg-[#163D37] text-[#126B68] dark:text-[#2DD4BF] font-bold px-1.5 py-0.5 rounded-md">
                      {req.id}
                    </span>
                    <h4 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4] mt-1">
                      {req.title}
                    </h4>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      req.status === "مكتمل"
                        ? "bg-[#E5F5E8] dark:bg-[#133824] text-[#2B7A3D] dark:text-[#4ADE80]"
                        : req.status === "مخصص"
                        ? "bg-[#DDF4F0] dark:bg-[#0F3833] text-[#0C756C] dark:text-[#2DD4BF]"
                        : "bg-[#FFF2D6] dark:bg-[#3D2D0C] text-[#B86B00] dark:text-[#FBBF24]"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="space-y-1 text-[#788C88] dark:text-[#8FAAA4] text-[11px]">
                  <p className="flex items-center gap-1 text-[#193B3A] dark:text-[#EDF7F4] font-bold">
                    <MapPin className="w-3.5 h-3.5 text-[#126B68]" />
                    <span>خط السير: {req.route}</span>
                  </p>
                  <p>الجهة الطالبة: {req.requester} • الركاب: {req.passengers || 1} أفراد</p>
                  {req.driver && <p className="text-[#126B68] dark:text-[#2DD4BF]">السائق المعين: {req.driver}</p>}
                </div>

                {onUpdateTransportRequestStatus && req.status !== "مكتمل" && (
                  <div className="pt-2 border-t border-[#EEF3F1] dark:border-[#1A3833] flex items-center justify-end gap-2">
                    {req.status === "جديد" && (
                      <button
                        onClick={() => onUpdateTransportRequestStatus(req.id, "مخصص")}
                        className="px-3 py-1 bg-[#EBF7F4] dark:bg-[#163D37] text-[#126B68] dark:text-[#2DD4BF] rounded-lg font-bold text-[11px]"
                      >
                        تعيين سائق
                      </button>
                    )}
                    <button
                      onClick={() => onUpdateTransportRequestStatus(req.id, "مكتمل")}
                      className="px-3 py-1 bg-[#126B68] text-white rounded-lg font-bold text-[11px]"
                    >
                      إتمام الرحلة
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === "services" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#F6FAF8] dark:bg-[#122A26] p-4 rounded-2xl border border-[#E1EBE8] dark:border-[#1E3B37]">
            <div>
              <h3 className="text-xs font-bold text-[#193B3A] dark:text-[#EDF7F4]">
                طلبات صيانة ومرافق السكن الطبي
              </h3>
              <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                متابعة أعمال السباكة، الكهرباء، النظافة، والتكييف لشقق الكوادر
              </p>
            </div>
            <button
              onClick={() => setIsServiceModalOpen(true)}
              className="px-4 py-2 bg-[#126B68] hover:bg-[#0d5553] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل طلب صيانة مرفق</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceRequests.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-[#0E2421] rounded-2xl border border-[#E1EBE8] dark:border-[#1E3B37] p-4.5 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] bg-[#E9F5F2] dark:bg-[#163D37] text-[#126B68] dark:text-[#2DD4BF] font-bold px-1.5 py-0.5 rounded-md">
                      {s.id}
                    </span>
                    <h4 className="text-sm font-black text-[#193B3A] dark:text-[#EDF7F4] mt-1">
                      {s.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      s.status === "مكتمل"
                        ? "bg-[#E5F5E8] dark:bg-[#133824] text-[#2B7A3D] dark:text-[#4ADE80]"
                        : s.status === "قيد التنفيذ"
                        ? "bg-[#DDF4F0] dark:bg-[#0F3833] text-[#0C756C] dark:text-[#2DD4BF]"
                        : "bg-[#FFF2D6] dark:bg-[#3D2D0C] text-[#B86B00] dark:text-[#FBBF24]"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="text-[11px] text-[#788C88] dark:text-[#8FAAA4] space-y-1">
                  <p className="flex items-center gap-1 text-[#193B3A] dark:text-[#EDF7F4]">
                    <MapPin className="w-3.5 h-3.5 text-[#126B68]" />
                    <span>الموقع: {s.location}</span>
                  </p>
                  <p>التصنيف: {s.category} • تاريخ التسجيل: {s.createdAt}</p>
                </div>

                {s.status !== "مكتمل" && (
                  <div className="pt-2 border-t border-[#EEF3F1] dark:border-[#1A3833] flex items-center justify-end gap-2">
                    {s.status === "جديد" && (
                      <button
                        onClick={() => onUpdateServiceRequestStatus(s.id, "قيد التنفيذ")}
                        className="px-3 py-1 bg-[#EBF7F4] dark:bg-[#163D37] text-[#126B68] dark:text-[#2DD4BF] rounded-lg font-bold text-[11px]"
                      >
                        بدء المعالجة
                      </button>
                    )}
                    <button
                      onClick={() => onUpdateServiceRequestStatus(s.id, "مكتمل")}
                      className="px-3 py-1 bg-[#126B68] text-white rounded-lg font-bold text-[11px]"
                    >
                      إغلاق الطلب (تم الإصلاح)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPOUND ADD/EDIT MODAL */}
      {isCompoundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="bg-white dark:bg-[#0E2421] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-[#E1EBE8] dark:border-[#1E3B37] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2] dark:border-[#1A3833]">
              <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                {editingCompound ? "تعديل بيانات المجمع السكني" : "إضافة مجمع سكني جديد"}
              </h3>
              <button
                onClick={() => setIsCompoundModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F0F5F3] dark:bg-[#163632] flex items-center justify-center text-[#5A736F]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCompound} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  اسم المجمع السكني *
                </label>
                <input
                  type="text"
                  value={compoundName}
                  onChange={(e) => setCompoundName(e.target.value)}
                  placeholder="مثال: كمباوند الروضة لمناوبات الطوارئ..."
                  className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  العنوان / الموقع الجغرافي
                </label>
                <input
                  type="text"
                  value={compoundAddress}
                  onChange={(e) => setCompoundAddress(e.target.value)}
                  placeholder="مثال: حي العليا — شارع التحلية..."
                  className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    إجمالي الشقق والوحدات
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={compoundUnits}
                    onChange={(e) => setCompoundUnits(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    حالة المجمع
                  </label>
                  <select
                    value={compoundStatus}
                    onChange={(e) => setCompoundStatus(e.target.value)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  >
                    <option value="نشط">نشط وجاهز</option>
                    <option value="يحتاج متابعة">يحتاج متابعة</option>
                    <option value="صيانة شاملة">صيانة شاملة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    مشرف المجمع
                  </label>
                  <input
                    type="text"
                    value={compoundManager}
                    onChange={(e) => setCompoundManager(e.target.value)}
                    placeholder="اسم المسؤول..."
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    رقم هاتف المشرف
                  </label>
                  <input
                    type="text"
                    value={compoundPhone}
                    onChange={(e) => setCompoundPhone(e.target.value)}
                    placeholder="05xxxx..."
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompoundModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F] text-[#526B66] dark:text-[#9FB7B2] font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ المجمع</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOUSING UNIT ADD/EDIT MODAL */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="bg-white dark:bg-[#0E2421] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl border border-[#E1EBE8] dark:border-[#1E3B37] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2] dark:border-[#1A3833]">
              <div>
                <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                  {editingUnit ? `تعديل الوحدة السكنية: ${editingUnit.unit}` : "إضافة وحدة سكنية جديدة"}
                </h3>
                <p className="text-[11px] text-[#788C88] dark:text-[#8FAAA4]">
                  تخصيص بيانات الشقة، الكادر الشاغل، والسعة المعتمدة
                </p>
              </div>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F0F5F3] dark:bg-[#163632] flex items-center justify-center text-[#5A736F]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    رقم أو كود الوحدة *
                  </label>
                  <input
                    type="text"
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    placeholder="مثال: مبنى C — شقة 304..."
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    المجمع السكني التابع له
                  </label>
                  <select
                    value={unitCompound}
                    onChange={(e) => setUnitCompound(e.target.value)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  >
                    {compounds.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    نوع الوحدة
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  >
                    {housingUnitTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    حالة الوحدة
                  </label>
                  <select
                    value={unitStatus}
                    onChange={(e) => setUnitStatus(e.target.value)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  >
                    <option value="شاغرة">شاغرة</option>
                    <option value="مشغولة">مشغولة</option>
                    <option value="صيانة">تحت الصيانة</option>
                    <option value="محجوزة">محجوزة لوصول جديد</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    السعة القصوى (أفراد)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={unitCapacity}
                    onChange={(e) => setUnitCapacity(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                </div>
              </div>

              {/* Occupant Information */}
              <div className="bg-[#FAFDFB] dark:bg-[#122A26] p-3.5 rounded-2xl border border-[#DCE8E5] dark:border-[#1D443E] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#126B68] dark:text-[#2DD4BF] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>بيانات الكادر الشاغل (اختياري)</span>
                  </span>
                  {unitEmployee && (
                    <button
                      type="button"
                      onClick={() => {
                        setUnitEmployee("");
                        setUnitDepartment("");
                        setUnitPhone("");
                        setUnitStatus("شاغرة");
                      }}
                      className="text-[#E53E3E] text-[10px] font-bold hover:underline"
                    >
                      إلغاء التسكين (إخلاء)
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    اسم الطبيب / الممرض / الكادر الشاغل
                  </label>
                  <input
                    type="text"
                    value={unitEmployee}
                    onChange={(e) => {
                      setUnitEmployee(e.target.value);
                      if (e.target.value.trim().length > 0 && unitStatus === "شاغرة") {
                        setUnitStatus("مشغولة");
                      }
                    }}
                    placeholder="مثال: د. مازن العتيبي — استشاري عناية مركزة..."
                    className="w-full bg-white dark:bg-[#0E2421] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                      القسم الطبي
                    </label>
                    <input
                      type="text"
                      value={unitDepartment}
                      onChange={(e) => setUnitDepartment(e.target.value)}
                      placeholder="مثال: العناية المركزة، التمريض..."
                      className="w-full bg-white dark:bg-[#0E2421] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                      رقم الجوال
                    </label>
                    <input
                      type="text"
                      value={unitPhone}
                      onChange={(e) => setUnitPhone(e.target.value)}
                      placeholder="05xxxx..."
                      className="w-full bg-white dark:bg-[#0E2421] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  ملاحظات وتفاصيل إضافية
                </label>
                <input
                  type="text"
                  value={unitNotes}
                  onChange={(e) => setUnitNotes(e.target.value)}
                  placeholder="مثال: شقة مؤثثة بالكامل، تحتاج صيانة لمكيف الصالة..."
                  className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F] text-[#526B66] dark:text-[#9FB7B2] font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ بيانات الوحدة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVICE REQUEST MODAL */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="bg-white dark:bg-[#0E2421] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-[#E1EBE8] dark:border-[#1E3B37] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2] dark:border-[#1A3833]">
              <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                تسجيل طلب صيانة أو مرفق سكني
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F0F5F3] dark:bg-[#163632] flex items-center justify-center text-[#5A736F]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateServiceRequest} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  وصف العطل أو الطلب *
                </label>
                <input
                  type="text"
                  value={srvTitle}
                  onChange={(e) => setSrvTitle(e.target.value)}
                  placeholder="مثال: تسريب مياه في دورة مياه الشقة 208..."
                  className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  الموقع / الوحدة السكنية *
                </label>
                <input
                  type="text"
                  value={srvLocation}
                  onChange={(e) => setSrvLocation(e.target.value)}
                  placeholder="مثال: كمباوند النور — مبنى B شقة 208..."
                  className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    تصنيف الخدمة
                  </label>
                  <select
                    value={srvCategory}
                    onChange={(e) => setSrvCategory(e.target.value as any)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  >
                    <option value="صيانة">صيانة وسباكة وكهرباء</option>
                    <option value="نظافة">نظافة وتعقيم</option>
                    <option value="تموين">تموين وفرش</option>
                    <option value="أمن">أمن وسلامة</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    الأولوية
                  </label>
                  <select
                    value={srvPriority}
                    onChange={(e) => setSrvPriority(e.target.value as any)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  >
                    <option value="عادي">عادي</option>
                    <option value="عاجل">عاجل وطارئ</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F] text-[#526B66] dark:text-[#9FB7B2] font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إرسال الطلب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW TRANSPORT MODAL */}
      {newTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn text-xs">
          <div className="bg-white dark:bg-[#0E2421] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-[#E1EBE8] dark:border-[#1E3B37] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2] dark:border-[#1A3833]">
              <h3 className="text-base font-black text-[#193B3A] dark:text-[#EDF7F4]">
                طلب رحلة نقل جديدة
              </h3>
              <button
                onClick={() => setNewTransportModal(false)}
                className="w-7 h-7 rounded-full bg-[#F0F5F3] dark:bg-[#163632] flex items-center justify-center text-[#5A736F]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransport} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  عنوان الرحلة أو المهمة *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: نقل مناوبة التمريض الصباحية..."
                  className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  خط السير (من ← إلى) *
                </label>
                <input
                  type="text"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  placeholder="مثال: كمباوند النور ← طوارئ المستشفى الرئيسي..."
                  className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    الجهة الطالبة
                  </label>
                  <input
                    type="text"
                    value={requester}
                    onChange={(e) => setRequester(e.target.value)}
                    placeholder="مثال: إدارة التمريض"
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                    عدد الركاب المتوقع
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#F6FAF8] dark:bg-[#122A26] border border-[#DCE8E5] dark:border-[#1D443E] rounded-xl p-2.5 text-xs text-[#193B3A] dark:text-[#EDF7F4] focus:outline-none focus:border-[#126B68]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] dark:text-[#EDF7F4] block">
                  الأولوية
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["عاجل", "مجدول", "منخفض"] as const).map((pri) => (
                    <button
                      type="button"
                      key={pri}
                      onClick={() => setPriority(pri)}
                      className={`py-1.5 rounded-xl font-bold border transition-all ${
                        priority === pri
                          ? "bg-[#126B68] text-white border-[#126B68]"
                          : "bg-[#F6FAF8] dark:bg-[#122A26] text-[#526B66] dark:text-[#9FB7B2] border-[#DCE8E5] dark:border-[#1D443E]"
                      }`}
                    >
                      {pri}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewTransportModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E5] dark:border-[#1E463F] text-[#526B66] dark:text-[#9FB7B2] font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الطلب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


