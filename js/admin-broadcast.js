// =========================================================
// MÓDULO BROADCAST DE AVISOS MANUALES (SOLO ADMIN)
// =========================================================

function abrirModalBroadcast() {
  const rol = localStorage.getItem("hidro_role") || userRole;
  if (rol !== 'admin') {
    if (typeof mostrarToast === 'function') {
      mostrarToast("Acceso Restringido", "Esta función es exclusiva para el Administrador General.", "danger");
    } else {
      alert("Solo el administrador puede abrir el panel de avisos globales.");
    }
    return;
  }

  const modal = document.getElementById('broadcastModal');
  if (modal) modal.classList.remove('hidden');
}
window.abrirModalBroadcast = abrirModalBroadcast;

function cerrarModalBroadcast() {
  const modal = document.getElementById('broadcastModal');
  if (modal) modal.classList.add('hidden');
  
  // Limpiar campos
  const inputTitulo = document.getElementById('broadcastTitulo');
  const inputMsg = document.getElementById('broadcastMensaje');
  if (inputTitulo) inputTitulo.value = '';
  if (inputMsg) inputMsg.value = '';
}
window.cerrarModalBroadcast = cerrarModalBroadcast;

function enviarAvisoGlobal() {
  const rol = localStorage.getItem("hidro_role") || userRole;
  if (rol !== 'admin') {
    if (typeof mostrarToast === 'function') {
      mostrarToast("Acceso Denegado", "Solo el Administrador General puede emitir avisos globales.", "danger");
    }
    return;
  }

  const inputTitulo = document.getElementById('broadcastTitulo');
  const inputMsg = document.getElementById('broadcastMensaje');

  const titulo = inputTitulo ? inputTitulo.value.trim() : "";
  const mensaje = inputMsg ? inputMsg.value.trim() : "";

  if (!titulo || !mensaje) {
    if (typeof mostrarToast === 'function') {
      mostrarToast("Campos Incompletos", "Por favor ingresa un título y un mensaje para el aviso.", "warning");
    }
    return;
  }

  if (typeof firebase !== 'undefined' && firebase.database) {
    const alertRef = firebase.database().ref('broadcast_alerts').push();
    alertRef.set({
      titulo: titulo,
      mensaje: mensaje,
      emisor: localStorage.getItem('usuario_push_activo') || 'Administrador',
      timestamp: Date.now(),
      fecha: new Date().toISOString()
    }).then(() => {
      if (typeof mostrarToast === 'function') {
        mostrarToast("Aviso Transmitido", "El mensaje se envió a todos los dispositivos registrados.", "success");
      }
      cerrarModalBroadcast();
    }).catch((err) => {
      console.error("Error al emitir el aviso broadcast:", err);
      if (typeof mostrarToast === 'function') {
        mostrarToast("Error", "No se pudo enviar el aviso a la red.", "danger");
      }
    });
  }
}
window.enviarAvisoGlobal = enviarAvisoGlobal;