// =========================================================
// MÓDULO INDEPENDIENTE: OBSERVADOR DE CAMBIOS Y PUSH 24/7
// =========================================================

// Registrar el timestamp exacto en que abrió la aplicación para ignorar eventos antiguos
const tiempoInicioApp = Date.now();
let datosHistoricosCargados = false;

function iniciarObservadorPushFirebase() {
  if (typeof firebase === 'undefined' || !firebase.database) return;

  const dbRef = firebase.database().ref();

  // Marcar cuando se terminan de leer los registros iniciales para evitar ráfagas
  dbRef.child('tasks').once('value', () => {
    setTimeout(() => {
      datosHistoricosCargados = true;
    }, 1500);
  });

  // 1. Vigilar nuevas tareas evitando duplicación histórica
  dbRef.child('tasks').on('child_added', (snapshot) => {
    if (!datosHistoricosCargados) return;
    
    const tarea = snapshot.val();
    const timestampTarea = tarea?.timestamp || Date.now();

    // Solo notificar si la tarea fue creada después de abrir la app (evita duplicados al entrar)
    if (timestampTarea > tiempoInicioApp) {
      dispararNotificacionLocal("📋 Nueva Tarea Creada", `Se ha añadido: ${tarea?.title || 'Nueva tarea'}`);
    }
  });

  // 2. Vigilar avisos globales de transmisión manual (Broadcast de Admin)
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
  // Mostrar Toast visual en pantalla si la app está abierta
  if (typeof mostrarToast === 'function') {
    mostrarToast(titulo, mensaje, tipo);
  }

  // Mostrar notificación nativa del sistema (funciona en segundo plano si el Service Worker está activo)
  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(titulo, {
        body: mensaje,
        icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
        badge: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
        vibrate: [200, 100, 200],
        tag: 'huerto-esh-alerta'
      });
    });
  }
}

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(iniciarObservadorPushFirebase, 2000);
});