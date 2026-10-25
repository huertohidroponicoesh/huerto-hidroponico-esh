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
  cargarHistorialFirebase(); // Agkonektar ken agdinenggeg a direkta iti Firebase Realtime
});

function inicializarGraficaDual() {
  const canvas = document.getElementById('sensorChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Pannakaaramid ti Gradient para iti Bumaet a Tinep-tep a Kolor iti Sango ti Linia
  const createGradient = (colorHex) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, colorHex.replace('0.15', '0.35').replace('0.1', '0.3') || 'rgba(0,240,255,0.3)');
    gradient.addColorStop(1, 'rgba(3, 13, 10, 0.0)');
    return gradient;
  };

  sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labelsHora,
      datasets: [
        {
          label: 'pH',
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
          label: 'CE',
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

  const selectY1 = document.getElementById('chartSelectY1');
  const selectY2 = document.getElementById('chartSelectY2');

  if (selectY1) selectY1.addEventListener('change', actualizarGraficaDual);
  if (selectY2) selectY2.addEventListener('change', actualizarGraficaDual);
}

function actualizarGraficaDual() {
  const elY1 = document.getElementById('chartSelectY1');
  const elY2 = document.getElementById('chartSelectY2');
  if (!elY1 || !elY2 || !sensorChart) return;

  const m1 = elY1.value;
  const m2 = elY2.value;
  const cfg1 = configMap[m1];

  // Agurnos iti Dataset Principal (Y1)
  sensorChart.data.datasets[0].label = cfg1.label;
  sensorChart.data.datasets[0].data = historyData[m1];
  sensorChart.data.datasets[0].borderColor = cfg1.color;
  sensorChart.data.datasets[0].backgroundColor = cfg1.bg;

  // Agurnos iti Dataset Secundario (Y2) wenno panangilemmeng no 'none'
  const datasetY2 = sensorChart.data.datasets[1];
  const scaleY2 = sensorChart.options.scales.y2;

  if (m2 === 'none' || !configMap[m2]) {
    datasetY2.hidden = true;
    if (scaleY2) scaleY2.display = false;
  } else {
    const cfg2 = configMap[m2];
    datasetY2.hidden = false;
    if (scaleY2) scaleY2.display = true;
    datasetY2.label = cfg2.label;
    datasetY2.data = historyData[m2];
    datasetY2.borderColor = cfg2.color;
    datasetY2.backgroundColor = cfg2.bg;
    datasetY2.yAxisID = 'y2';
  }

  sensorChart.update('none'); // Naannayas nga update a awan pannakailawag ti panag-flash
  calcularEstadisticasY1(m1);
}

function calcularEstadisticasY1(metric) {
  const arr = historyData[metric];
  if (!arr || arr.length === 0) return;
  
  const filtered = arr.filter(val => typeof val === 'number' && !isNaN(val));
  if (filtered.length === 0) return;

  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  const avg = filtered.reduce((a, b) => a + b, 0) / filtered.length;

  const elMin = document.getElementById('statMin');
  const elAvg = document.getElementById('statAvg');
  const elMax = document.getElementById('statMax');

  if (elMin) elMin.innerText = min.toFixed(1);
  if (elAvg) elAvg.innerText = avg.toFixed(1);
  if (elMax) elMax.innerText = max.toFixed(1);
}

function cargarHistorialFirebase() {
  if (typeof database === 'undefined') return;

  // Inaramat ti .on('value') tapno agbalin a dynamic ken ag-update a direkta no adda baro a datos
  database.ref('historial').limitToLast(30).on('value', (snap) => {
    const data = snap.val();
    const tbody = document.getElementById('tablaHistorialBody');
    if (!tbody) return;

    if (!data) { 
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px; color: var(--text-muted);">Sin registros históricos.</td></tr>`; 
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

    actualizarGraficaDual();
  });
}

function exportarCSV() {
  if (typeof database === 'undefined') return;

  database.ref('historial').limitToLast(300).once('value', (snap) => {
    const data = snap.val();
    if (!data) return alert("Sin datos disonibles para exportar.");
    
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

function exportarGraficaPNG() {
  if (!sensorChart) return alert("La gráfica no está inicializada.");
  
  const urlImage = sensorChart.toBase64Image();
  const link = document.createElement('a');
  link.href = urlImage;
  link.download = `Analitica_Huerto_ESH_${new Date().toISOString().split('T')[0]}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  if (typeof mostrarToast === 'function') {
    mostrarToast("Exportación Exitosa", "Gráfica descargada en alta resolución PNG", "success");
  } else {
    alert("¡Gráfica exportada a PNG con éxito!");
  }
}