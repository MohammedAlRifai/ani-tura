// Ain Al-Mustashfa - Biomedical & Hospital Maintenance Service Worker
// Web Push Notifications & Background Alert Handler

const CACHE_NAME = 'ain-almustashfa-v1';

self.addEventListener('install', (event) => {
  // Activate worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Become available to all clients immediately
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[Service Worker] Ain Al-Mustashfa Service Worker Activated');
    })
  );
});

// Listen for incoming Web Push Notifications from server
self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 تنبيه عين المستشفى',
    body: 'بلاغ صيانة طبي جديد أو تحديث حالة أجهزة حيوية.',
    icon: '/assets/images/favicon.png',
    badge: '/assets/images/favicon.png',
    tag: 'hospital-maintenance-alert',
    data: {
      url: '/',
      timestamp: Date.now(),
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
        data: {
          ...data.data,
          ...(payload.data || {}),
        },
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/assets/images/favicon.png',
    badge: data.badge || '/assets/images/favicon.png',
    tag: data.tag || `hospital-alert-${Date.now()}`,
    data: data.data || { url: '/' },
    // Distinct medical urgency vibration pattern: [short, pause, short, pause, long]
    vibrate: data.data?.soundEnabled===false?[]:[200, 100, 200, 100, 400],
    silent: data.data?.soundEnabled===false,
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
    renotify: true,
    dir: 'rtl',
    lang: 'ar',
    actions: [
      {
        action: 'open-report',
        title: '🔍 معاينة البلاغ',
      },
      {
        action: 'dismiss',
        title: '✕ إغلاق',
      },
    ],
  };

  event.waitUntil(
    Promise.all([
      // Show native system desktop/mobile push notification
      self.registration.showNotification(data.title, notificationOptions),
      // Inform active tabs/clients if any are currently open
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_RECEIVED',
            payload: data,
          });
        });
      }),
    ])
  );
});

// Handle Notification Clicks (even when browser/app was in background)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and inform it of the clicked report
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: notificationData,
          });
          return;
        }
      }

      // If no window is open, open a new window with the app
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle direct messages from application window
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_LOCAL_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || 'عين المستشفى', {
      body: options?.body || 'تنبيه من إدارة الصيانة الطبية',
      icon: options?.icon || '/assets/images/favicon.png',
      badge: '/assets/images/favicon.png',
      tag: options?.tag || `local-alert-${Date.now()}`,
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar',
      data: options?.data || { url: '/' },
      requireInteraction: true,
      actions: [
        { action: 'open-report', title: '🔍 معاينة البلاغ' },
        { action: 'dismiss', title: '✕ إغلاق' },
      ],
    });
  }
});
