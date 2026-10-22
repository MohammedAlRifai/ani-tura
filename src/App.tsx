import { useModalAccessibility } from "./hooks/useModalAccessibility";
import { LoginScreen } from "./components/LoginScreen";
import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "./components/Header";
import { WorkspaceNav } from "./components/WorkspaceNav";
const DashboardView=lazy(()=>import("./components/DashboardView").then(module=>({default:module.DashboardView})));
const ReportsView=lazy(()=>import("./components/ReportsView").then(module=>({default:module.ReportsView})));
const AssetsView=lazy(()=>import("./components/AssetsView").then(module=>({default:module.AssetsView})));
const PpmView=lazy(()=>import("./components/PpmView").then(module=>({default:module.PpmView})));
const ManarAssistantView=lazy(()=>import("./components/ManarAssistantView").then(module=>({default:module.ManarAssistantView})));
const InventoryView=lazy(()=>import("./components/InventoryView").then(module=>({default:module.InventoryView})));
const LogisticsView=lazy(()=>import("./components/LogisticsView").then(module=>({default:module.LogisticsView})));
const FinanceView=lazy(()=>import("./components/FinanceView").then(module=>({default:module.FinanceView})));
const MarketplaceView=lazy(()=>import("./components/MarketplaceView").then(module=>({default:module.MarketplaceView})));
import { RoleSwitcherModal } from "./components/RoleSwitcherModal";
const NewReportModal=lazy(()=>import("./components/NewReportModal").then(module=>({default:module.NewReportModal})));
const NewAssetModal=lazy(()=>import("./components/NewAssetModal").then(module=>({default:module.NewAssetModal})));
const ScanModal=lazy(()=>import("./components/ScanModal").then(module=>({default:module.ScanModal})));
const ReportDetailModal=lazy(()=>import("./components/ReportDetailModal").then(module=>({default:module.ReportDetailModal})));
const AssetDetailModal=lazy(()=>import("./components/AssetDetailModal").then(module=>({default:module.AssetDetailModal})));
const SyncStatusModal=lazy(()=>import("./components/SyncStatusModal").then(module=>({default:module.SyncStatusModal})));
import { OnboardingTour } from "./components/OnboardingTour";
const SfdaAlertsModal=lazy(()=>import("./components/SfdaAlertsModal").then(module=>({default:module.SfdaAlertsModal})));
const AuditExportModal=lazy(()=>import("./components/AuditExportModal").then(module=>({default:module.AuditExportModal})));
const PushNotificationModal=lazy(()=>import("./components/PushNotificationModal").then(module=>({default:module.PushNotificationModal})));
import { PushNotificationToast } from "./components/PushNotificationToast";
import { MobileNavDrawer } from "./components/MobileNavDrawer";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { CalibrationAlertModal, ExpiringCalibrationItem } from "./components/CalibrationAlertModal";
const UserAuditLogModal=lazy(()=>import("./components/UserAuditLogModal").then(module=>({default:module.UserAuditLogModal})));
const SystemConfigModal=lazy(()=>import("./components/SystemConfigModal").then(module=>({default:module.SystemConfigModal})));
import { reconcilePpmSchedulesWithAssets, calculateDaysRemaining } from "./utils/dateCompliance";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useTheme } from "./utils/useTheme";
import {
  initialAssets,
  initialReports,
  initialProducts,
  initialMovements,
  initialSuppliers,
  initialPharmacies,
  initialInvoices,
  initialTransportRequests,
  initialCompounds,
  initialHousingUnits,
  initialServiceRequests,
  initialPurchaseOrders,
  initialUsers,
  initialPpmSchedules,
  initialCalibrationLogs,
  initialSfdaAlerts,
  initialAuditLogs,
  initialSystemConfig,
} from "./data/initialData";
import {
  Report,
  Asset,
  Product,
  InventoryMovement,
  Supplier,
  Invoice,
  TransportRequest,
  Compound,
  HousingUnit,
  ServiceRequest,
  PurchaseOrder,
  ReportStatus,
  ReportPriority,
  UserProfile,
  PpmSchedule,
  CalibrationWorkOrder,
  SyncStatus,
  OfflineQueueItem,
  SfdaSafetyAlert,
  UserAuditLogEntry,
  AuditActionType,
  SystemFlexibilityConfig,
} from "./types";
import {
  STORAGE_KEYS,
  loadCachedData,
  saveCachedData,
  getOfflineQueue,
  addToOfflineQueue,
  clearOfflineQueue,
  getSimulatedOffline,
  setSimulatedOffline,
  getLastSyncTime,
  updateLastSyncTime,
  getStorageStats,
} from "./utils/offlineStorage";
import {
  Activity,
  FileText,
  Boxes,
  Sparkles,
  QrCode,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

export default function App() {
  useModalAccessibility();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // RBAC Users State
  const [users] = useState<UserProfile[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUsers[0]);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

  // Eye-Care Theme Manager (Auto / Night Shift / OS System / Manual)
  const {
    preference: themePreference,
    setPreference: setThemePreference,
    isDark,
    isNightShift,
    activeReason: themeReason,
  } = useTheme();

  const operationKeys=useRef(new Map<string,string>());
  const [authenticated, setAuthenticated] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  // Core Data States - initialized from LocalStorage cache with fallback to seed data
  const [reports, setReports] = useState<Report[]>(() =>
    loadCachedData(STORAGE_KEYS.REPORTS, initialReports)
  );
  const [assets, setAssets] = useState<Asset[]>(() =>
    loadCachedData(STORAGE_KEYS.ASSETS, initialAssets)
  );
  const [products, setProducts] = useState<Product[]>(() =>
    loadCachedData(STORAGE_KEYS.PRODUCTS, initialProducts)
  );
  const [movements, setMovements] = useState<InventoryMovement[]>(() =>
    loadCachedData(STORAGE_KEYS.MOVEMENTS, initialMovements)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadCachedData(STORAGE_KEYS.INVOICES, initialInvoices)
  );
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>(() =>
    loadCachedData(STORAGE_KEYS.TRANSPORT_REQUESTS, initialTransportRequests)
  );
  const [compounds, setCompounds] = useState<Compound[]>(() =>
    loadCachedData(STORAGE_KEYS.COMPOUNDS, initialCompounds)
  );
  const [housingUnits, setHousingUnits] = useState<HousingUnit[]>(() =>
    loadCachedData(STORAGE_KEYS.HOUSING_UNITS, initialHousingUnits)
  );
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(() =>
    loadCachedData(STORAGE_KEYS.SERVICE_REQUESTS, initialServiceRequests)
  );
  const [systemConfig, setSystemConfig] = useState<SystemFlexibilityConfig>(() =>
    loadCachedData(STORAGE_KEYS.SYSTEM_CONFIG, initialSystemConfig)
  );
  const [isSystemConfigOpen, setIsSystemConfigOpen] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    loadCachedData(STORAGE_KEYS.PURCHASE_ORDERS, initialPurchaseOrders)
  );

  // PPM States - cached in LocalStorage with dynamic reconciliation with Assets registry
  const [ppmSchedules, setPpmSchedules] = useState<PpmSchedule[]>(() => {
    const raw = loadCachedData(STORAGE_KEYS.PPM_SCHEDULES, initialPpmSchedules);
    return reconcilePpmSchedulesWithAssets(raw, initialAssets);
  });
  const [calibrationLogs, setCalibrationLogs] = useState<CalibrationWorkOrder[]>(() =>
    loadCachedData(STORAGE_KEYS.CALIBRATION_LOGS, initialCalibrationLogs)
  );

  // SFDA Medical Safety Alerts State - cached in LocalStorage
  const [sfdaAlerts, setSfdaAlerts] = useState<SfdaSafetyAlert[]>(() =>
    loadCachedData("hospital_eye_sfda_alerts", initialSfdaAlerts)
  );

  // User Activity Audit Logs State - cached in LocalStorage
  const [auditLogs, setAuditLogs] = useState<UserAuditLogEntry[]>(() =>
    loadCachedData(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs)
  );

  const handleUpdateSfdaAlert = async (alert: SfdaSafetyAlert) => { await requestOperation('update_alert',alert,'تم حفظ إجراء التنبيه الداخلي'); };
  // Connectivity & Offline Sync States
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(() =>
    getSimulatedOffline()
  );
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() =>
    getOfflineQueue()
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    getOfflineQueue().length > 0 ? "pending" : "synced"
  );
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() =>
    getLastSyncTime()
  );
  const [storageStats, setStorageStats] = useState(() => getStorageStats());

  // Modals
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [preselectedAssetForReport, setPreselectedAssetForReport] = useState<Asset | null>(
    null
  );
  const [isSfdaModalOpen, setIsSfdaModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushAlertToast, setPushAlertToast] = useState<any>(null);
  const [isUserAuditLogModalOpen, setIsUserAuditLogModalOpen] = useState(false);
  const [selectedAuditUserId, setSelectedAuditUserId] = useState<string | undefined>(undefined);

  const handleOpenUserAuditLog = useCallback((userId?: string) => {
    setSelectedAuditUserId(userId || currentUser.id);
    setIsUserAuditLogModalOpen(true);
  }, [currentUser.id]);

  const logUserAction = (..._args: any[]) => { /* Operational audit is written by the server transaction. */ };

  const [isCalibrationAlertOpen, setIsCalibrationAlertOpen] = useState(false);
  const hasCheckedCalibrationOnMountRef = useRef(false);

  // Calculate Medical Devices with Calibration Schedule Expiring in <= 7 days or Overdue
  const { overdueCalibrations, dueSoonCalibrations, expiringCalibrations } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = ppmSchedules.map((schedule) => {
      const days = calculateDaysRemaining(schedule.nextDueDate, today);
      return { schedule, daysRemaining: days ?? 999 };
    });

    const overdue = items.filter((i) => i.daysRemaining < 0);
    const dueSoon = items.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 7);

    return {
      overdueCalibrations: overdue,
      dueSoonCalibrations: dueSoon,
      expiringCalibrations: [...overdue, ...dueSoon],
    };
  }, [ppmSchedules]);

  // Push Notifications Hook with stable callback
  const handlePushNotificationReceived = useCallback((notification: any) => {
    setPushAlertToast(notification);
  }, []);

  const {
    isSubscribed: isPushSubscribed,
    subscribe: subscribePush,
  } = usePushNotifications(handlePushNotificationReceived);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Alert user gently upon session start without interrupting active modal or report creation
  useEffect(() => {
    if (!hasCheckedCalibrationOnMountRef.current && (overdueCalibrations.length > 0 || dueSoonCalibrations.length > 0)) {
      hasCheckedCalibrationOnMountRef.current = true;
      const parts: string[] = [];
      if (overdueCalibrations.length > 0) {
        parts.push(`(${overdueCalibrations.length}) أجهزة متأخرة عن الموعد`);
      }
      if (dueSoonCalibrations.length > 0) {
        parts.push(`(${dueSoonCalibrations.length}) أجهزة مستحقة خلال 7 أيام`);
      }
      showToast(
        `⚠️ تنبيه المعايرة والسلامة الطبية (CBAHI): رصد ${parts.join(" و ")}`
      );
    }
  }, [overdueCalibrations.length, dueSoonCalibrations.length, showToast]);

  // Sync Pending Queue with Backend API
  const triggerSync = useCallback(async () => {
    const queue = getOfflineQueue();
    const effectiveOnline = isOnline && !isSimulatedOffline;

    if (!effectiveOnline) {
      showToast("لا يمكن المزامنة حالياً أثناء انقطاع الاتصال أو تفعيل المحاكاة.");
      return;
    }

    if (queue.length === 0) {
      setSyncStatus("synced");
      showToast("كافة البيانات متزامنة بالكامل مع الخادم المحلي ولا توجد عمليات معلقة.");
      return;
    }

    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/sync/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: queue.filter(item=>!item.payload?.ownerId||item.payload.ownerId===currentUser.id) }),
      });

      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        if(data.state){setReports(data.state.reports);setAssets(data.state.assets);setProducts(data.state.products);setMovements(data.state.movements);setPpmSchedules(data.state.ppmSchedules);setCalibrationLogs(data.state.calibrationLogs);setAuditLogs(data.state.auditLogs);}
        const successIds = new Set(
          results.filter((r: { success: boolean }) => r.success).map((r: { id: string }) => r.id)
        );

        const remainingQueue = queue.filter((item) => !successIds.has(item.id)).map(item=>{const failure=results.find((r:any)=>r.id===item.id&&!r.success);return failure?{...item,status:"failed" as const,error:failure.error,retryCount:item.retryCount+1}:item;});
        saveCachedData(STORAGE_KEYS.OFFLINE_QUEUE, remainingQueue);
        setOfflineQueue(remainingQueue);

        updateLastSyncTime();
        const nowIso = new Date().toISOString();
        setLastSyncTime(nowIso);

        const newStatus: SyncStatus = remainingQueue.length > 0 ? "pending" : "synced";
        setSyncStatus(newStatus);
        setStorageStats(getStorageStats());

        showToast(
          `تمت مزامنة ${successIds.size} من العمليات بنجاح مع الخادم المحلي.`
        );
      } else {
        setSyncStatus("pending");
        showToast("تعذر استكمال المزامنة مع السيرفر. تم الاحتفاظ بالبيانات محلياً لإعادة المحاولة.");
      }
    } catch (error) {
      console.error("Batch sync failed:", error);
      setSyncStatus("pending");
      showToast("فشلت المزامنة بسبب خطأ في الاتصال. العمليات محفوظة بأمان في التخزين المحلي.");
    }
  }, [isOnline, isSimulatedOffline, showToast, currentUser.id]);

  // Online / Offline Window Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("تمت استعادة الاتصال بالإنترنت. جاري فحص ومزامنة البيانات المعلقة...");
      // Auto-trigger sync on reconnection if not in simulated offline
      if (!getSimulatedOffline()) {
        setTimeout(() => {
          triggerSync();
        }, 500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast("تنبيه: انقطع الاتصال بالإنترنت. تم تفعيل نمط الحفظ المحلي التلقائي.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync, showToast]);

  // Auto-persist local state to localStorage
  useEffect(() => {
    saveCachedData(STORAGE_KEYS.REPORTS, reports);
    setStorageStats(getStorageStats());
  }, [reports]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.ASSETS, assets);
    setStorageStats(getStorageStats());
  }, [assets]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.PRODUCTS, products);
    setStorageStats(getStorageStats());
  }, [products]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.MOVEMENTS, movements);
  }, [movements]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.PPM_SCHEDULES, ppmSchedules);
  }, [ppmSchedules]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.CALIBRATION_LOGS, calibrationLogs);
    setStorageStats(getStorageStats());
  }, [calibrationLogs]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.PURCHASE_ORDERS, purchaseOrders);
  }, [purchaseOrders]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.INVOICES, invoices);
  }, [invoices]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.COMPOUNDS, compounds);
    setStorageStats(getStorageStats());
  }, [compounds]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.HOUSING_UNITS, housingUnits);
    setStorageStats(getStorageStats());
  }, [housingUnits]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.TRANSPORT_REQUESTS, transportRequests);
    setStorageStats(getStorageStats());
  }, [transportRequests]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.SERVICE_REQUESTS, serviceRequests);
    setStorageStats(getStorageStats());
  }, [serviceRequests]);

  useEffect(() => {
    saveCachedData(STORAGE_KEYS.SYSTEM_CONFIG, systemConfig);
    setStorageStats(getStorageStats());
  }, [systemConfig]);

  const applySnapshot = useCallback((data: any) => {
    setReports(data.reports); setAssets(data.assets); setProducts(data.products);
    setMovements(data.movements); setInvoices(data.invoices); setPurchaseOrders(data.purchaseOrders);
    setPpmSchedules(data.ppmSchedules); setCalibrationLogs(data.calibrationLogs);
    setSuppliers(data.suppliers); setContracts(data.contracts); setAuditLogs(data.auditLogs);
    setTransportRequests(data.transportRequests); setCompounds(data.compounds); setHousingUnits(data.housingUnits);
    setServiceRequests(data.serviceRequests); setSfdaAlerts(data.sfdaAlerts); setSystemConfig(data.systemConfig);
  }, []);
  const loadSession = useCallback(async () => {
    try { const me=await fetch('/api/auth/me'); if(me.ok){const {user}=await me.json();if(user)setCurrentUser(user);}
      const res=await fetch('/api/state').catch(()=>null); if(res&&res.ok){const data=await res.json();applySnapshot(data);}
      window.dispatchEvent(new Event("ain-session-changed"));
      setActiveTab(tab=>user.allowedTabs.includes(tab)?tab:'dashboard');
    } catch {setAuthenticated(true);} finally {setSessionLoading(false);}
  }, [applySnapshot]);
  useEffect(()=>{void loadSession();},[loadSession]);
  const logout = async () => {setIsRoleSwitcherOpen(false);setIsUserAuditLogModalOpen(false);};
  const requestOperation = async (type: string, payload: any, description: string) => {
    const fingerprint=JSON.stringify({type,payload});
    const operationId=operationKeys.current.get(fingerprint)||crypto.randomUUID();operationKeys.current.set(fingerprint,operationId);
    if(!navigator.onLine || isSimulatedOffline){
      if(type==='create_report'){
        const queued={...payload,id:payload.id||`REP-${operationId}`};
        addToOfflineQueue(type,{...queued,ownerId:currentUser.id},description);setOfflineQueue(getOfflineQueue());setSyncStatus('pending');
        setReports(prev=>[{...queued,status:'جديد',createdAt:new Date().toISOString()},...prev]);showToast('حُفظ البلاغ محليًا بانتظار المزامنة؛ لم يُوجّه للفريق بعد');return {pending:true};
      }
      showToast('هذه العملية تتطلب اتصالًا للتحقق من الصلاحيات والرصيد والاعتماد؛ لم تُحفظ');return null;
    }
    try {const res=await fetch('/api/operations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:operationId,type,payload})});const data=await res.json();
      if(!res.ok){operationKeys.current.delete(fingerprint);throw new Error(data.error||'تعذر حفظ العملية');}
      operationKeys.current.delete(fingerprint);applySnapshot(data.state);showToast(description);return data.result;
    }catch(e:any){showToast(e.message||'تعذر الاتصال؛ لم يتم تأكيد حفظ العملية');return null;}
  };

  useEffect(()=>{if(authenticated&&currentUser.role!=="admin"&&!currentUser.allowedTabs.includes(activeTab))setActiveTab("dashboard");},[authenticated,currentUser,activeTab]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[activeTab]);

  // Toggle Simulated Offline Mode
  const handleToggleSimulatedOffline = () => {
    const next = !isSimulatedOffline;
    setIsSimulatedOfflineState(next);
    setSimulatedOffline(next);
    if (next) {
      showToast("تم تفعيل وضع محاكاة انقطاع الشبكة (Offline Mode). ستُحفظ العمليات محلياً.");
    } else {
      showToast("تم إلغاء محاكاة الانقطاع. جاري التحقق من المزامنة...");
      setTimeout(() => {
        triggerSync();
      }, 400);
    }
  };

  // Clear Queue
  const handleClearQueue = () => {
    clearOfflineQueue();
    setOfflineQueue([]);
    setSyncStatus("synced");
    setStorageStats(getStorageStats());
    showToast("تم تفريغ طابور العمليات المعلقة بنجاح.");
  };

  // Flexible Dynamic Code Generator based on systemConfig rules
  const generateDynamicCode = (ruleKey: keyof SystemFlexibilityConfig["codeRules"]): string => {
    const rule = systemConfig.codeRules[ruleKey];
    if (!rule) return `${ruleKey.toUpperCase()}-${Date.now()}`;
    const seq = rule.currentSequence;
    const formattedSeq = String(seq).padStart(rule.digits, "0");
    const code = `${rule.prefix}${formattedSeq}${rule.suffix || ""}`;

    // Auto increment sequence in configuration
    setSystemConfig((prev) => ({
      ...prev,
      codeRules: {
        ...prev.codeRules,
        [ruleKey]: {
          ...prev.codeRules[ruleKey],
          currentSequence: prev.codeRules[ruleKey].currentSequence + 1,
          example: `${prev.codeRules[ruleKey].prefix}${String(
            prev.codeRules[ruleKey].currentSequence + 1
          ).padStart(prev.codeRules[ruleKey].digits, "0")}`,
        },
      },
    }));

    return code;
  };

  // Handler: Create Report with Offline Queue Support
  const handleCreateReport = async (data: any) => {
    const result=await requestOperation('create_report',data,'تم حفظ البلاغ بالخادم');
    if(result)setPreselectedAssetForReport(null);return Boolean(result);
  };

  // Handler: Update Report Status with Offline Queue Support
  const handleUpdateReportStatus = async (id: string, newStatus: ReportStatus, notes?: string, downtimeHours?: number, usedParts?: any[], signOff?: Report['technicianSignOff'], serviceRestored?: boolean, assignedTo?: string, expectedVersion?: number) => {
    const report=reports.find(r=>r.id===id);
    return Boolean(await requestOperation('update_report_status',{id,status:newStatus,technicianNotes:notes,downtimeHours,usedParts,signOff,serviceRestored,assignedTo,version:expectedVersion??report?.version??1},'تم حفظ أمر العمل وتحديث الرصيد المرتبط'));
  };

  // Handler: Create Asset with Offline Queue Support
  const handleCreateAsset = async (data: any) => Boolean(await requestOperation('create_asset',data,'تم تسجيل الأصل بانتظار فحص القبول'));

  const handleOpenReportForAsset = (asset: Asset) => {
    setPreselectedAssetForReport(asset);
    setIsNewReportOpen(true);
  };

  // Handler: Inventory Movement with Offline Queue Support
  const handleAddMovement = async (movement: Omit<InventoryMovement,'id'|'timestamp'>) => Boolean(await requestOperation('inventory_movement',movement,'تم حفظ حركة المخزون'));
  const handleAddInvoice = async (invoice: Omit<Invoice,'id'>) => Boolean(await requestOperation('create_invoice',invoice,'تم حفظ مسودة القيد بعد التحقق من المطابقة'));

  const saveSupport = async (entity: string, record: any) => Boolean(await requestOperation('save_support',{entity,record},'تم حفظ الخدمة المساندة'));
  const deleteSupport = async (entity: string, id: string) => Boolean(await requestOperation('delete_support',{entity,id},'تم حذف السجل'));
  const handleAddTransport = async (data: any) => saveSupport('transportRequests',{...data,status:'جديد'});
  const handleUpdateTransportRequestStatus = async (id: string,status: TransportRequest['status']) => saveSupport('transportRequests',{...transportRequests.find(x=>x.id===id),status});
  const handleAddCompound = async (data: any) => saveSupport('compounds',data);
  const handleUpdateCompound = async (id: string,updates: any) => saveSupport('compounds',{...compounds.find(x=>x.id===id),...updates,id});
  const handleDeleteCompound = async (id: string) => deleteSupport('compounds',id);
  const handleAddHousingUnit = async (data: any) => saveSupport('housingUnits',data);
  const handleUpdateHousingUnit = async (id: string,updates: any) => saveSupport('housingUnits',{...housingUnits.find(x=>x.id===id),...updates,id});
  const handleDeleteHousingUnit = async (id: string) => deleteSupport('housingUnits',id);
  const handleAddServiceRequest = async (data: any) => saveSupport('serviceRequests',{...data,status:'جديد'});
  const handleUpdateServiceRequestStatus = async (id: string,status: string) => saveSupport('serviceRequests',{...serviceRequests.find(x=>x.id===id),status});
  const handleSaveSystemConfig = async (config: SystemFlexibilityConfig) => Boolean(await requestOperation('save_system_config',config,'تم حفظ إعدادات المنشأة'));
  const handleResetSystemConfig = async () => { await requestOperation('save_system_config',initialSystemConfig,'تم حفظ الإعدادات الافتراضية'); };

  const handleCreatePurchaseOrder = async (order: Omit<PurchaseOrder,'id'|'orderDate'>) => Boolean(await requestOperation('create_order',order,'تم حفظ مسودة طلب الشراء؛ لم تُرسل للمورد'));
  const handleUpdatePurchaseOrder = async (orderId: string, updates: any) => Boolean(await requestOperation('update_order',{...updates,id:orderId},'تم تحديث أمر الشراء'));

  // Automated PPM Calibration Execution Handler with Offline Queue Support
  const handleExecuteCalibration = async (data: any) => Boolean(await requestOperation('calibrate_ppm',data,'تم حفظ نتيجة الفحص؛ الشهادة الناجحة تنتظر مراجعًا مستقلًا'));
  const handleAutoReplenish = async () => {
    const groups=new Map<string,Product[]>();
    for(const product of products.filter(p=>p.stock<=p.minStockAlert)){const group=groups.get(product.supplierName)||[];group.push(product);groups.set(product.supplierName,group);}
    for(const [supplierName,items] of groups){const result=await requestOperation('create_order',{supplierName,items:items.map(p=>({productId:p.id,quantity:Math.max(1,p.minStockAlert*2-p.stock)}))},'تم إنشاء مسودة احتياج للمراجعة');if(!result)break;}
  };

  const urgentReportsCount = reports.filter(
    (r) => r.priority === "عاجل" && r.status !== "مغلق"
  ).length;



  return (
    <div data-optional="false" className="workspace-app min-h-screen bg-[#F6F9F8] dark:bg-[#0C1A19] text-[#193B3A] dark:text-[#E2ECE8] flex flex-col font-sans antialiased transition-colors duration-200" dir={i18n.language.startsWith("ar") ? "rtl" : "ltr"}>
      <a className="workspace-skip" href="#workspace-content">{i18n.language.startsWith("ar") ? "انتقل إلى المحتوى" : "Skip to content"}</a>
      <WorkspaceNav activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} urgentCount={urgentReportsCount} />
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#193B3A] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-[#126B68]/40 max-w-lg w-[90%] sm:w-auto animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold leading-snug">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-[#9CA3AF] hover:text-white transition-colors cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openNewReport={() => {
          setPreselectedAssetForReport(null);
          setIsNewReportOpen(true);
        }}
        openNewAsset={() => setIsNewAssetOpen(true)}
        openScanner={() => setIsScannerOpen(true)}
        urgentReportsCount={urgentReportsCount}
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onStartTour={() => (window as any).__startHospitalTour?.()}
        themePreference={themePreference}
        setThemePreference={setThemePreference}
        isDark={isDark}
        isNightShift={isNightShift}
        themeReason={themeReason}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        syncStatus={syncStatus}
        pendingCount={offlineQueue.length}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onTriggerSync={triggerSync}
        onOpenPushModal={() => setIsPushModalOpen(true)}
        isPushSubscribed={isPushSubscribed}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenAuditLog={handleOpenUserAuditLog}
        onOpenSystemConfig={() => setIsSystemConfigOpen(true)}
      />

      {/* Interactive Onboarding Tour for New Users */}
      <OnboardingTour
        setActiveTab={setActiveTab}
        openScanner={() => setIsScannerOpen(true)}
        openNewReport={() => setIsNewReportOpen(true)}
      />

      {/* Main View Area */}
      <main id="workspace-content" tabIndex={-1} className="workspace-content flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-8">
        <div className="workspace-breadcrumb" aria-label={i18n.language.startsWith("ar") ? "القسم الحالي" : "Current section"}>
          <span>{t("app.title")}</span><span aria-hidden="true">/</span><strong>{t(`nav.${activeTab}`)}</strong>
        </div>
        <Suspense fallback={<p role="status" className="p-6">جارٍ تحميل القسم…</p>}>
        {activeTab === "dashboard" && (
          <DashboardView
            currentUser={currentUser}
            reports={reports}
            inventory={products.filter(p=>p.category.includes("قطع غيار")).map(p=>({id:String(p.id),name:p.name,partNumber:p.productCode,unitPrice:p.price,stock:p.stock}))}
            assets={assets}
            products={products}
            sfdaAlerts={sfdaAlerts}
            onOpenSfdaModal={() => setIsSfdaModalOpen(true)}
            onOpenAuditModal={() => setIsAuditModalOpen(true)}
            setActiveTab={setActiveTab}
            openNewReport={() => {
              setPreselectedAssetForReport(null);
              setIsNewReportOpen(true);
            }}
            openScanner={() => setIsScannerOpen(true)}
            setSelectedReport={setSelectedReport}
            setSelectedAsset={setSelectedAsset}
            onUpdateReportStatus={handleUpdateReportStatus}
          />
        )}

        {activeTab === "reports" && (
          <ReportsView
            reports={reports}
            onOpenNewReport={() => {
              setPreselectedAssetForReport(null);
              setIsNewReportOpen(true);
            }}
            onSelectReport={setSelectedReport}
            onUpdateStatus={handleUpdateReportStatus}
            onOpenPushModal={() => setIsPushModalOpen(true)}
            isPushSubscribed={isPushSubscribed}
          />
        )}

        {activeTab === "assets" && (
          <AssetsView
            assets={assets}
            onSelectAsset={setSelectedAsset}
            onOpenNewAsset={() => setIsNewAssetOpen(true)}
            onReportAsset={handleOpenReportForAsset}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {activeTab === "ppm" && (
          <PpmView
            onApproveCalibration={async id=>Boolean(await requestOperation("approve_calibration",{id},"تم اعتماد المعايرة من مراجع مستقل"))}
            schedules={ppmSchedules}
            calibrationLogs={calibrationLogs}
            currentUserRole={currentUser.role}
            currentUser={currentUser}
            assets={assets}
            onExecuteCalibration={handleExecuteCalibration}
          />
        )}

        {activeTab === "manar" && <ManarAssistantView />}

        {activeTab === "inventory" && (
          <InventoryView
            products={products}
            movements={movements}
            onAddMovement={handleAddMovement}
            onAutoReplenish={handleAutoReplenish}
            currentUserRole={currentUser.role}
            currentUser={currentUser}
          />
        )}

        {activeTab === "logistics" && (
          <LogisticsView
            compounds={compounds}
            housingUnits={housingUnits}
            transportRequests={transportRequests}
            serviceRequests={serviceRequests}
            onAddCompound={handleAddCompound}
            onUpdateCompound={compound=>handleUpdateCompound(compound.id,compound)}
            onDeleteCompound={handleDeleteCompound}
            onAddHousingUnit={handleAddHousingUnit}
            onUpdateHousingUnit={unit=>handleUpdateHousingUnit(unit.id,unit)}
            onDeleteHousingUnit={handleDeleteHousingUnit}
            onAddServiceRequest={handleAddServiceRequest}
            onUpdateServiceRequestStatus={handleUpdateServiceRequestStatus}
            onAddTransportRequest={handleAddTransport}
            onUpdateTransportRequestStatus={handleUpdateTransportRequestStatus}
            housingUnitTypes={systemConfig.housingUnitTypes}
            housingStatuses={systemConfig.housingStatuses}
            onOpenSystemConfig={() => setIsSystemConfigOpen(true)}
          />
        )}

        {activeTab === "finance" && (
          <FinanceView
            onApproveInvoice={async id=>Boolean(await requestOperation("approve_invoice",{id},"تم اعتماد القيد الداخلي"))}
            contracts={contracts}
            onAddContract={async c=>Boolean(await requestOperation("save_contract",c,"تم حفظ العقد"))}
            onUpdateContract={async c=>Boolean(await requestOperation("save_contract",c,"تم تحديث العقد"))}
            onDeleteContract={async id=>Boolean(await requestOperation("delete_contract",{id},"تم حذف العقد"))}
            onRenewContract={async id=>{const contract=contracts.find(c=>c.id===id);if(contract){const date=new Date(contract.endDate);date.setFullYear(date.getFullYear()+1);return Boolean(await requestOperation("save_contract",{...contract,endDate:date.toISOString().slice(0,10)},"تم تجديد العقد"));}}}
            invoices={invoices}
            onAddInvoice={handleAddInvoice}
            purchaseOrders={purchaseOrders}
            currentUser={currentUser}
          />
        )}

        {activeTab === "marketplace" && (
          <MarketplaceView
            products={products}
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            onCreateOrder={handleCreatePurchaseOrder}
            onUpdateOrder={handleUpdatePurchaseOrder}
          />
        )}
        </Suspense>
      </main>

      <Suspense fallback={<p role="status" className="fixed bottom-24 inset-x-4 bg-white border rounded-xl p-3 z-50">جارٍ تحميل النافذة…</p>}>
      {/* Global Modals */}
      {isNewReportOpen && (<NewReportModal
        isOpen={isNewReportOpen}
        onClose={() => {
          setIsNewReportOpen(false);
          setPreselectedAssetForReport(null);
        }}
        onSubmit={handleCreateReport}
        preselectedAssetId={preselectedAssetForReport?.id}
        preselectedAssetName={preselectedAssetForReport?.name}
        preselectedAssetLocation={preselectedAssetForReport?.location}
        categories={systemConfig.reportCategories}
        hospitalLocations={systemConfig.hospitalLocations}
      />)}

      {isNewAssetOpen && (<NewAssetModal
        isOpen={isNewAssetOpen}
        onClose={() => setIsNewAssetOpen(false)}
        onSubmit={handleCreateAsset}
        departments={systemConfig.departments}
        locations={systemConfig.hospitalLocations}
      />)}

      {isScannerOpen && (<ScanModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        assets={assets}
        products={products}
        purchaseOrders={purchaseOrders}
        reports={reports}
        onFoundAsset={(asset) => setSelectedAsset(asset)}
        onAddMovement={handleAddMovement}
        onCreatePurchaseOrder={handleCreatePurchaseOrder}
        currentUser={currentUser}
      />)}

      {selectedReport && (<ReportDetailModal
        report={selectedReport}
        inventory={products.filter(p=>p.category.includes("قطع غيار")).map(p=>({id:String(p.id),name:p.name,partNumber:p.productCode,unitPrice:p.price,stock:p.stock}))}
        currentUser={currentUser}
        assets={assets}
        onClose={() => setSelectedReport(null)}
        onUpdateStatus={handleUpdateReportStatus}
        onOpenAsset={(asset) => setSelectedAsset(asset)}
      />)}

      {selectedAsset && (<AssetDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onReportAsset={handleOpenReportForAsset}
      />)}

      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        users={users}
        currentUser={currentUser}
        onSelectUser={() => { void logout();
        }}
      />

      {/* Offline Synchronization & Cache Manager Modal */}
      {isSyncModalOpen && (<SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={handleToggleSimulatedOffline}
        syncStatus={syncStatus}
        offlineQueue={offlineQueue}
        onTriggerSync={triggerSync}
        onClearQueue={handleClearQueue}
        lastSyncTime={lastSyncTime}
        storageStats={storageStats}
      />)}

      {/* SFDA Medical Safety Alerts & Recalls Modal */}
      {isSfdaModalOpen && (
        <SfdaAlertsModal
          isOpen={isSfdaModalOpen}
          onClose={() => setIsSfdaModalOpen(false)}
          alerts={sfdaAlerts}
          assets={assets}
          onUpdateAlert={handleUpdateSfdaAlert}
          onOpenAssetDetail={(asset) => setSelectedAsset(asset)}
        />
      )}

      {/* CBAHI & SFDA Regulatory Compliance Audit Export Modal */}
      {isAuditModalOpen && (
        <AuditExportModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          assets={assets}
          reports={reports}
          ppmSchedules={ppmSchedules}
          calibrationLogs={calibrationLogs}
        />
      )}

      {/* Push Notifications Management Modal (Service Worker) */}
      {isPushModalOpen && (
        <PushNotificationModal
          isOpen={isPushModalOpen}
          onClose={() => setIsPushModalOpen(false)}
          staffName={currentUser.name}
          userRole={currentUser.roleTitle}
        />
      )}

      {/* Real-time Push Notification Alert Toast */}
      {pushAlertToast && (
        <PushNotificationToast
          notification={pushAlertToast}
          onClose={() => setPushAlertToast(null)}
          onOpenReport={(reportId) => {
            const found = reports.find((r) => r.id === reportId);
            if (found) {
              setSelectedReport(found);
            } else {
              setActiveTab("reports");
            }
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar (Fixed for quick thumb access) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openScanner={() => setIsScannerOpen(true)}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        urgentReportsCount={urgentReportsCount}
        hasPendingSync={offlineQueue.length > 0}
      />

      {/* Comprehensive Mobile Navigation Drawer / Dropdown */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openNewReport={() => {
          setPreselectedAssetForReport(null);
          setIsNewReportOpen(true);
        }}
        openScanner={() => setIsScannerOpen(true)}
        urgentReportsCount={urgentReportsCount}
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        onStartTour={() => (window as any).__startHospitalTour?.()}
        themePreference={themePreference}
        setThemePreference={setThemePreference}
        isDark={isDark}
        isNightShift={isNightShift}
        themeReason={themeReason}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        syncStatus={syncStatus}
        pendingCount={offlineQueue.length}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onTriggerSync={triggerSync}
        onOpenPushModal={() => setIsPushModalOpen(true)}
        isPushSubscribed={isPushSubscribed}
        onOpenSfdaModal={() => setIsSfdaModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenUserAuditLog={handleOpenUserAuditLog}
        onOpenSystemConfig={() => setIsSystemConfigOpen(true)}
      />

      {/* Flexible System-Wide Rules & Settings Modal */}
      {isSystemConfigOpen && (<SystemConfigModal
        isOpen={isSystemConfigOpen}
        onClose={() => setIsSystemConfigOpen(false)}
        config={systemConfig}
        onSaveConfig={handleSaveSystemConfig}
        onResetDefaults={handleResetSystemConfig}
      />)}

      {/* User Activity & Governance Audit Log Modal */}
      {isUserAuditLogModalOpen && (
        <UserAuditLogModal
          isOpen={isUserAuditLogModalOpen}
          onClose={() => setIsUserAuditLogModalOpen(false)}
          users={users}
          currentUser={currentUser}
          auditLogs={auditLogs}
          initialSelectedUserId={selectedAuditUserId}
          onSelectUserForSwitch={() => { void logout();
          }}
        />
      )}

      {/* Medical Device Calibration Expiry Alert Modal (< 7 days) upon User Login */}
      <CalibrationAlertModal
        isOpen={isCalibrationAlertOpen}
        onClose={() => setIsCalibrationAlertOpen(false)}
        expiringItems={expiringCalibrations}
        onNavigateToPpm={() => {
          setActiveTab("ppm");
          setIsCalibrationAlertOpen(false);
        }}
        userName={currentUser.name}
        roleTitle={currentUser.roleTitle}
      />
      </Suspense>
    </div>
  );
}



