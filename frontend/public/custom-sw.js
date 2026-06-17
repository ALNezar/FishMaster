// Web Push Service Worker for FishMaster
console.log('[SW] FishMaster custom-sw v1.0.0 loaded');

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});

async function handlePush(event) {
  let title = 'FishMaster Alert';
  let options = {
    body: 'Open the app to view alerts.',
    icon: '/android/launchericon-192x192.png',
    badge: '/android/launchericon-96x96.png',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: '/alerts' },
    requireInteraction: true // Keep notification until user dismisses it
  };

  try {
    if (!event.data) {
      console.log('[SW] Push event but no data');
      return self.registration.showNotification(title, options);
    }

    const data = event.data.json();
    console.log('[SW] Push received:', data);

    title = data.title || title;

    options = {
      ...options,
      body: data.body || options.body,
      icon: data.icon || options.icon,
      data: {
        url: data.url || options.data.url
      }
    };

    return self.registration.showNotification(title, options);

  } catch (error) {
    console.error('[SW] Failed to process push payload', error);
    return self.registration.showNotification(title, options);
  }
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      const targetUrl = event.notification.data.url;
      
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // If so, just focus it.
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
