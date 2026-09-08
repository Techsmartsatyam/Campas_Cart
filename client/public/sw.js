const CACHE_NAME = 'nearcart-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Install Event - Pre-cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Safe caching policy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exclude non-GET requests, API requests, and Socket.IO connections from caching
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('razorpay.com')
  ) {
    return; // Pass through to network directly
  }

  // SPA Navigation requests -> Network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Static Assets (JS, CSS, Images) -> Stale while revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Event - Handle FCM & Web Push notifications in background
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received');

  if (!event.data) {
    console.warn('[ServiceWorker] Push event received with empty data');
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
    console.log('[ServiceWorker] Parsed push payload:', payload);
  } catch (e) {
    const rawText = event.data.text();
    console.log('[ServiceWorker] Push payload text:', rawText);
    payload = {
      data: {
        title: 'NearCart Notification',
        body: rawText,
      },
    };
  }

  const data = payload.data || {};
  const notification = payload.notification || {};

  const notificationTitle =
    data.title ||
    notification.title ||
    payload.title ||
    'NearCart Notification';

  const notificationBody =
    data.body ||
    notification.body ||
    data.message ||
    payload.body ||
    payload.message ||
    'You have a new notification from NearCart';

  const targetUrl =
    payload.fcmOptions?.link ||
    data.click_action ||
    data.url ||
    notification.click_action ||
    (data.orderId ? `/orders/${data.orderId}` : '/notifications');

  const iconUrl = notification.icon || data.icon || '/icon-192.png';
  const badgeUrl = notification.badge || data.badge || '/favicon.svg';

  const notificationOptions = {
    body: notificationBody,
    icon: iconUrl,
    badge: badgeUrl,
    tag: data.orderId ? `order-${data.orderId}` : `nearcart-${Date.now()}`,
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: targetUrl,
      orderId: data.orderId || null,
    },
  };

  console.log('[ServiceWorker] Displaying notification:', notificationTitle, notificationOptions);

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Notification Click Event - Focus or open tab & navigate to target order/notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.notification);
  event.notification.close();

  const rawTargetUrl = event.notification.data?.url || '/notifications';
  const fullTargetUrl = new URL(rawTargetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (
            client.url.includes(self.location.origin) &&
            'focus' in client
          ) {
            client.navigate(fullTargetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(fullTargetUrl);
        }
      })
  );
});


