// =========================================================
// MÓDULO DE INTERFAZ & SHELL AGS (CAELESTIA HUD) - BLINDADO GLOBAL
// =========================================================

function iniciarShellAGSCompleto() {
  inicializarShellAGS();
  inicializarMenuMobileAGS();
  verificarModoNocturnoAutomatico();
  registrarServiceWorkerPWA();
  vincularBotonesSuperioresDirectamente();

  // Verificar cambios de horario cada 10 minutos
  setInterval(verificarModoNocturnoAutomatico, 600000);
  console.log("🚀 Shell AGS inicializado y operativo al 100%.");
}

// Inicialización automática robusta sin importar el estado del DOM
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", iniciarShellAGSCompleto);
} else {
  iniciarShellAGSCompleto();
}

function inicializarShellAGS() {
  document.querySelectorAll('.card-glass, .panel-glass').forEach((el, index) => {
    el.style.animation = `tabFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s forwards`;
  });
}

// Enlace directo y absoluto para los botones de la barra superior
function vincularBotonesSuperioresDirectamente() {
  // 1. Botón Hard Refresh
  const btnRefresh = document.querySelector('button[title*="Hard Refresh"]') || document.querySelector('button[onclick*="HardRefresh"]');
  if (btnRefresh) {
    btnRefresh.onclick = (e) => {
      e.preventDefault();
      ejecutarHardRefresh();
    };
  }

  // 2. Botón de Notificaciones / Push
  const btnNotify = document.getElementById('btnNotify') || document.querySelector('button[title*="Notificaciones"]');
  if (btnNotify) {
    btnNotify.onclick = (e) => {
      e.preventDefault();
      abrirModalPush();
    };
  }

  // 3. Botón PWA
  const btnInstall = document.getElementById('btnInstallPwa');
  if (btnInstall) {
    btnInstall.onclick = (e) => {
      e.preventDefault();
      instalarAplicacionPWA();
    };
  }
}

// Lógica de apertura y cierre para el menú lateral en dispositivos móviles
function inicializarMenuMobileAGS() {
  const sidebar = document.querySelector('.ags-sidebar');
  const btnToggle = document.getElementById('btnToggleSidebar');

  if (btnToggle && sidebar) {
    const toggleSidebarHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
      console.log("📱 Menú lateral móvil alternado:", sidebar.classList.contains('mobile-open'));
    };

    btnToggle.onclick = toggleSidebarHandler;
    btnToggle.ontouchstart = toggleSidebarHandler;
  }

  // Cerrar al hacer clic en opciones de navegación móvil
  document.querySelectorAll('.ags-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 992 && sidebar) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });

  // Cerrar al hacer clic fuera del sidebar
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('mobile-open')) {
      if (!sidebar.contains(e.target) && btnToggle && !btnToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });
}

// =========================================================
// REGISTRO DE SERVICE WORKER Y GESTIÓN DE PWA
// =========================================================
let deferredPrompt = null;

function registrarServiceWorkerPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js').catch(() => {});
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btnInstall = document.getElementById('btnInstallPwa');
  if (btnInstall) {
    btnInstall.classList.remove('hidden');
    btnInstall.style.display = 'flex';
  }
});

setTimeout(() => {
  const btnInstall = document.getElementById('btnInstallPwa');
  if (btnInstall && !window.matchMedia('(display-mode: standalone)').matches) {
    btnInstall.classList.remove('hidden');
    btnInstall.style.display = 'flex';
  }
}, 800);

function instalarAplicacionPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        const btnInstall = document.getElementById('btnInstallPwa');
        if (btnInstall) btnInstall.style.display = 'none';
      }
      deferredPrompt = null;
    });
  } else {
    mostrarToast("Instalación PWA", "Abre el menú de tu navegador y selecciona 'Instalar aplicación'.", "warning");
  }
}
window.instalarAplicacionPWA = instalarAplicacionPWA;

// =========================================================
// MODO NOCTURNO AUTOMÁTICO
// =========================================================
function verificarModoNocturnoAutomatico() {
  const horaActual = new Date().getHours();
  const esNoche = horaActual >= 19 || horaActual < 6;
  const [orb1, orb2, orb3] = [document.querySelector('.orb-1'), document.querySelector('.orb-2'), document.querySelector('.orb-3')];

  if (orb1 && orb2 && orb3) {
    orb1.style.opacity = esNoche ? '0.25' : '0.55';
    orb2.style.opacity = esNoche ? '0.20' : '0.45';
    orb3.style.opacity = esNoche ? '0.22' : '0.50';
  }
}

// =========================================================
// HARD REFRESH ROBUSTO
// =========================================================
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

// =========================================================
// MODALES GLOBALES
// =========================================================
function abrirModalPush() {
  const modal = document.getElementById('pushConfigModal');
  if (modal) modal.classList.remove('hidden');
}
window.abrirModalPush = abrirModalPush;

function cerrarModalPush() {
  const modal = document.getElementById('pushConfigModal');
  if (modal) modal.classList.add('hidden');
}
window.cerrarModalPush = cerrarModalPush;

// =========================================================
// SISTEMA DE ALERTAS TOAST FLOTANTES (CONECTADO A ANIMATIONS.CSS)
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