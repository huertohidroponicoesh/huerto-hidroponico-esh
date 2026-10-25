// =========================================================
// FIREBASE MESSAGING SERVICE WORKER - HUERTO ESH
// =========================================================

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCPr2QN1gvo5Ngekcos86uo2maX_mHrGF0",
  authDomain: "huerto-hidroponico-esh.firebaseapp.com",
  databaseURL: "https://huerto-hidroponico-esh-default-rtdb.firebaseio.com",
  projectId: "huerto-hidroponico-esh",
  storageBucket: "huerto-hidroponico-esh.firebasestorage.app",
  messagingSenderId: "380114491557",
  appId: "1:380114491557:web:bf85a1b207638093abd54c"
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || "🚨 Huerto ESH: Alerta del Sistema";
  const notificationBody = payload.notification?.body || payload.data?.body || "Se ha detectado una variación en los parámetros.";
  
  const notificationTag = notificationTitle.includes('pH') ? 'alerta-ph' : 
                          notificationTitle.includes('Conductividad') ? 'alerta-ce' : 
                          notificationTitle.includes('Térmica') ? 'alerta-temp' : 'alerta-general';

  const notificationOptions = {
    body: notificationBody,
    icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
    badge: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: notificationTag,
    renotify: true,
    data: {
      url: payload.notification?.click_action || './index.html'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificación clickeada:', event.notification);
  event.notification.close();

  const targetUrl = event.notification.data?.url || './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});