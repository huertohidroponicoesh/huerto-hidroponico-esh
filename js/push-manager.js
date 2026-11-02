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

  // 1. SOLICITAR PERMISO NATIVO DEL NAVEGADOR / SISTEMA OPERATIVO
  if ('Notification' in window) {
    let permiso = Notification.permission;

    if (permiso === 'default') {
      // Abre el diálogo emergente nativo del navegador preguntando si permite notificaciones
      permiso = await Notification.requestPermission();
    }

    if (permiso === 'denied') {
      if (typeof mostrarToast === 'function') {
        mostrarToast("Permiso Bloqueado", "Las notificaciones están bloqueadas en los ajustes de tu navegador o teléfono.", "danger");
      } else {
        alert("Las notificaciones están bloqueadas en tu navegador.");
      }
      return;
    }
  } else {
    console.warn("⚠️ Este navegador no soporta la API de Notificaciones.");
  }

  // 2. GENERAR TOKEN ÚNICO POR DISPOSITIVO (SOLO SI SE OTORGÓ EL PERMISO)
  let tokenDispositivo = localStorage.getItem("hidro_device_unique_token");
  if (!tokenDispositivo) {
    tokenDispositivo = "fcm_token_esh_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
    localStorage.setItem("hidro_device_unique_token", tokenDispositivo);
  }
  
  // Guardar configuración local
  localStorage.setItem("hidro_push_token", tokenDispositivo);
  localStorage.setItem('dispositivo_push_activo', nombreDisp);
  localStorage.setItem('usuario_push_activo', nombreUsu);
  localStorage.setItem('push_registrado_exito', "true");

  // 3. SINCRONIZAR CON FIREBASE REALTIME DATABASE
  if (typeof firebase !== 'undefined' && firebase.database) {
    const deviceIdClean = nombreDisp.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    firebase.database().ref('fcm_tokens/' + deviceIdClean).set({
      dispositivo: nombreDisp,
      usuario: nombreUsu,
      token: tokenDispositivo,
      permisoOtorgado: Notification.permission === 'granted',
      fechaRegistro: new Date().toISOString()
    }).then(() => {
      console.log("☁️ Token y estado de notificación sincronizados en Firebase.");
    }).catch((err) => {
      console.warn("⚠️ Error de red en Firebase:", err);
    });
  }

  // 4. CONFIRMACIÓN CON TOAST
  if (typeof mostrarToast === 'function') {
    mostrarToast("Alertas Push 24/7", `Permisos otorgados y dispositivo "${nombreDisp}" activado.`, "success");
  } else {
    alert(`Notificaciones activadas para "${nombreDisp}".`);
  }
  
  cerrarModalPush();
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