import React, { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  PlusCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building,
  FileCheck,
  Download,
  Printer,
  ShieldCheck,
  Package,
  Layers,
  ArrowUpRight,
  BellRing,
} from "lucide-react";
import {
  Invoice,
  PurchaseOrder,
  UserProfile,
  SupplierContract,
  Supplier,
} from "../types";
import { InvoicePdfModal } from "./InvoicePdfModal";
import { SupplierContractsManager } from "./SupplierContractsManager";
import { initialSupplierContracts } from "../data/initialData";
import { ViewTabBar, ViewTabItem } from "./ViewTabBar";
import { ContractDetailsContent } from "./ContractDetailsContent";

interface FinanceViewProps {
  invoices: Invoice[];
  onApproveInvoice?: (id: string) => Promise<boolean>;
  onAddInvoice: (inv: Omit<Invoice, "id">) => Promise<boolean> | void;
  purchaseOrders?: PurchaseOrder[];
  currentUser?: UserProfile;
  contracts?: SupplierContract[];
  onAddContract?: (contract: Omit<SupplierContract, "id" | "createdAt">) => Promise<boolean | void> | void;
  onUpdateContract?: (contract: SupplierContract) => Promise<boolean | void> | void;
  onDeleteContract?: (contractId: string) => Promise<boolean | void> | void;
  onRenewContract?: (contractId: string) => Promise<boolean | void> | void;
  suppliers?: Supplier[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  invoices,
  onApproveInvoice,
  onAddInvoice,
  purchaseOrders = [],
  currentUser,
  contracts: externalContracts,
  onAddContract: externalOnAddContract,
  onUpdateContract: externalOnUpdateContract,
  onDeleteContract: externalOnDeleteContract,
  onRenewContract: externalOnRenewContract,
  suppliers = [],
}) => {
  const [activeSection, setActiveSection] = useState<"contracts" | "invoices">("contracts");
  const [filterType, setFilterType] = useState<string>("الكل");
  const [purchaseOrderId,setPurchaseOrderId]=useState("");
  const [invoiceBusy,setInvoiceBusy]=useState(false);
  const [newInvoiceModal, setNewInvoiceModal] = useState(false);
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState<PurchaseOrder | null>(null);

  // Local state fallback for contracts if not provided by parent
  const [localContracts, setLocalContracts] = useState<SupplierContract[]>(initialSupplierContracts);

  const contracts = externalContracts || localContracts;

  // Integrated Tab System for Finance
  const [openContractTabs, setOpenContractTabs] = useState<SupplierContract[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("main-finance");

  const handleOpenContractInTab = (contract: SupplierContract) => {
    setOpenContractTabs((prev) => {
      if (prev.some((c) => c.id === contract.id)) {
        return prev;
      }
      return [...prev, contract];
    });
    setActiveTabId(`contract-${contract.id}`);
  };

  const handleCloseContractTab = (tabId: string) => {
    const contractId = tabId.replace("contract-", "");
    setOpenContractTabs((prev) => prev.filter((c) => c.id !== contractId));
    if (activeTabId === tabId) {
      setActiveTabId("main-finance");
    }
  };

  const handleCloseAllContractTabs = () => {
    setOpenContractTabs([]);
    setActiveTabId("main-finance");
  };

  // Build finance view tabs
  const financeTabs: ViewTabItem[] = useMemo(() => {
    const mainTab: ViewTabItem = {
      id: "main-finance",
      type: "main",
      title: "الإدارة المالية العامة",
      badge: `${contracts.length} عقود`,
    };

    const contractTabItems: ViewTabItem[] = openContractTabs.map((c) => ({
      id: `contract-${c.id}`,
      type: "contract",
      title: c.title,
      badge: c.id,
      badgeColor:
        c.status === "ساري"
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
      dataId: c.id,
    }));

    return [mainTab, ...contractTabItems];
  }, [contracts.length, openContractTabs]);

  const handleAddContract = async (c: Omit<SupplierContract, "id" | "createdAt">) => {
    if (externalOnAddContract) {
      return await externalOnAddContract(c);
    } else {
      const newContract: SupplierContract = {
        ...c,
        id: `CNT-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setLocalContracts((prev) => [newContract, ...prev]);
    }
  };

  const handleUpdateContract = async (c: SupplierContract) => {
    if (externalOnUpdateContract) {
      return await externalOnUpdateContract(c);
    } else {
      setLocalContracts((prev) => prev.map((item) => (item.id === c.id ? c : item)));
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (externalOnDeleteContract) {
      return await externalOnDeleteContract(id);
    } else {
      setLocalContracts((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleRenewContract = async (id: string) => {
    if (externalOnRenewContract) {
      return await externalOnRenewContract(id);
    } else {
      setLocalContracts((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const currentEnd = new Date(c.endDate);
            const newEnd = new Date(currentEnd);
            newEnd.setFullYear(newEnd.getFullYear() + 1);
            return {
              ...c,
              endDate: newEnd.toISOString().split("T")[0],
              status: "ساري",
              lastRenewedDate: new Date().toISOString().split("T")[0],
            };
          }
          return c;
        })
      );
    }
  };

  // Form states for invoices
  const [party, setParty] = useState("");
  const [type, setType] = useState<"شراء" | "مصروف" | "إيراد">("شراء");
  const [amount, setAmount] = useState(5000);
  const [description, setDescription] = useState("");

  const totalRevenue = invoices
    .filter((i) => i.type === "إيراد")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = invoices
    .filter((i) => i.type === "مصروف" || i.type === "شراء")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netCashFlow = totalRevenue - totalExpense;

  const dueAmount = invoices
    .filter((i) => i.status === "مستحقة")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredInvoices = invoices.filter(
    (inv) => filterType === "الكل" || inv.type === filterType
  );

  // Filter approved purchase orders eligible for immediate PDF e-Invoicing
  const approvedOrders = purchaseOrders.filter(
    (po) => po.status === "مقبولة" || po.status === "قيد التوصيل" || po.status === "مكتملة"
  );

  // Calculate alerts for contracts
  const alertContractsCount = useMemo(() => {
    const today = new Date();
    return contracts.filter((c) => {
      const end = new Date(c.endDate);
      const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= (c.renewalAlertDays || 30);
    }).length;
  }, [contracts]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!party.trim() || amount <= 0) return;

    setInvoiceBusy(true);
    const saved=await onAddInvoice({
      purchaseOrderId:purchaseOrderId||undefined,
      party: party.trim(),
      type,
      amount,
      status: "مستحقة",
      date: new Date().toISOString().split("T")[0],
      description: description.trim() || undefined,
    });

    setInvoiceBusy(false);if(saved===false)return;
    setPurchaseOrderId("");
    setParty("");
    setDescription("");
    setNewInvoiceModal(false);
  };

  // Helper to open PDF generator from an invoice
  const handleOpenPdfFromInvoice = (inv: Invoice) => {
    // Try matching an existing purchase order
    const matched = purchaseOrders.find(
      (po) =>
        inv.description?.includes(po.id) ||
        po.supplierName.toLowerCase() === inv.party.toLowerCase()
    );

    if (matched) {
      setSelectedOrderForPdf(matched);
    } else {
      // Create synthetic purchase order for the invoice
      const syntheticOrder: PurchaseOrder = {
        id: inv.id.replace("INV-", "PO-"),
        hospitalName: "مستشفى الملك فهد التخصصي — إدارة التموين الطبي",
        supplierName: inv.party,
        items: [
          {
            productId: 101,
            productName: inv.description || `توريدات ومستلزمات طبية معتمدة (${inv.party})`,
            unit: "شحنة",
            price: inv.amount,
            quantity: 1,
          },
        ],
        totalAmount: inv.amount,
        status: "مقبولة",
        orderDate: inv.date,
      };
      setSelectedOrderForPdf(syntheticOrder);
    }
  };

  const activeContractObj = useMemo(() => {
    if (activeTabId.startsWith("contract-")) {
      const cId = activeTabId.replace("contract-", "");
      return contracts.find((c) => c.id === cId) || null;
    }
    return null;
  }, [activeTabId, contracts]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#E1EBE8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#193B3A]">الإدارة المالية والتدفقات النقدية</h2>
            <span className="bg-[#126B68] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              العمليات المالية
            </span>
          </div>
          <p className="text-xs text-[#738884] mt-0.5">
            تتبع مطالبات الموردين، توليد الفواتير الإلكترونية المعتمدة (PDF)، وفواتير التشغيل
          </p>
        </div>

        <div className="flex items-center gap-2">
          {approvedOrders.length > 0 && (
            <button
              onClick={() => setSelectedOrderForPdf(approvedOrders[0])}
              className="px-3.5 py-2.5 bg-[#E9F5F2] hover:bg-[#d8ece8] text-[#126B68] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-[#CDE5DF] transition-all cursor-pointer"
              title="توليد أحدث فاتورة إلكترونية PDF"
            >
              <FileCheck className="w-4 h-4" />
              <span>توليد فاتورة PDF لأحدث أمر شراء</span>
            </button>
          )}

          <button
            onClick={() => setNewInvoiceModal(true)}
            className="px-4 py-2.5 bg-[#126B68] hover:bg-[#0d5553] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>تسجيل فاتورة / مطالبة</span>
          </button>
        </div>
      </div>

      {/* Integrated Tab Bar for Finance View */}
      <ViewTabBar
        tabs={financeTabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseContractTab}
        onCloseAllExtraTabs={handleCloseAllContractTabs}
        mainTabLabel="الإدارة المالية العامة"
      />

      {/* Content Switcher: If active tab is a Contract, render Contract Details in-place */}
      {activeContractObj ? (
        <div className="bg-white dark:bg-[#122624] rounded-3xl border border-[#E1EBE8] dark:border-[#1F423E] shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDF4F2] dark:border-[#1A3834] pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-[#E9F5F2] dark:bg-[#1B3F3A] text-[#126B68] dark:text-[#4ECDC4] px-2 py-0.5 rounded-md">
                تبويب العقد المفتوح
              </span>
              <span className="text-xs font-bold text-[#6B8581] dark:text-[#9DBBB4]">
                يمكنك التنقل بحرية بين التبويبات أعلاه دون فقدان أي بيانات
              </span>
            </div>
            <button
              onClick={() => handleCloseContractTab(activeTabId)}
              className="text-xs text-[#788C88] hover:text-[#C94D4D] font-bold px-3 py-1 rounded-xl bg-gray-50 dark:bg-[#16302C] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
            >
              إغلاق هذا التبويب
            </button>
          </div>

          <ContractDetailsContent
            contract={activeContractObj}
            onRenew={handleRenewContract}
            onEdit={(c) => handleUpdateContract(c)}
            onToggleStatus={(id, status) => {
              const found = contracts.find((c) => c.id === id);
              if (found) {
                handleUpdateContract({ ...found, status });
              }
            }}
            isTabMode={true}
          />
        </div>
      ) : (
        <>
          {/* Sub-Tabs: Contracts vs Invoices */}
      <div className="flex items-center gap-2 border-b border-[#E1EBE8] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection("contracts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSection === "contracts"
              ? "bg-[#126B68] text-white shadow-xs font-black"
              : "bg-white text-[#667E7A] hover:text-[#193B3A] border border-[#E1EBE8]"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>عقود الصيانة والتوريد</span>
          {alertContractsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSection === "contracts"
                  ? "bg-[#F4C96B] text-[#193B3A]"
                  : "bg-[#C9684D] text-white"
              }`}
            >
              {alertContractsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection("invoices")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeSection === "invoices"
              ? "bg-[#126B68] text-white shadow-xs font-black"
              : "bg-white text-[#667E7A] hover:text-[#193B3A] border border-[#E1EBE8]"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>الفواتير والمطالبات والـ PDF</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSection === "invoices"
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-[#5A736F]"
            }`}
          >
            {invoices.length}
          </span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#E1EBE8] shadow-xs">
          <span className="text-xs font-bold text-[#6B8581]">صافي التدفق المالي</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-2xl font-black ${
                netCashFlow >= 0 ? "text-[#2B7A3D]" : "text-[#C9684D]"
              }`}
            >
              {netCashFlow.toLocaleString()}
            </span>
            <span className="text-xs text-[#8B9A97]">ريال</span>
          </div>
          <p className="text-[11px] text-[#2B7A3D] mt-1 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            توازن مالي إيجابي
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1EBE8] shadow-xs">
          <span className="text-xs font-bold text-[#6B8581]">إجمالي الإيرادات</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#193B3A]">{totalRevenue.toLocaleString()}</span>
            <span className="text-xs text-[#8B9A97]">ريال</span>
          </div>
          <p className="text-[11px] text-[#126B68] mt-1 font-semibold">مطالبات التأمين والنقدي</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1EBE8] shadow-xs">
          <span className="text-xs font-bold text-[#6B8581]">المصروفات والتوريد</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#193B3A]">{totalExpense.toLocaleString()}</span>
            <span className="text-xs text-[#8B9A97]">ريال</span>
          </div>
          <p className="text-[11px] text-[#788C88] mt-1 font-semibold">أدوية، تشغيل، وصيانة</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E1EBE8] shadow-xs">
          <span className="text-xs font-bold text-[#6B8581]">مستحقات واجبة السداد</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#C9684D]">{dueAmount.toLocaleString()}</span>
            <span className="text-xs text-[#8B9A97]">ريال</span>
          </div>
          <p className="text-[11px] text-[#C9684D] mt-1 font-semibold">تتطلب اعتماد الصرف</p>
        </div>
      </div>

      {activeSection === "contracts" ? (
        <SupplierContractsManager
          contracts={contracts}
          onAddContract={handleAddContract}
          onUpdateContract={handleUpdateContract}
          onDeleteContract={handleDeleteContract}
          onRenewContract={handleRenewContract}
          suppliers={suppliers}
          onOpenInTab={handleOpenContractInTab}
        />
      ) : (
        <>
          {/* Highlight Section: Approved Purchase Orders for Instant PDF Invoicing */}
          <div className="bg-white rounded-3xl border border-[#E1EBE8] shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDF4F2] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#126B68]/15 text-[#126B68] flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#193B3A]">
                أوامر الشراء المعتمدة والفواتير الضريبية الإلكترونية
              </h3>
              <p className="text-[11px] text-[#788C88]">
                توليد فوري لفواتير PDF رسمية مطابقة للمواصفات مع توقيع إلكتروني مشفر وختم الاعتماد
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#126B68] bg-[#E9F5F2] px-3 py-1 rounded-full w-fit">
            {approvedOrders.length} أوامر شراء معتمدة وجاهزة للتصدير
          </span>
        </div>

        {approvedOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {approvedOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-[#E1EBE8] hover:border-[#126B68]/50 bg-[#F9FCFB] hover:bg-white transition-all shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black bg-[#E9F5F2] text-[#126B68] px-2 py-0.5 rounded-md">
                      {order.id}
                    </span>
                    <span className="text-[10px] bg-[#E5F5E8] text-[#2B7A3D] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{order.status}</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-[#193B3A] mt-2 truncate">
                    {order.supplierName}
                  </h4>
                  <p className="text-[11px] text-[#738884] mt-0.5">
                    {order.items?.length || 1} بنود توريد • {order.orderDate}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EDF4F2] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#8B9A97] block">القيمة الإجمالية</span>
                    <span className="text-sm font-black text-[#193B3A]">
                      {order.totalAmount.toLocaleString()} ريال
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrderForPdf(order)}
                    className="px-3 py-1.5 bg-[#126B68] hover:bg-[#0e5754] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>توليد PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#8B9A97]">
            لا توجد أوامر شراء معتمدة حالياً. يمكنك إصدار أمر شراء من صفحة سوق التوريد أو مسح قطع الغيار.
          </div>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl border border-[#E1EBE8] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#EEF3F1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-[#193B3A]">سجل الفواتير والمطالبات المالية</h3>
            <span className="text-xs text-[#8B9A97]">فواتير الموردين ومصروفات التشغيل</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["الكل", "شراء", "مصروف", "إيراد"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === t
                    ? "bg-[#126B68] text-white font-black"
                    : "bg-[#F0F5F3] text-[#5A736F] hover:bg-[#E3EDE9]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#EEF3F1]">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[#F9FCFB] transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] bg-[#E9F5F2] text-[#126B68] font-bold px-1.5 py-0.5 rounded-md">
                    {inv.id}
                  </span>
                  <span className="font-bold text-[#193B3A]">{inv.party}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      inv.type === "إيراد"
                        ? "bg-[#E5F5E8] text-[#2B7A3D]"
                        : inv.type === "شراء"
                        ? "bg-[#DDF4F0] text-[#0C756C]"
                        : "bg-[#F0F5F3] text-[#526B66]"
                    }`}
                  >
                    {inv.type}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      inv.status === "مدفوعة"
                        ? "bg-[#E5F5E8] text-[#2B7A3D]"
                        : inv.status === "مستحقة"
                        ? "bg-[#FFF2D6] text-[#B86B00]"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                {inv.description && <p className="text-[11px] text-[#788C88]">{inv.description}</p>}
                <p className="text-[10px] text-[#8B9A97]">تاريخ الاستحقاق: {inv.date}</p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span
                  className={`text-base font-black ${
                    inv.type === "إيراد" ? "text-[#2B7A3D]" : "text-[#193B3A]"
                  }`}
                >
                  {inv.type === "إيراد" ? "+" : "-"}
                  {inv.amount.toLocaleString()} ريال
                </span>

                {currentUser?.role==="admin"&&inv.status==="مسودة"&&<button className="px-3 py-2 border rounded-xl" onClick={()=>void onApproveInvoice?.(inv.id)}>اعتماد القيد</button>}
                {/* PDF generation trigger button for purchase invoice */}
                {inv.type === "شراء" && (
                  <button
                    onClick={() => handleOpenPdfFromInvoice(inv)}
                    className="p-2 bg-[#F0F5F3] hover:bg-[#E2EDE9] text-[#126B68] rounded-xl border border-[#DCE8E5] transition-colors cursor-pointer"
                    title="توليد وتصدير فاتورة PDF إلكترونية"
                  >
                    <FileCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )}
    </>
  )}

      {/* New Invoice Modal */}
      {newInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-[#E1EBE8] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF4F2]">
              <h3 className="text-base font-black text-[#193B3A]">تسجيل قيد مالي جديد</h3>
              <button
                onClick={() => setNewInvoiceModal(false)}
                className="w-7 h-7 rounded-full bg-[#F0F5F3] flex items-center justify-center text-[#5A736F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3">
              {type==="شراء"&&<label className="block">أمر الشراء المستلم<select required value={purchaseOrderId} onChange={e=>{setPurchaseOrderId(e.target.value);const po=purchaseOrders.find(p=>p.id===e.target.value);if(po){setParty(po.supplierName);setAmount(po.totalAmount);}}} className="w-full border rounded-xl p-3"><option value="">اختر أمرًا مستلمًا ومفحوصًا</option>{purchaseOrders.filter(p=>p.status==="مكتملة"&&p.receiptReference).map(p=><option key={p.id} value={p.id}>{p.id} — {p.supplierName}</option>)}</select></label>}
              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] block">الجهة / المورد / البند *</label>
                <input
                  type="text"
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  placeholder="مثال: الشركة الوطنية للأدوية أو صيانة المصاعد..."
                  className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-2.5 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] block">النوع</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-2.5 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                  >
                    <option value="شراء">شراء بضاعة ومستلزمات</option>
                    <option value="مصروف">مصروف تشغيلي أو صيانة</option>
                    <option value="إيراد">إيراد طبي أو تأمين</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#193B3A] block">المبلغ (ريال) *</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-2.5 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#193B3A] block">بيان الفاتورة وتفاصيلها</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="رقم العقد أو تفاصيل الشحنة..."
                  className="w-full bg-[#F6FAF8] border border-[#DCE8E5] rounded-xl p-2.5 text-xs text-[#193B3A] focus:outline-none focus:border-[#126B68]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8E5] text-[#526B66] font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit" disabled={invoiceBusy}
                  className="px-5 py-2 rounded-xl bg-[#126B68] hover:bg-[#0d5553] text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ القيد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice PDF Generation Modal */}
      {selectedOrderForPdf && (
        <InvoicePdfModal
          isOpen={!!selectedOrderForPdf}
          onClose={() => setSelectedOrderForPdf(null)}
          order={selectedOrderForPdf}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
