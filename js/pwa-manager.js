// =========================================================
// MÓDULO INDEPENDIENTE: GESTIÓN PWA & SERVICE WORKER
// =========================================================

let deferredPrompt = null;

function registrarServiceWorkerPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
      .then((reg) => console.log('✅ Service Worker PWA registrado:', reg.scope))
      .catch((err) => console.error('❌ Error Service Worker:', err));
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  mostrarBotonPWA();
});

function mostrarBotonPWA() {
  const btnInstall = document.getElementById('btnInstallPwa');
  if (btnInstall) {
    btnInstall.classList.remove('hidden');
    btnInstall.style.display = 'flex';
  }
}

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
    if (typeof mostrarToast === 'function') {
      mostrarToast("Instalación PWA", "Abre el menú de tu navegador y selecciona 'Instalar aplicación'.", "warning");
    } else {
      alert("Para instalar la app, abre las opciones de tu navegador y selecciona 'Instalar aplicación'.");
    }
  }
}
window.instalarAplicacionPWA = instalarAplicacionPWA;

document.addEventListener("DOMContentLoaded", () => {
  registrarServiceWorkerPWA();
  const btnInstall = document.getElementById('btnInstallPwa');
  if (btnInstall) {
    btnInstall.onclick = (e) => {
      e.preventDefault();
      instalarAplicacionPWA();
    };
  }
});