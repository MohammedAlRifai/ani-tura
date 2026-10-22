import { useState, useEffect, useCallback, useRef } from "react";
import {
  pushService,
  playNotificationTone,
} from "../services/pushNotificationService";
import {
  PushSubscriber,
  PushNotificationLog,
  PushNotificationPreferences,
} from "../types";

export function usePushNotifications(onNotificationReceived?: (data: any) => void) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [activeSubscribers, setActiveSubscribers] = useState<PushSubscriber[]>([]);
  const [logs, setLogs] = useState<PushNotificationLog[]>([]);
  const [preferences, setPreferences] = useState<PushNotificationPreferences>(
    pushService.getPreferences()
  );
  const [lastReceivedAlert, setLastReceivedAlert] = useState<any>(null);

  // Store callback in ref to prevent infinite re-render loops from unstable function references
  const onNotificationReceivedRef = useRef(onNotificationReceived);
  onNotificationReceivedRef.current = onNotificationReceived;

  const isCheckingRef = useRef(false);

  // Check current status and service worker
  const checkStatus = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      const supported = pushService.isPushSupported();
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      setPermission(pushService.getPermissionStatus());

      // Auto register SW
      await pushService.registerServiceWorker();

      // Check current subscription
      const sub = await pushService.getSubscription();
      setIsSubscribed(false);

      // Fetch config & subscriber count
      const config = await pushService.fetchVapidConfig();
      if (config) {
        setIsSubscribed(Boolean(sub&&config.subscribers?.some(item=>item.endpoint===sub.endpoint)));
        setSubscribersCount(config.totalSubscribers || 0);
        setActiveSubscribers(config.subscribers || []);
      }

      // Fetch logs
      const logData = await pushService.fetchLogs();
      if (logData && logData.logs) {
        setLogs(logData.logs);
      }
    } catch (err) {
      console.warn("[usePushNotifications] checkStatus warning:", err);
    } finally {
      setIsLoading(false);
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkStatus();
    window.addEventListener("ain-session-changed",checkStatus);

    // Listen to messages from Service Worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === "PUSH_NOTIFICATION_RECEIVED") {
        const payload = event.data.payload || {};
        setLastReceivedAlert(payload);

        // Sound tone
        const currentPrefs = pushService.getPreferences();
        if (currentPrefs.soundEnabled) {
          playNotificationTone(payload.priority || "عاجل");
        }

        if (onNotificationReceivedRef.current) {
          onNotificationReceivedRef.current(payload);
        }

        // Refresh logs and status safely
        checkStatus();
      }

      if (event.data.type === "NOTIFICATION_CLICKED") {
        console.log("[usePushNotifications] Notification clicked in background:", event.data);
      }
    };

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener("ain-session-changed",checkStatus);
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
      }
    };
  }, [checkStatus]);

  const subscribe = async (info?: {
    staffName?: string;
    role?: string;
    department?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await pushService.subscribe(info || {});
      await checkStatus();
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const res = await pushService.unsubscribe();
      await checkStatus();
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async (staffName?: string) => {
    const res = await pushService.sendTestNotification(staffName);
    // update logs
    setTimeout(() => {
      checkStatus();
    }, 500);
    return res;
  };

  const broadcastAlert = async (params: {
    title: string;
    body: string;
    priority?: "عاجل" | "حرج" | "متوسط";
    reportId?: string;
  }) => {
    const res = await pushService.broadcastAlert(params);
    setTimeout(() => {
      checkStatus();
    }, 500);
    return res;
  };

  const updatePreferences = (newPrefs: Partial<PushNotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    pushService.savePreferences(updated);
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribersCount,
    activeSubscribers,
    logs,
    preferences,
    lastReceivedAlert,
    subscribe,
    unsubscribe,
    sendTestNotification,
    broadcastAlert,
    updatePreferences,
    refreshStatus: checkStatus,
  };
}
