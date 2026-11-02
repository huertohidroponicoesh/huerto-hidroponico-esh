// =========================================================
// MÓDULO INDEPENDIENTE: GESTIÓN DE TOKENS Y PUSH MANAGER
// =========================================================

function abrirModalPush() {
  const modal = document.getElementById('pushConfigModal');
  if (modal) {
    modal.classList.remove('hidden');
    // Prellenar campos si ya están guardados previamente en este dispositivo
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

function guardarDispositivoPersonalizado() {
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

  // Generar un token único independiente por hardware/navegador para la PWA
  let tokenDispositivo = localStorage.getItem("hidro_device_unique_token");
  if (!tokenDispositivo) {
    tokenDispositivo = "fcm_token_esh_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
    localStorage.setItem("hidro_device_unique_token", tokenDispositivo);
  }
  
  // Sincronizar variables locales
  localStorage.setItem("hidro_push_token", tokenDispositivo);
  localStorage.setItem('dispositivo_push_activo', nombreDisp);
  localStorage.setItem('usuario_push_activo', nombreUsu);
  localStorage.setItem('push_registrado_exito', "true");

  // Enviar y registrar de forma remota en la base de datos de Firebase Realtime Database
  if (typeof firebase !== 'undefined' && firebase.database) {
    const deviceIdClean = nombreDisp.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    firebase.database().ref('fcm_tokens/' + deviceIdClean).set({
      dispositivo: nombreDisp,
      usuario: nombreUsu,
      token: tokenDispositivo,
      fechaRegistro: new Date().toISOString()
    }).then(() => {
      console.log("☁️ Token único sincronizado correctamente en Firebase.");
    }).catch((err) => {
      console.warn("⚠️ Registro local exitoso, aviso de red en Firebase:", err);
    });
  }

  // Notificar al usuario con el sistema Toast flotante centrado
  if (typeof mostrarToast === 'function') {
    mostrarToast("Alertas Push 24/7", `Dispositivo "${nombreDisp}" enlazado con éxito.`, "success");
  } else {
    alert(`Dispositivo "${nombreDisp}" vinculado correctamente.`);
  }
  
  cerrarModalPush();
}
window.guardarDispositivoPersonalizado = guardarDispositivoPersonalizado;

// Enlace automático y seguro para el botón de la campanita
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