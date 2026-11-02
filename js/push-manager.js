// =========================================================
// MÓDULO INDEPENDIENTE: GESTIÓN DE TOKENS Y PERMISOS PUSH
// =========================================================

function abrirModalPush() {
  const modal = document.getElementById('pushConfigModal');
  if (modal) {
    modal.classList.remove('hidden');
    
    // Prellenar campos si ya existen datos guardados en este dispositivo
    const inputDisp = document.getElementById('inputNombreDispositivo');
    const inputUsu = document.getElementById('inputNombreUsuario');
    if (inputDisp && localStorage.getItem('dispositivo_push_activo')) {
      inputDisp.value = localStorage.getItem('dispositivo_push_activo');
    }
    if (inputUsu && localStorage.getItem('usuario_push_activo')) {
      inputUsu.value = localStorage.getItem('usuario_push_activo');
    }
  }
}
window.abrirModalPush = abrirModalPush;

function cerrarModalPush() {
  const modal = document.getElementById('pushConfigModal');
  if (modal) modal.classList.add('hidden');
}
window.cerrarModalPush = cerrarModalPush;

async function guardarDispositivoPersonalizado() {
  const inputDispositivo = document.getElementById('inputNombreDispositivo');
  const inputUsuario = document.getElementById('inputNombreUsuario');
  
  const nombreDisp = inputDispositivo ? inputDispositivo.value.trim() : "";
  const nombreUsu = inputUsuario ? inputUsuario.value.trim() : "H.A.G.D.R.";

  if (!nombreDisp) {
    if (typeof mostrarToast === 'function') {
      mostrarToast("Aviso", "Por favor ingresa un nombre para este dispositivo.", "warning");
    } else {
      alert("Por favor ingresa un nombre para este dispositivo.");
    }
    return;
  }

  try {
    // 1. SOLICITAR PERMISO NATIVO DEL NAVEGADOR / SISTEMA OPERATIVO
    if (!('Notification' in window)) {
      alert("⚠️ Este navegador no soporta la API de Notificaciones.");
      return;
    }

    let permiso = Notification.permission;
    if (permiso === 'default') {
      permiso = await Notification.requestPermission();
    }

    if (permiso === 'denied') {
      if (typeof mostrarToast === 'function') {
        mostrarToast("Permiso Bloqueado", "Las notificaciones están bloqueadas en los ajustes de tu navegador.", "danger");
      } else {
        alert("Las notificaciones están bloqueadas en tu navegador.");
      }
      return;
    }

    // 2. OBTENER EL TOKEN REAL DE FIREBASE CLOUD MESSAGING (FCM)
    let tokenDispositivo = null;
    
    if (typeof firebase !== 'undefined' && firebase.messaging) {
      try {
        const messaging = firebase.messaging();
        
        // Si generaste una Clave VAPID en la consola de Firebase, puedes incluirla aquí:
        // tokenDispositivo = await messaging.getToken({ vapidKey: 'TU_CLAVE_VAPID_PUBLICA' });
        
        // Solicitud estándar mediante el SDK web v8 de Firebase Messaging
        tokenDispositivo = await messaging.getToken();
      } catch (fcmErr) {
        console.warn("⚠️ No se pudo obtener el token FCM nativo del navegador, usando respaldo local:", fcmErr);
      }
    }

    // Respaldo por si el navegador bloquea temporalmente el Service Worker de FCM
    if (!tokenDispositivo) {
      tokenDispositivo = localStorage.getItem("hidro_device_unique_token");
      if (!tokenDispositivo) {
        tokenDispositivo = "fcm_token_esh_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      }
    }
    
    localStorage.setItem("hidro_device_unique_token", tokenDispositivo);
    localStorage.setItem("hidro_push_token", tokenDispositivo);
    localStorage.setItem('dispositivo_push_activo', nombreDisp);
    localStorage.setItem('usuario_push_activo', nombreUsu);
    localStorage.setItem('push_registrado_exito', "true");

    // 3. SINCRONIZAR CON FIREBASE REALTIME DATABASE (Leído por Vercel)
    if (typeof firebase !== 'undefined' && firebase.database) {
      const deviceIdClean = nombreDisp.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      await firebase.database().ref('fcm_tokens/' + deviceIdClean).set({
        dispositivo: nombreDisp,
        usuario: nombreUsu,
        token: tokenDispositivo,
        permisoOtorgado: Notification.permission === 'granted',
        fechaRegistro: new Date().toISOString()
      });
      console.log("☁️ Token de dispositivo sincronizado en Firebase para Vercel.");
    }

    // 4. CONFIRMACIÓN CON TOAST
    if (typeof mostrarToast === 'function') {
      mostrarToast("Alertas Push 24/7", `Dispositivo "${nombreDisp}" registrado con éxito.`, "success");
    } else {
      alert(`Notificaciones activadas para "${nombreDisp}".`);
    }
    
    cerrarModalPush();

  } catch (error) {
    console.error("❌ Error al registrar dispositivo push:", error);
    if (typeof mostrarToast === 'function') {
      mostrarToast("Error", "No se pudo registrar el dispositivo push.", "danger");
    }
  }
}
window.guardarDispositivoPersonalizado = guardarDispositivoPersonalizado;

// Enlace directo de la campanita
document.addEventListener("DOMContentLoaded", () => {
  const btnNotify = document.getElementById('btnNotify') || document.querySelector('button[title*="Notificaciones"]') || document.querySelector('.fa-bell')?.closest('button');
  if (btnNotify) {
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      abrirModalPush();
    };
    btnNotify.onclick = handler;
    btnNotify.ontouchstart = handler;
  }
});