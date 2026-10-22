import {
  Report,
  Asset,
  Product,
  InventoryMovement,
  PpmSchedule,
  CalibrationWorkOrder,
  PurchaseOrder,
  Invoice,
  OfflineQueueItem,
} from "../types";

export const STORAGE_KEYS = {
  REPORTS: "ain_reports_cache_v1",
  ASSETS: "ain_assets_cache_v1",
  PRODUCTS: "ain_products_cache_v1",
  MOVEMENTS: "ain_movements_cache_v1",
  PPM_SCHEDULES: "ain_ppm_schedules_cache_v1",
  CALIBRATION_LOGS: "ain_calibration_logs_cache_v1",
  PURCHASE_ORDERS: "ain_purchase_orders_cache_v1",
  INVOICES: "ain_invoices_cache_v1",
  CONTRACTS: "ain_supplier_contracts_cache_v1",
  SFDA_ALERTS: "ain_sfda_alerts_cache_v1",
  AUDIT_LOGS: "ain_audit_logs_cache_v1",
  COMPOUNDS: "ain_compounds_cache_v1",
  HOUSING_UNITS: "ain_housing_units_cache_v1",
  TRANSPORT_REQUESTS: "ain_transport_requests_cache_v1",
  SERVICE_REQUESTS: "ain_service_requests_cache_v1",
  SYSTEM_CONFIG: "ain_system_config_cache_v1",
  OFFLINE_QUEUE: "ain_offline_queue_v1",
  LAST_SYNC: "ain_last_sync_timestamp",
  OFFLINE_OVERRIDE: "ain_simulated_offline_mode",
};

/**
 * Safely reads a key from localStorage with a fallback
 */
export function loadCachedData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[OfflineStorage] Failed to read ${key} from storage:`, e);
    return fallback;
  }
}

/**
 * Safely writes data to localStorage
 */
export function saveCachedData<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn(`[OfflineStorage] Failed to write ${key} to storage:`, e);
    return false;
  }
}

/**
 * Retrieves the list of pending offline actions queued for synchronization
 */
export function getOfflineQueue(): OfflineQueueItem[] {
  return loadCachedData<OfflineQueueItem[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
}

/**
 * Adds an operation to the offline queue
 */
export function addToOfflineQueue(
  type: OfflineQueueItem["type"],
  payload: any,
  description: string
): OfflineQueueItem {
  const queue = getOfflineQueue();
  const newItem: OfflineQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
    description,
  };

  const updatedQueue = [newItem, ...queue];
  saveCachedData(STORAGE_KEYS.OFFLINE_QUEUE, updatedQueue);
  return newItem;
}

/**
 * Removes an item from the offline queue after successful sync
 */
export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue();
  const filtered = queue.filter((item) => item.id !== id);
  saveCachedData(STORAGE_KEYS.OFFLINE_QUEUE, filtered);
}

/**
 * Updates an item status in the queue
 */
export function updateQueueItem(
  id: string,
  updates: Partial<OfflineQueueItem>
): void {
  const queue = getOfflineQueue();
  const updated = queue.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  saveCachedData(STORAGE_KEYS.OFFLINE_QUEUE, updated);
}

/**
 * Clears the entire offline sync queue
 */
export function clearOfflineQueue(): void {
  saveCachedData(STORAGE_KEYS.OFFLINE_QUEUE, []);
}

/**
 * Get or set simulated offline mode for testing
 */
export function getSimulatedOffline(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.OFFLINE_OVERRIDE) === "true";
  } catch {
    return false;
  }
}

export function setSimulatedOffline(isOffline: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_OVERRIDE, isOffline ? "true" : "false");
  } catch (e) {
    console.warn("Could not save simulated offline mode:", e);
  }
}

/**
 * Last sync timestamp helpers
 */
export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch {
    return null;
  }
}

export function updateLastSyncTime(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.warn("Could not save last sync time:", e);
  }
}

/**
 * Storage metrics summary for health inspect
 */
export function getStorageStats() {
  const queue = getOfflineQueue();
  const lastSync = getLastSyncTime();
  const reports = loadCachedData<Report[]>(STORAGE_KEYS.REPORTS, []);
  const assets = loadCachedData<Asset[]>(STORAGE_KEYS.ASSETS, []);
  const products = loadCachedData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const calibrationLogs = loadCachedData<CalibrationWorkOrder[]>(
    STORAGE_KEYS.CALIBRATION_LOGS,
    []
  );

  return {
    pendingQueueCount: queue.length,
    lastSync,
    cachedReportsCount: reports.length,
    cachedAssetsCount: assets.length,
    cachedProductsCount: products.length,
    cachedCalibrationLogsCount: calibrationLogs.length,
  };
}

/**
 * Resets all local cache
 */
export function clearAllLocalCache(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn("Failed to clear local cache:", e);
  }
}
