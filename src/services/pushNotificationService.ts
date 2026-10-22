// Ain Al-Mustashfa - Biomedical & Hospital Maintenance
// Web Push Notifications & Service Worker Service

import { PushSubscriber, PushNotificationLog, PushNotificationPreferences } from "../types";

const PREFS_KEY = "ain_push_preferences_v1";

export const defaultPushPreferences: PushNotificationPreferences = {
  urgentReports: true,
  statusUpdates: true,
  lifeSupportAlerts: true,
  sfdaRecalls: true,
  soundEnabled: true,
};

// Convert Base64 URL-Safe key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Play medical alert sound using Web Audio API
export function playNotificationTone(priority: "عاجل" | "متوسط" | "منخفض" | "test" = "متوسط") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (priority === "عاجل" || priority === "test") {
      // Urgent double beep: High chime 880Hz -> 1046Hz
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1046.5, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Subtle standard notification chime: 659Hz (E5) -> 880Hz (A5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(880, now + 0.1);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    console.warn("Could not play audio chime:", err);
  }
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
  }

  public isPushSupported(): boolean {
    return this.isSupported;
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  }

  // Register or get active Service Worker
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn("Service Worker / Push notifications not supported in this browser.");
      return null;
    }

    try {
      if (this.swRegistration) {
        return this.swRegistration;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      this.swRegistration = registration;
      console.log("[Push Service] Service Worker registered with scope:", registration.scope);
      return registration;
    } catch (err) {
      console.error("[Push Service] Service Worker registration failed:", err);
      return null;
    }
  }

  // Check if current device is already subscribed
  public async getSubscription(): Promise<PushSubscription | null> {
    try {
      const reg = await this.registerServiceWorker();
      if (!reg) return null;
      return await reg.pushManager.getSubscription();
    } catch (err) {
      console.warn("[Push Service] Error retrieving push subscription:", err);
      return null;
    }
  }

  // Fetch VAPID Public Key and backend configuration
  public async fetchVapidConfig(): Promise<{ publicKey: string; totalSubscribers: number; subscribers: PushSubscriber[] }> {
    try {
      const res = await fetch("/api/notifications/config");
      if (!res.ok) {
        return { publicKey: "", totalSubscribers: 0, subscribers: [] };
      }
      return await res.json();
    } catch {
      // Safe fallback when server is starting or network is offline
      return { publicKey: "", totalSubscribers: 0, subscribers: [] };
    }
  }

  // Subscribe current device to Push Notifications
  public async subscribe(params: {
    staffName?: string;
    role?: string;
    department?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported) {
      return {
        success: false,
        message: "المتصفح الحالي لا يدعم إشعارات الدفع أو تقنية Service Worker.",
      };
    }

    try {
      // 1. Request user permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return {
          success: false,
          message:
            permission === "denied"
              ? "تم رفض الإذن من المتصفح. يرجى تفعيل الإشعارات من إعدادات الموقع أو المتصفح."
              : "لم يتم منح إذن الإشعارات من المستخدم.",
        };
      }

      // 2. Ensure Service Worker is registered
      const registration = await this.registerServiceWorker();
      if (!registration) {
        return {
          success: false,
          message: "فشل في تسجيل وتفعيل Service Worker بالمتصفح.",
        };
      }

      // 3. Get server VAPID key
      const config = await this.fetchVapidConfig();
      if (!config.publicKey) {
        return {
          success: false,
          message: "مفتاح VAPID العام غير متوفر من الخادم.",
        };
      }

      // 4. Check for existing subscription or create new
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(config.publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      // 5. Send subscription to backend
      const device = `${navigator.platform || "Web"} • ${navigator.userAgent.includes("Mobile") ? "هاتف محمول" : "محطة مكتبية"}`;

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences:this.getPreferences(),
          subscription,
          staffName: params.staffName || "كادر طبي / فني",
          role: params.role || "مهندس صيانة أجهزة طبية",
          department: params.department || "الهندسة الطبية",
          device,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to store subscription on server");
      }

      const data = await res.json();

      // Show welcome local notification via Service Worker
      await this.showLocalNotification("✅ تم تفعيل إشعارات عين المستشفى", {
        body: `مرحباً بك ${params.staffName || "زميلنا في الكادر الطبي"}. ستصلك التنبيهات والبلاغات الطبية فورياً حتى عند إغلاق التطبيق.`,
      });

      return {
        success: true,
        message: data.message || "تم تفعيل إشعارات الدفع بنجاح!",
      };
    } catch (err: any) {
      console.error("[Push Service] Subscribe error:", err);
      return {
        success: false,
        message: `حدث خطأ أثناء تفعيل الإشعارات: ${err.message || err}`,
      };
    }
  }

  // Unsubscribe device
  public async unsubscribe(): Promise<{ success: boolean; message: string }> {
    try {
      const subscription = await this.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      return {
        success: true,
        message: "تم إلغاء تفعيل إشعارات الدفع بنجاح.",
      };
    } catch (err: any) {
      console.error("[Push Service] Unsubscribe error:", err);
      return {
        success: false,
        message: `فشل إلغاء الاشتراك: ${err.message || err}`,
      };
    }
  }

  // Send test push notification from backend
  public async sendTestNotification(staffName?: string): Promise<any> {
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffName: staffName || "الكادر الطبي المعتمد",
          title: "🔔 تجربة إشعار دفع (Service Worker Push)",
          body: "نظام إشعارات الخلفية لمنظومة عين المستشفى نشط ويعمل بكفاءة لتنبيهك بالبلاغات العاجلة.",
        }),
      });

      if (!res.ok) throw new Error("Test notification request failed");
      const data = await res.json();
      playNotificationTone("test");
      return data;
    } catch (err) {
      console.error("[Push Service] Test notification failed:", err);
      throw err;
    }
  }

  // Broadcast emergency or clinical maintenance alert
  public async broadcastAlert(params: {
    title: string;
    body: string;
    priority?: "عاجل" | "حرج" | "متوسط";
    reportId?: string;
  }): Promise<any> {
    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) throw new Error("Broadcast request failed");
      const data = await res.json();
      playNotificationTone(params.priority === "متوسط" ? "متوسط" : "عاجل");
      return data;
    } catch (err) {
      console.error("[Push Service] Broadcast alert failed:", err);
      throw err;
    }
  }

  // Fetch Push Notification Logs
  public async fetchLogs(): Promise<{ logs: PushNotificationLog[]; totalSubscribers: number }> {
    try {
      const res = await fetch("/api/notifications/logs");
      if (!res.ok) {
        return { logs: [], totalSubscribers: 0 };
      }
      return await res.json();
    } catch {
      // Safe fallback when server is starting or network is offline
      return { logs: [], totalSubscribers: 0 };
    }
  }

  // Trigger local notification via Service Worker directly
  public async showLocalNotification(title: string, options?: NotificationOptions) {
    try {
      const reg = await this.registerServiceWorker();
      if (reg && reg.showNotification && Notification.permission === "granted") {
        await reg.showNotification(title, {
          icon: "/assets/images/favicon.png",
          badge: "/assets/images/favicon.png",
          vibrate: [200, 100, 200],
          dir: "rtl",
          lang: "ar",
          ...options,
        } as any);
      }
    } catch (err) {
      console.warn("Could not show local notification:", err);
    }
  }

  // Preferences Storage
  public getPreferences(): PushNotificationPreferences {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        return { ...defaultPushPreferences, ...JSON.parse(stored) };
      }
    } catch (e) {
      // ignore
    }
    return defaultPushPreferences;
  }

  public savePreferences(prefs: PushNotificationPreferences) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      void fetch("/api/notifications/preferences",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(prefs)}).catch(()=>{});
    } catch (e) {
      // ignore
    }
  }
}

export const pushService = new PushNotificationService();
