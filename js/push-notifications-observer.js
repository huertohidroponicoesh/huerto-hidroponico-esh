// =========================================================
// MÓDULO INDEPENDIENTE: OBSERVADOR DE CAMBIOS PARA PUSH 24/7
// =========================================================

function iniciarObservadorPushFirebase() {
  if (typeof firebase === 'undefined' || !firebase.database) return;

  const dbRef = firebase.database().ref();

  // 1. Vigilar cambios o nuevas tareas
  dbRef.child('tasks').on('child_added', (snapshot) => {
    dispararNotificacionLocal("Nueva Tarea Creada", "Se ha añadido una nueva tarea al sistema.");
  });

  // 2. Vigilar actualizaciones en Trackers o Calibraciones
  dbRef.child('trackers').on('child_changed', (snapshot) => {
    dispararNotificacionLocal("Actualización de Tracker", "Se han modificado los parámetros de seguimiento.");
  });

  // 3. Vigilar cambios en umbrales o calibración
  dbRef.child('sensores').on('child_changed', (snapshot) => {
    // Evitamos saturar con cada lectura de sensor, pero puedes filtrar alertas críticas aquí
    const data = snapshot.val();
    if (data && (data.pH < 5.0 || data.pH > 7.0)) {
      dispararNotificacionLocal("🚨 Alerta Crítica de pH", `El pH actual es de ${data.pH}. ¡Requiere atención!`);
    }
  });

  console.log("eyes Observador de Firebase para notificaciones push activo.");
}

function dispararNotificacionLocal(titulo, mensaje) {
  // Mostrar Toast visual en pantalla si está abierta la app
  if (typeof mostrarToast === 'function') {
    mostrarToast(titulo, mensaje, 'warning');
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