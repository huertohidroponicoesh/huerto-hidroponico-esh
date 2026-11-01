// =========================================================
// MÓDULO DE INTERFAZ & SHELL AGS (CAELESTIA HUD)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  inicializarShellAGS();
  inicializarMenuMobileAGS();
  verificarModoNocturnoAutomatico();
  registrarServiceWorkerPWA();

  // Verificar cambios de horario cada 10 minutos
  setInterval(verificarModoNocturnoAutomatico, 600000);
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

// =========================================================
// REGISTRO DE SERVICE WORKER Y GESTIÓN DE PWA (INSTALACIÓN)
// =========================================================
let deferredPrompt;

function registrarServiceWorkerPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
      .then((reg) => {
        console.log('✅ Service Worker PWA registrado en scope:', reg.scope);
      })
      .catch((err) => {
        console.error('❌ Error al registrar Service Worker PWA:', err);
      });
  }
}

// Captura el evento para habilitar el botón universal de instalación PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const btnInstall = document.getElementById('btnInstallPwa');
  if (btnInstall) {
    btnInstall.classList.remove('hidden'); // Muestra el botón en la barra superior
  }
  console.log("📲 Aplicación lista para instalar como PWA.");
});

function instalarAplicacionPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ El usuario aceptó instalar la aplicación PWA.');
        const btnInstall = document.getElementById('btnInstallPwa');
        if (btnInstall) btnInstall.classList.add('hidden');
      }
      deferredPrompt = null;
    });
  } else {
    // Guía interactiva si el navegador no expone prompt directo (como en iOS Safari)
    if (typeof mostrarToast === 'function') {
      mostrarToast("Instalación PWA", "Abre el menú de tu navegador y selecciona 'Instalar aplicación' o 'Agregar a la pantalla de inicio'.", "warning");
    } else {
      alert("Para instalar la app, abre las opciones de tu navegador y selecciona 'Instalar aplicación'.");
    }
  }
}

window.addEventListener('appinstalled', (evt) => {
  console.log('🎉 PWA instalada con éxito.');
  const btnInstall = document.getElementById('btnInstallPwa');
  if (btnInstall) btnInstall.classList.add('hidden');
});

// =========================================================
// MODO NOCTURNO AUTOMÁTICO - ORBES AMBIENTALES
// =========================================================
function verificarModoNocturnoAutomatico() {
  const horaActual = new Date().getHours();
  // Horario nocturno: de 19:00 (7 PM) a 06:00 (6 AM)
  const esNoche = horaActual >= 19 || horaActual < 6;

  const orb1 = document.querySelector('.orb-1');
  const orb2 = document.querySelector('.orb-2');
  const orb3 = document.querySelector('.orb-3');

  if (orb1 && orb2 && orb3) {
    if (esNoche) {
      // Atenuamos un 50% el brillo de fondo para comodidad nocturna
      orb1.style.opacity = '0.25';
      orb2.style.opacity = '0.20';
      orb3.style.opacity = '0.22';
    } else {
      // Intensidad estándar diurna
      orb1.style.opacity = '0.55';
      orb2.style.opacity = '0.45';
      orb3.style.opacity = '0.50';
    }
  }
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