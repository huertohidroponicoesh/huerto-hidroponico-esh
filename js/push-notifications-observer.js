// =========================================================
// MÓDULO INDEPENDIENTE: OBSERVADOR DE CAMBIOS PARA PUSH 24/7
// =========================================================

let esCargaInicialTareas = true;
let esCargaInicialTrackers = true;

function iniciarObservadorPushFirebase() {
  if (typeof firebase === 'undefined' || !firebase.database) return;

  const dbRef = firebase.database().ref();

  // 1. Vigilar nuevas tareas evitando duplicación en la carga inicial
  dbRef.child('tasks').once('value', () => {
    esCargaInicialTareas = false;
  });

  dbRef.child('tasks').on('child_added', (snapshot) => {
    if (esCargaInicialTareas) return;
    const tarea = snapshot.val();
    dispararNotificacionLocal("📋 Nueva Tarea Creada", `Se ha añadido: ${tarea?.title || 'Nueva tarea'}`);
  });

  // 2. Vigilar actualizaciones en Trackers evitando duplicación en la carga inicial
  dbRef.child('trackers').once('value', () => {
    esCargaInicialTrackers = false;
  });

  dbRef.child('trackers').on('child_changed', (snapshot) => {
    if (esCargaInicialTrackers) return;
    dispararNotificacionLocal("📊 Actualización de Tracker", "Se han modificado los parámetros de seguimiento.");
  });

  // 3. Vigilar cambios en umbrales o calibración de sensores
  dbRef.child('sensores').on('child_changed', (snapshot) => {
    const data = snapshot.val();
    if (data && (data.pH < 5.0 || data.pH > 7.0)) {
      dispararNotificacionLocal("🚨 Alerta Crítica de pH", `El pH actual es de ${data.pH}. ¡Requiere atención!`);
    }
  });

  // 4. Vigilar avisos globales de transmisión manual (Broadcast de Admin)
  dbRef.child('broadcast_alerts').limitToLast(1).on('child_added', (snapshot) => {
    const alerta = snapshot.val();
    if (!alerta || !alerta.timestamp) return;

    // Solo notificar si la alerta fue emitida hace menos de 10 segundos para evitar repeticiones al recargar
    if (Date.now() - alerta.timestamp < 10000) {
      dispararNotificacionLocal(alerta.titulo, alerta.mensaje, 'warning');
    }
  });

  console.log("👀 Observador de Firebase para notificaciones push optimizado y activo.");
}

function dispararNotificacionLocal(titulo, mensaje, tipo = 'warning') {
  // Mostrar Toast visual en pantalla si está abierta la app
  if (typeof mostrarToast === 'function') {
    mostrarToast(titulo, mensaje, tipo);
  }

  // Si el navegador soporta notificaciones nativas y el usuario dio permisos, las muestra en segundo plano
  if ('Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(titulo, {
        body: mensaje,
        icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
        badge: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
        vibrate: [200, 100, 200]
      });
    });
  }
}

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(iniciarObservadorPushFirebase, 2000);
});