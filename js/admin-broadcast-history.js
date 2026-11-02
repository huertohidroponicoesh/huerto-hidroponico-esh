// =========================================================
// MÓDULO DE HISTORIAL DE ALERTAS BROADCAST Y GESTIÓN
// =========================================================

function cargarHistorialBroadcast() {
  const container = document.getElementById('tablaBroadcastHistoryBody');
  if (!container || typeof firebase === 'undefined' || !firebase.database) return;

  firebase.database().ref('broadcast_history').orderByChild('timestamp').limitToLast(20).on('value', (snapshot) => {
    container.innerHTML = '';
    const data = snapshot.val();

    if (!data) {
      container.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 15px; color: var(--text-muted);">No hay avisos transmitidos en el historial.</td></tr>`;
      return;
    }

    const items = [];
    snapshot.forEach((child) => {
      items.unshift({ id: child.key, ...child.val() });
    });

    const esAdmin = (localStorage.getItem("hidro_role") || userRole) === 'admin';

    items.forEach((item) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
      tr.innerHTML = `
        <td style="padding: 10px; font-size: 0.8rem; color: var(--cyan-neon);">${item.fecha || '--'}</td>
        <td style="padding: 10px; font-weight: 700; color: #ffffff;">${item.titulo}</td>
        <td style="padding: 10px; font-size: 0.82rem; color: var(--text-muted);">${item.mensaje}</td>
        <td style="padding: 10px; text-align: center;">
          ${esAdmin ? `<button onclick="eliminarAvisoBroadcast('${item.id}')" style="background: none; border: none; color: #ff5d67; cursor: pointer; font-size: 0.9rem;" title="Eliminar Aviso"><i class="fa-solid fa-trash"></i></button>` : '<i class="fa-solid fa-check text-success"></i>'}
        </td>
      `;
      container.appendChild(tr);
    });
  });
}
window.cargarHistorialBroadcast = cargarHistorialBroadcast;

function eliminarAvisoBroadcast(id) {
  if (!id || typeof firebase === 'undefined') return;
  if (confirm("¿Deseas eliminar este comunicado del historial?")) {
    firebase.database().ref(`broadcast_history/${id}`).remove().then(() => {
      if (typeof mostrarToast === 'function') {
        mostrarToast("Registro Eliminado", "Se quitó la alerta del historial.", "info");
      }
    });
  }
}
window.eliminarAvisoBroadcast = eliminarAvisoBroadcast;

function vaciarHistorialBroadcast() {
  const rol = localStorage.getItem("hidro_role") || userRole;
  if (rol !== 'admin') return;

  if (confirm("¿Estás seguro de purgar todo el historial de avisos transmitidos?")) {
    firebase.database().ref('broadcast_history').remove().then(() => {
      if (typeof mostrarToast === 'function') {
        mostrarToast("Historial Limpio", "Se borraron todos los registros de emisión.", "success");
      }
    });
  }
}
window.vaciarHistorialBroadcast = vaciarHistorialBroadcast;

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(cargarHistorialBroadcast, 2500);
});