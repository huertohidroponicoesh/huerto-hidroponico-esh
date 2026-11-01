// =========================================================
// MÓDULO DE DIAGRAMA HIDRÁULICO INTERACTIVO & FLUJO DE PARTÍCULAS
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  inicializarDiagramaBypass();
});

function inicializarDiagramaBypass() {
  const canvasBypass = document.getElementById('bypassCanvasSimulation');
  if (!canvasBypass) return;

  const ctx = canvasBypass.getContext('2d');
  let particulas = [];
  const numParticulas = 25;

  for (let i = 0; i < numParticulas; i++) {
    particulas.push({
      x: Math.random() * canvasBypass.width,
      y: canvasBypass.height / 2 + (Math.random() * 10 - 5),
      vel: 1.5 + Math.random() * 2,
      radio: 2 + Math.random() * 2
    });
  }

  function animarFlujo() {
    ctx.clearRect(0, 0, canvasBypass.width, canvasBypass.height);

    // Verificar si la bomba principal o el bypass están activos
    const bombaActiva = document.getElementById('btn-bomba_principal') ? document.getElementById('btn-bomba_principal').checked : false;
    const bypassActivo = document.getElementById('btn-bypass') ? document.getElementById('btn-bypass').checked : false;

    if (bombaActiva || bypassActivo) {
      ctx.fillStyle = bypassActivo ? '#ffd166' : '#10b981';
      
      particulas.forEach(p => {
        p.x += p.vel;
        if (p.x > canvasBypass.width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    requestAnimationFrame(animarFlujo);
  }

  animarFlujo();
}

function simularPulsoInyeccionNutrientes() {
  const inyeccionStatus = document.getElementById('schemaStatusInyeccion');
  if (inyeccionStatus) {
    inyeccionStatus.innerText = "Inyectando Solución";
    inyeccionStatus.className = "node-status text-cyan value-update-flash";

    setTimeout(() => {
      inyeccionStatus.innerText = "En Reposo";
      inyeccionStatus.className = "node-status text-muted";
    }, 3000);
  }

  if (typeof mostrarToast === 'function') {
    mostrarToast("Dosificación Automática", "Ciclo de inyección de nutrientes activado con éxito", "success");
  }
}