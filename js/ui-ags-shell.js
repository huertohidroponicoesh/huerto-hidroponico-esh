// =========================================================
// MÓDULO DE INTERFAZ & SHELL AGS (CAELESTIA HUD) - LIMPIO
// =========================================================

function iniciarShellAGSLimpio() {
  inicializarShellAGS();
  verificarModoNocturnoAutomatico();

  // Verificar cambios de horario cada 10 minutos
  setInterval(verificarModoNocturnoAutomatico, 600000);
  console.log("🌌 Caelestia HUD Shell visual inicializado correctamente.");
}

// Ejecución segura de la interfaz
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", iniciarShellAGSLimpio);
} else {
  iniciarShellAGSLimpio();
}

function inicializarShellAGS() {
  document.querySelectorAll('.card-glass, .panel-glass').forEach((el, index) => {
    el.style.animation = `tabFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s forwards`;
  });
}

// =========================================================
// MODO NOCTURNO AUTOMÁTICO (ORBES AMBIENTALES)
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
// MODALES GLOBALES (CONFIGURACIÓN PUSH)
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