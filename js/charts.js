// =========================================================
// MÓDULO DE GRÁFICAS Y ANALÍTICA AVANZADA - HUERTO ESH V3
// =========================================================

let sensorChart;
const historyData = { ph: [], temperatura: [], ec: [], humedad: [] };
const labelsHora = [];

const configMap = {
  ph: { label: 'pH del Agua', color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.15)' },
  temperatura: { label: 'Temperatura (°C)', color: '#ff5d67', bg: 'rgba(255, 93, 103, 0.15)' },
  ec: { label: 'CE (mS/cm)', color: '#ffd166', bg: 'rgba(255, 209, 102, 0.15)' },
  humedad: { label: 'Humedad (%)', color: '#35e58a', bg: 'rgba(53, 229, 138, 0.15)' }
};

document.addEventListener("DOMContentLoaded", () => {
  inicializarGraficaDual();
  cargarHistorialFirebase();
});

function inicializarGraficaDual() {
  const canvas = document.getElementById('sensorChartCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labelsHora,
      datasets: [
        {
          label: 'pH del Agua',
          data: historyData.ph,
          borderColor: '#00f0ff',
          backgroundColor: 'rgba(0, 240, 255, 0.15)',
          yAxisID: 'y1',
          tension: 0.4, 
          fill: true,
          borderWidth: 2.5,
          pointRadius: 2,
          pointHoverRadius: 6
        },
        {
          label: 'CE (mS/cm)',
          data: historyData.ec,
          borderColor: '#ffd166',
          backgroundColor: 'rgba(255, 209, 102, 0.15)',
          yAxisID: 'y2',
          tension: 0.4, 
          fill: true,
          borderWidth: 2.5,
          pointRadius: 2,
          pointHoverRadius: 6,
          hidden: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: { color: '#8ba89c', font: { family: 'Plus Jakarta Sans', weight: '600' } }
        },
        tooltip: {
          backgroundColor: 'rgba(12, 38, 30, 0.9)',
          titleColor: '#f2fff9',
          bodyColor: '#8ba89c',
          borderColor: 'rgba(53, 229, 138, 0.3)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#8ba89c', font: { size: 10 } }
        },
        y1: { 
          type: 'linear', 
          position: 'left', 
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#8ba89c', font: { size: 10 } }
        },
        y2: { 
          type: 'linear', 
          position: 'right', 
          grid: { drawOnChartArea: false },
          ticks: { color: '#8ba89c', font: { size: 10 } }
        }
      }
    }
  });

  window.sensorChart = sensorChart;
}

function actualizarGraficaMetrica(metricKey) {
  if (!sensorChart || !configMap[metricKey]) return;

  const cfg = configMap[metricKey];
  sensorChart.data.datasets[0].label = cfg.label;
  sensorChart.data.datasets[0].data = historyData[metricKey];
  sensorChart.data.datasets[0].borderColor = cfg.color;
  sensorChart.data.datasets[0].backgroundColor = cfg.bg;

  sensorChart.update('none');
  calcularEstadisticasMetrica(metricKey);
}

function calcularEstadisticasMetrica(metric) {
  const arr = historyData[metric];
  const elMin = document.getElementById('statMin');
  const elAvg = document.getElementById('statAvg');
  const elMax = document.getElementById('statMax');
  const elTotal = document.getElementById('statTotal');

  if (!arr || arr.length === 0) {
    if (elMin) elMin.innerText = '--';
    if (elAvg) elAvg.innerText = '--';
    if (elMax) elMax.innerText = '--';
    if (elTotal) elTotal.innerText = '0';
    return;
  }
  
  const filtered = arr.filter(val => typeof val === 'number' && !isNaN(val));
  if (filtered.length === 0) return;

  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length;

  if (elMin) elMin.innerText = min.toFixed(1);
  if (elAvg) elAvg.innerText = avg.toFixed(1);
  if (elMax) elMax.innerText = max.toFixed(1);
  if (elTotal) elTotal.innerText = filtered.length;
}

function cargarHistorialFirebase() {
  if (typeof database === 'undefined') return;

  database.ref('historial').limitToLast(50).on('value', (snap) => {
    const data = snap.val();
    const tbody = document.getElementById('tablaHistorialBody');
    if (!tbody) return;

    if (!data) { 
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: var(--text-muted);">Sin registros históricos en Firebase.</td></tr>`; 
      return; 
    }

    labelsHora.length = 0; 
    Object.keys(historyData).forEach(k => historyData[k].length = 0);
    tbody.innerHTML = '';

    const entries = Object.entries(data);
    
    entries.forEach(([k, r]) => {
      const fechaLegible = r.timestamp ? new Date(r.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Auto";
      
      labelsHora.push(fechaLegible);
      historyData.ph.push(Number(r.ph) || 0); 
      historyData.temperatura.push(Number(r.temperatura) || 0);
      historyData.ec.push(Number(r.ec) || 0); 
      historyData.humedad.push(Number(r.humedad) || 0);

      const fila = document.createElement('tr');
      fila.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
      fila.innerHTML = `
        <td style="padding: 10px; color: var(--text-main); font-weight: 600;">${fechaLegible}</td>
        <td style="padding: 10px; color: var(--cyan-neon);">${r.ph !== undefined ? Number(r.ph).toFixed(1) : '--'}</td>
        <td style="padding: 10px; color: var(--warning);">${r.ec !== undefined ? Number(r.ec).toFixed(1) : '--'}</td>
        <td style="padding: 10px; color: var(--danger);">${r.temperatura !== undefined ? Number(r.temperatura).toFixed(1) : '--'} °C</td>
        <td style="padding: 10px; color: var(--green-bright);">${r.humedad !== undefined ? Math.round(r.humedad) : '--'} %</td>
      `;
      tbody.prepend(fila);
    });

    const activeMetricSel = document.getElementById('metricSelector');
    const currentMetric = activeMetricSel ? activeMetricSel.value : 'ph';
    actualizarGraficaMetrica(currentMetric);
  });
}

function exportarCSV() {
  if (typeof database === 'undefined') return;

  database.ref('historial').limitToLast(300).once('value', (snap) => {
    const data = snap.val();
    if (!data) return alert("Sin datos disponibles para exportar.");
    
    let csv = "data:text/csv;charset=utf-8,Fecha,pH,EC,Temp,Humedad\n";
    Object.values(data).forEach(r => {
      const fechaStr = r.timestamp ? new Date(r.timestamp).toLocaleString('es-MX') : '';
      csv += `"${fechaStr}",${r.ph || 0},${r.ec || 0},${r.temperatura || 0},${r.humedad || 0}\n`;
    });
    
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bitacora_Huerto_ESH_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
  });
}