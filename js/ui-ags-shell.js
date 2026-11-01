// =========================================================
// MÓDULO DE INTERFAZ & SHELL AGS (CAELESTIA HUD)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  inicializarShellAGS();
  inicializarMenuMobileAGS();
});

function inicializarShellAGS() {
  console.log("🌌 Caelestia HUD Shell inicializado correctamente.");

  // Efecto de entrada en los contenedores de cristal al cargar
  document.querySelectorAll('.card-glass, .panel-glass').forEach((el, index) => {
    el.style.animation = `tabFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s forwards`;
  });
}

// Lógica de apertura, cierre y control táctil/móvil para el Dock Lateral AGS
function inicializarMenuMobileAGS() {
  const sidebar = document.querySelector('.ags-sidebar');
  const btnToggle = document.getElementById('btnToggleSidebar');

  // 1. Abrir / Cerrar menú al presionar el botón hamburguesa (.mobile-only)
  if (btnToggle && sidebar) {
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
    });
  }

  // 2. Cerrar automáticamente el menú al hacer clic en cualquier opción de la navegación en móviles
  const navItems = document.querySelectorAll('.ags-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 992 && sidebar) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });

  // 3. Cerrar el menú si se da clic fuera de él en dispositivos móviles
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('mobile-open')) {
      if (!sidebar.contains(e.target) && (!btnToggle || !btnToggle.contains(e.target))) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });
}

// Función para simular un "Hard Refresh" de telemetría y reconexión limpia
function ejecutarHardRefresh() {
  if (typeof mostrarToast === 'function') {
    mostrarToast("Hard Refresh", "Reiniciando sockets y sincronizando con ESP32...", "success");
  }

  const badge = document.getElementById('statusBadge');
  const txt = document.getElementById('statusText');
  if (badge) badge.className = "status-indicator connecting";
  if (txt) txt.innerHTML = `Sincronizando<span class="liquid-dots"><span></span><span></span><span></span></span>`;

  setTimeout(() => {
    if (typeof escucharFirebase === 'function') {
      escucharFirebase();
    }
    if (typeof mostrarToast === 'function') {
      mostrarToast("Sincronización Exitosa", "Telemetría restablecida al 100%", "success");
    }
  }, 1200);
}

// Sistema de Alertas Toast flotantes tipo AGS
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
  
  let iconClass = 'fa-solid fa-circle-check';
  if (tipo === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';
  if (tipo === 'danger') iconClass = 'fa-solid fa-radiation';

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <div class="toast-content">
      <strong>${titulo}</strong>
      <small>${mensaje}</small>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);

  // Auto eliminar después de 4.5 segundos con animación de salida
  setTimeout(() => {
    toast.style.animation = 'fadeOutToast 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}