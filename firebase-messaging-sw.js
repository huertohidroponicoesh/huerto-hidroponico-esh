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

// Manejador de mensajes en segundo plano (Background Message Handler)
messaging.setBackgroundMessageHandler((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);
  
  // Extraer de manera segura los datos enviados por el servidor Node.js
  const notificationTitle = payload.notification?.title || payload.data?.title || "🚨 Huerto ESH: Alerta del Sistema";
  const notificationBody = payload.notification?.body || payload.data?.body || "Se ha detectado una variación en los parámetros.";
  
  // Usar un tag único basado en el título para que alertas del mismo tipo se actualicen y no saturen la pantalla
  const notificationTag = notificationTitle.includes('pH') ? 'alerta-ph' : 
                          notificationTitle.includes('Conductividad') ? 'alerta-ce' : 
                          notificationTitle.includes('Térmica') ? 'alerta-temp' : 'alerta-general';

  const notificationOptions = {
    body: notificationBody,
    icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
    badge: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
    vibrate: [300, 100, 300, 100, 300], // Patrón de vibración de atención
    tag: notificationTag, // Agrupa o reemplaza notificaciones del mismo tipo
    renotify: true,      // Vuelve a vibrar/sonar aunque sea del mismo tag
    data: {
      url: payload.notification?.click_action || './index.html'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejador de clics en la notificación flotante
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificación clickeada:', event.notification);
  event.notification.close();

  const targetUrl = event.notification.data?.url || './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Buscar si ya hay una pestaña abierta de la app para enfocarla en lugar de abrir una nueva
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ninguna pestaña abierta, abrir una nueva con la ruta del huerto
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});