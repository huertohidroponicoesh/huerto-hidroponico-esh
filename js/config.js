// =========================================================
// CONFIGURACIÓN GLOBAL, PWA & FIREBASE - HUERTO ESH V3
// =========================================================

// --- CONFIGURACIÓN DE PWA & SERVICE WORKER ---
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que el navegador muestre el banner automático por defecto
  e.preventDefault();
  deferredPrompt = e;
  
  const btnInstall = document.getElementById('btnInstallApp');
  if (btnInstall) {
    btnInstall.classList.remove('hidden');
    
    // Evitar múltiples listeners duplicados limpiando o asignando directamente
    btnInstall.onclick = () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ PWA: Usuario aceptó instalar la aplicación.');
        } else {
          console.log('ℹ️ PWA: Usuario canceló la instalación.');
        }
        deferredPrompt = null;
        btnInstall.classList.add('hidden');
      });
    };
  }
});

// Evento cuando la PWA se instala con éxito
window.addEventListener('appinstalled', (evt) => {
  console.log('🎉 PWA: Instalada exitosamente en el dispositivo.');
  const btnInstall = document.getElementById('btnInstallApp');
  if (btnInstall) btnInstall.classList.add('hidden');
});

// Registro seguro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { 
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('👷 SW: Service Worker registrado con éxito en el ámbito:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ SW: Error al registrar el Service Worker:', error);
      }); 
  });
}

// --- INICIALIZACIÓN DE FIREBASE & REALTIME DATABASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCPr2QN1gvo5Ngekcos86uo2maX_mHrGF0",
  authDomain: "huerto-hidroponico-esh.firebaseapp.com",
  databaseURL: "https://huerto-hidroponico-esh-default-rtdb.firebaseio.com",
  projectId: "huerto-hidroponico-esh",
  storageBucket: "huerto-hidroponico-esh.firebasestorage.app",
  messagingSenderId: "380114491557",
  appId: "1:380114491557:web:bf85a1b207638093abd54c"
};

// Inicializar la aplicación de Firebase solo si no ha sido inicializada previamente
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('🔥 Firebase: Aplicación inicializada correctamente.');
} else {
  firebase.app();
}

// Referencias globales para la base de datos y mensajería push
const database = firebase.database();
const messaging = typeof firebase.messaging !== 'undefined' && firebase.messaging.isSupported() 
  ? firebase.messaging() 
  : null;

if (!messaging) {
  console.warn('⚠️ Firebase Messaging no es compatible o no está soportado en este entorno/navegador.');
}