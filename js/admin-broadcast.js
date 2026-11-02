// =========================================================
// MÓDULO BROADCAST DE AVISOS MANUALES (SOLO ADMIN) - V2
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
  
  const inputTitulo = document.getElementById('broadcastTitulo');
  const inputMsg = document.getElementById('broadcastMensaje');
  if (inputTitulo) inputTitulo.value = '';
  if (inputMsg) inputMsg.value = '';
}
window.cerrarModalBroadcast = cerrarModalBroadcast;

async function enviarAvisoGlobal() {
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
    const timestamp = Date.now();
    const emisor = localStorage.getItem('usuario_push_activo') || 'Administrador General';
    
    // Preparar payload de la alerta
    const payload = {
      titulo: `📢 ${titulo}`,
      mensaje: mensaje,
      emisor: emisor,
      timestamp: timestamp,
      fecha: new Date().toLocaleString()
    };

    try {
      // 1. Disparar de inmediato la API Push de Vercel (para forzar la push nativa al celular con app cerrada)
      const urlPush = `https://huerto-hidroponico-esh.vercel.app/api/push?titulo=${encodeURIComponent(payload.titulo)}&mensaje=${encodeURIComponent(payload.mensaje)}`;
      await fetch(urlPush, { method: 'GET', mode: 'cors' });
      console.log("🚀 Notificación Push despachada a Vercel con éxito.");

      // 2. Enviar evento en vivo a broadcast_alerts para los observadores activos en la interfaz
      const alertRef = firebase.database().ref('broadcast_alerts').push();
      await alertRef.set(payload);

      // 3. Guardar registro permanente en broadcast_history
      await firebase.database().ref('broadcast_history').push(payload);

      if (typeof mostrarToast === 'function') {
        mostrarToast("Aviso Transmitido", "El mensaje se envió a la red y a las notificaciones push.", "success");
      }
      cerrarModalBroadcast();
      if (typeof cargarHistorialBroadcast === 'function') {
        cargarHistorialBroadcast();
      }

    } catch (err) {
      console.error("Error al emitir el aviso broadcast:", err);
      if (typeof mostrarToast === 'function') {
        mostrarToast("Error", "No se pudo enviar el aviso a la red.", "danger");
      }
    }
  }
}
window.enviarAvisoGlobal = enviarAvisoGlobal;