// =========================================================
// MÓDULO INDEPENDIENTE: TOASTS & HARD REFRESH
// =========================================================

function mostrarToast(titulo, mensaje, tipo = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-card ${tipo}`;
  
  let iconClass = 'fa-solid fa-circle-check toast-icon';
  if (tipo === 'warning') iconClass = 'fa-solid fa-triangle-exclamation toast-icon';
  if (tipo === 'danger') iconClass = 'fa-solid fa-radiation toast-icon';

  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <div class="toast-content">
      <strong>${titulo}</strong>
      <small>${mensaje}</small>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}
window.mostrarToast = mostrarToast;

function ejecutarHardRefresh() {
  mostrarToast("Hard Refresh", "Reiniciando sockets y sincronizando con ESP32...", "success");

  const badge = document.getElementById('statusBadge');
  const txt = document.getElementById('statusText');
  if (badge) badge.className = "status-indicator connecting";
  if (txt) txt.innerHTML = `Sincronizando<span class="liquid-dots"><span></span><span></span><span></span></span>`;

  setTimeout(() => {
    if (typeof escucharFirebase === 'function') escucharFirebase();
    if (typeof cargarCuadrillasFirebase === 'function') cargarCuadrillasFirebase();
    if (typeof cargarHistorialFirebase === 'function') cargarHistorialFirebase();
    mostrarToast("Sincronización Exitosa", "Telemetría restablecida al 100%", "success");
  }, 1200);
}
window.ejecutarHardRefresh = ejecutarHardRefresh;

// Enlace directo al botón Hard Refresh en el DOM
document.addEventListener("DOMContentLoaded", () => {
  const btnRefresh = document.querySelector('button[title*="Hard Refresh"]') || document.querySelector('button[onclick*="HardRefresh"]');
  if (btnRefresh) {
    btnRefresh.onclick = (e) => {
      e.preventDefault();
      ejecutarHardRefresh();
    };
  }
});