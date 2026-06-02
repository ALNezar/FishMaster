// Web Push Service Worker for FishMaster

self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('[SW] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push received:', data);

    const title = data.title || 'FishMaster Alert';
    const options = {
      body: data.body || 'You have a new alert',
      icon: data.icon || '/android/launchericon-192x192.png',
      badge: '/android/launchericon-96x96.png',
      vibrate: [200, 100, 200, 100, 200],
      data: {
        url: data.url || '/alerts'
      },
      requireInteraction: true // Keep notification until user dismisses it
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('[SW] Failed to parse push data', e);
  }
});

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
