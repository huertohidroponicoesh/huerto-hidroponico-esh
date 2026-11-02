// =========================================================
// MÓDULO CENTRALIZADO: DISPATCHER DE NOTIFICACIONES (SISTEMA ESH)
// =========================================================

/**
 * Función global unificada para disparar notificaciones en todo el sistema.
 * @param {string} tipo - 'success', 'warning', 'danger', 'info'
 * @param {string} titulo - Título de la alerta (ej. "Calibración Exitosa", "Peligro pH")
 * @param {string} mensaje - Descripción detallada del evento
 * @param {boolean} enviarPushCloud - Si es true, sincroniza con Firebase para forzar push global
 */
async function notificarSistema(tipo, titulo, mensaje, enviarPushCloud = false) {
  console.log(`[Sistema ESH Dispatcher] (${tipo.toUpperCase()}) ${titulo}: ${mensaje}`);

  // 1. Mostrar Toast visual flotante en la UI actual
  if (typeof mostrarToast === 'function') {
    mostrarToast(titulo, mensaje, tipo);
  } else {
    console.warn("⚠️ La función mostrarToast no está disponible en este contexto.");
  }

  // 2. Mostrar Notificación Nativa del Sistema (si el navegador tiene permisos)
  if ('Notification' in window && Notification.permission === 'granted') {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(titulo, {
          body: mensaje,
          icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
          badge: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png',
          vibrate: [200, 100, 200],
          tag: 'huerto-esh-' + tipo
        });
      }).catch(() => {
        new Notification(titulo, { body: mensaje, icon: 'https://cdn-icons-png.flaticon.com/192/1892/1892751.png' });
      });
    }
  }

  // 3. Si requiere notificación push global y Firebase Database está activo, registrar en la nube
  if (enviarPushCloud && typeof firebase !== 'undefined' && firebase.database) {
    try {
      await firebase.database().ref('broadcast_alerts').push({
        titulo: titulo,
        mensaje: mensaje,
        tipo: tipo,
        timestamp: Date.now()
      });
      console.log("☁️ Alerta sincronizada en Firebase para difusión global.");
    } catch (error) {
      console.error("❌ Error al sincronizar alerta en Firebase:", error);
    }
  }
}

// Exponer globalmente para que cualquier módulo del sistema lo invoque
window.notificarSistema = notificarSistema;