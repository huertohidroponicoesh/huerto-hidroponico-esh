// =========================================================
// MÓDULO DE EXPORTACIÓN A EXCEL (.XLSX) PARA DOCENTES E INVESTIGADORES
// =========================================================

function exportarReporteExcelEjecutivo() {
  if (typeof XLSX === 'undefined') {
    return alert("⚠️ La librería de Excel se está cargando. Intenta de nuevo en un momento.");
  }

  // 1. Obtener datos de la bitácora desde Firebase o tabla de la interfaz
  const tablaBody = document.getElementById('tablaHistorialBody');
  const filas = tablaBody ? tablaBody.querySelectorAll('tr') : [];

  const datosHistorial = [];
  filas.forEach((fila) => {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length >= 5 && !fila.innerText.includes('Cargando')) {
      datosHistorial.push({
        "Hora / Fecha": celdas[0].innerText.trim(),
        "pH del Agua": parseFloat(celdas[1].innerText) || celdas[1].innerText.trim(),
        "Conductividad CE (mS/cm)": parseFloat(celdas[2].innerText) || celdas[2].innerText.trim(),
        "Temperatura Agua (°C)": parseFloat(celdas[3].innerText) || celdas[3].innerText.trim(),
        "Humedad Ambiente (%)": parseFloat(celdas[4].innerText) || celdas[4].innerText.trim()
      });
    }
  });

  // 2. Crear Libro de Trabajo
  const wb = XLSX.utils.book_new();

  // ---------------------------------------------------------
  // PESTAÑA 1: RESUMEN EJECUTIVO
  // ---------------------------------------------------------
  const fechaGeneracion = new Date().toLocaleString('es-MX');
  const huertoActual = document.getElementById('currentHuertoTitle') ? document.getElementById('currentHuertoTitle').innerText : 'Huerto NFT Principal';
  
  const resumenData = [
    ["SISTEMA AUTOMATIZADO DE MONITOREO HIDROPÓNICO IoT"],
    ["ESCUELA SUPERIOR DE HUEJUTLA - UAEH"],
    ["REPORTE EJECUTIVO PARA DOCENTES E INVESTIGADORES"],
    [],
    ["Fecha de Generación:", fechaGeneracion],
    ["Huerto / Circuito:", huertoActual],
    ["Total Registros Analizados:", datosHistorial.length],
    [],
    ["PARÁMETRO", "RANGO ÓPTIMO DESIGNADO"],
    ["pH del Agua", "5.5 - 6.5"],
    ["Conductividad Eléctrica (CE)", "2.0 - 2.5 mS/cm"],
    ["Temperatura del Agua", "18.0°C - 24.0°C"],
    ["Humedad Ambiente", "Optimizada por Ventilación Exterior"]
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Ejecutivo");

  // ---------------------------------------------------------
  // PESTAÑA 2: BITÁCORA HISTÓRICA DE SENSORES
  // ---------------------------------------------------------
  if (datosHistorial.length > 0) {
    const wsHistorial = XLSX.utils.json_to_sheet(datosHistorial);
    XLSX.utils.book_append_sheet(wb, wsHistorial, "Bitácora de Sensores");
  } else {
    const wsVacio = XLSX.utils.aoa_to_sheet([["No hay registros en la bitácora actual"]]);
    XLSX.utils.book_append_sheet(wb, wsVacio, "Bitácora de Sensores");
  }

  // 3. Descargar el archivo Excel generado
  const fechaNombre = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `Reporte_Ejecutivo_Huerto_ESH_${fechaNombre}.xlsx`;

  XLSX.writeFile(wb, nombreArchivo);
  console.log(`✅ Reporte Excel descargado: ${nombreArchivo}`);
}