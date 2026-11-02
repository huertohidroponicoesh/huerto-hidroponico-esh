// =========================================================
// MÓDULO INDEPENDIENTE: OBSERVADOR DE CAMBIOS Y PUSH 24/7
// =========================================================

// Registrar el timestamp exacto en que abrió la aplicación para ignorar eventos antiguos
const tiempoInicioApp = Date.now();
let datosHistoricosCargados = false;

function iniciarObservadorPushFirebase() {
  if (typeof firebase === 'undefined') return;

  // 1. RECEPTOR DE MENSAJES EN PRIMER PLANO (FCM WEB SDK v8)
  if (firebase.messaging) {
    try {
      const messaging = firebase.messaging();
      messaging.onMessage((payload) => {
        console.log("🔔 [FCM Primer Plano] Mensaje recibido:", payload);
        const titulo = payload.notification?.title || payload.data?.title || "🚨 Huerto ESH: Alerta";
        const mensaje = payload.notification?.body || payload.data?.body || "Nueva actualización en el sistema.";
        
        dispararNotificacionLocal(titulo, mensaje, 'warning');
      });
      console.log("🔥 Receptor FCM en primer plano inicializado correctamente.");
    } catch (e) {
      console.warn("⚠️ No se pudo inicializar FCM onMessage:", e);
    }
  }

  // 2. OBSERVADOR DE BASE DE DATOS EN TIEMPO REAL
  if (!firebase.database) return;
  const dbRef = firebase.database().ref();

  // Marcar cuando se terminan de leer los registros iniciales para evitar ráfagas
  dbRef.child('tasks').once('value', () => {
    setTimeout(() => {
      datosHistoricosCargados = true;
    }, 1500);
  });

  // Vigilar nuevas tareas evitando duplicación histórica
  dbRef.child('tasks').on('child_added', (snapshot) => {
    if (!datosHistoricosCargados) return;
    
    const tarea = snapshot.val();
    const timestampTarea = tarea?.timestamp || Date.now();

    // Solo notificar si la tarea fue creada después de abrir la app (evita duplicados al entrar)
    if (timestampTarea > tiempoInicioApp) {
      dispararNotificacionLocal("📋 Nueva Tarea Creada", `Se ha añadido: ${tarea?.title || 'Nueva tarea'}`, 'success');
    }
  });

  // Vigilar avisos globales de transmisión manual (Broadcast de Admin)
  dbRef.child('broadcast_alerts').limitToLast(1).on('child_added', (snapshot) => {
    if (!datosHistoricosCargados) return;

    const alerta = snapshot.val();
    if (!alerta || !alerta.timestamp) return;

    // Verificar que la alerta sea reciente y posterior al inicio de sesión
    if (alerta.timestamp > tiempoInicioApp && (Date.now() - alerta.timestamp < 15000)) {
      dispararNotificacionLocal(alerta.titulo, alerta.mensaje, 'warning');
    }
  });

  console.log("👀 Observador de Firebase optimizado y filtro anti-duplicados activo.");
}

function dispararNotificacionLocal(titulo, mensaje, tipo = 'warning') {
  // Mostrar Toast visual en pantalla de forma centrada y limpia
  if (typeof mostrarToast === 'function') {
    mostrarToast(titulo, mensaje, tipo);
  }

  // Mostrar notificación nativa del sistema si hay permisos concedidos
  if ('Notification' in window && Notification.permission === 'granted') {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(titulo, {
          body: mensaje,
          icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
          badge: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
          vibrate: [200, 100, 200],
          tag: 'huerto-esh-alerta'
        });
      }).catch(() => {
        // Fallback nativo directo si el serviceWorker ready falla
        new Notification(titulo, {
          body: mensaje,
          icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png'
        });
      });
    }
  }
}

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(iniciarObservadorPushFirebase, 2000);
});