// =========================================================
// MÓDULO DE INTEGRACIÓN METEOROLÓGICA - HUEJUTLA DE REYES
// =========================================================

// Coordenadas exactas de Huejutla de Reyes, Hidalgo
const LAT_HUEJUTLA = 21.1411;
const LON_HUEJUTLA = -98.4187;

document.addEventListener("DOMContentLoaded", () => {
  obtenerClimaHuejutla();
  // Actualizar clima exterior cada 15 minutos
  setInterval(obtenerClimaHuejutla, 15 * 60 * 1000);
});

async function obtenerClimaHuejutla() {
  const container = document.getElementById('weatherWidgetContainer');
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT_HUEJUTLA}&longitude=${LON_HUEJUTLA}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=America%2FMexico_City`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al consultar API del clima");
    
    const data = await response.json();
    const current = data.current;

    if (current && container) {
      renderizarWidgetClima(current);
    }
  } catch (error) {
    console.error("❌ Error en Módulo de Clima Huejutla:", error);
    if (container) {
      container.innerHTML = `<small style="color: var(--text-muted);"><i class="fa-solid fa-cloud-sun"></i> Clima Huejutla: No disponible</small>`;
    }
  }
}

function renderizarWidgetClima(clima) {
  const container = document.getElementById('weatherWidgetContainer');
  if (!container) return;

  const temp = Math.round(clima.temperature_2m);
  const sensacion = Math.round(clima.apparent_temperature);
  const humedad = clima.relative_humidity_2m;
  const viento = Math.round(clima.wind_speed_10m);
  const lluvia = clima.precipitation;

  // Determinar icono según el código del clima
  let iconoClima = 'fa-sun';
  let colorIcono = 'var(--warning)';
  let estadoTexto = 'Despejado';

  if (lluvia > 0) {
    iconoClima = 'fa-cloud-showers-heavy';
    colorIcono = 'var(--cyan-neon)';
    estadoTexto = 'Lluvia';
  } else if (clima.weather_code >= 1 && clima.weather_code <= 3) {
    iconoClima = 'fa-cloud-sun';
    colorIcono = 'var(--warning)';
    estadoTexto = 'Parcialmente Nublado';
  } else if (clima.weather_code >= 45) {
    iconoClima = 'fa-smog';
    colorIcono = 'var(--text-muted)';
    estadoTexto = 'Neblina / Nublado';
  }

  container.innerHTML = `
    <div class="animate-fade-in" style="display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.25); border: 1px solid var(--card-border); padding: 8px 14px; border-radius: 18px; font-size: 0.8rem;">
      <i class="fa-solid ${iconoClima}" style="font-size: 1.3rem; color: ${colorIcono};"></i>
      <div>
        <div style="font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
          <span>Huejutla: ${temp}°C</span>
          <small style="color: var(--text-muted); font-size: 0.72rem; font-weight: 500;">(Sens. ${sensacion}°C)</small>
        </div>
        <div style="color: var(--text-muted); font-size: 0.7rem; display: flex; gap: 8px; margin-top: 1px;">
          <span><i class="fa-solid fa-droplet" style="color: var(--cyan-neon);"></i> ${humedad}% Hum.</span>
          <span><i class="fa-solid fa-wind"></i> ${viento} km/h</span>
        </div>
      </div>
    </div>
  `;
}