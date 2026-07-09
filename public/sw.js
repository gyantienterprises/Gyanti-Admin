// public/sw.js
self.addEventListener("push", function (event) {
  let data = {
    title: "New Lead Received!",
    body: "You have a new submission.",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
      ...(data.data || {}),
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Opens (or focuses) the dashboard when the user taps the notification.
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      }),
  );
});

// Capture background message events sent straight from your EventSource runtime loop
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "LIVE_LEAD_NOTIFICATION") {
    const options = {
      body: event.data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200],
    };
    self.registration.showNotification(event.data.title, options);
  }
});
