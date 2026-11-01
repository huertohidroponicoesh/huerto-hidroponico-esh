// =========================================================
// MÓDULO DE EXPORTACIÓN A EXCEL (.XLSX) PARA DOCENTES E INVESTIGADORES
// =========================================================

function exportarReporteExcelEjecutivo() {
  if (typeof XLSX === 'undefined') {
    if (typeof mostrarToast === 'function') {
      mostrarToast("Cargando Librería", "La librería de Excel se está cargando. Intenta de nuevo en un momento.", "warning");
    } else {
      alert("⚠️ La librería de Excel se está cargando. Intenta de nuevo en un momento.");
    }
    return;
  }

  // 1. Obtener datos de la Bitácora Histórica (Tabla de la Interfaz o Firebase)
  const tablaBody = document.getElementById('tablaHistorialBody');
  const filas = tablaBody ? tablaBody.querySelectorAll('tr') : [];

  const datosHistorial = [];
  const datosEventosMantenimiento = [];

  filas.forEach((fila) => {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length >= 5 && !fila.innerText.includes('Cargando')) {
      datosHistorial.push({
        "Fecha / Hora": celdas[0].innerText.trim(),
        "pH del Agua": parseFloat(celdas[1].innerText) || celdas[1].innerText.trim(),
        "Conductividad CE (mS/cm)": parseFloat(celdas[2].innerText) || celdas[2].innerText.trim(),
        "Temperatura Agua (°C)": parseFloat(celdas[3].innerText) || celdas[3].innerText.trim(),
        "Humedad Ambiente (%)": parseFloat(celdas[4].innerText) || celdas[4].innerText.trim()
      });
    } else if (celdas.length >= 2 && fila.innerText.includes('Calibración')) {
      // Captura de eventos de mantenimiento/calibración intercalados en la bitácora
      datosEventosMantenimiento.push({
        "Fecha / Hora": celdas[0].innerText.trim(),
        "Evento / Descripción": celdas[1].innerText.replace(/\n/g, ' ').trim()
      });
    }
  });

  // 2. Obtener datos del Historial de Alertas Push & Anomalías Recientes
  const tablaAlertasBody = document.getElementById('tablaAlertasPushBody');
  const filasAlertas = tablaAlertasBody ? tablaAlertasBody.querySelectorAll('tr') : [];

  const datosAlertas = [];
  filasAlertas.forEach((fila) => {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length >= 4 && !fila.innerText.includes('Sin alertas')) {
      datosAlertas.push({
        "Fecha / Hora Alerta": celdas[0].innerText.trim(),
        "Tipo de Anomalía / Evento": celdas[1].innerText.trim(),
        "Valores Registrados": celdas[2].innerText.trim(),
        "Estado Notificación Push": celdas[3].innerText.trim()
      });
    }
  });

  // 3. Crear el Libro de Trabajo (Workbook)
  const wb = XLSX.utils.book_new();

  // ---------------------------------------------------------
  // PESTAÑA 1: RESUMEN EJECUTIVO & METADATOS INSTITUCIONALES
  // ---------------------------------------------------------
  const fechaGeneracion = new Date().toLocaleString('es-MX');
  const huertoActual = document.getElementById('currentHuertoTitle') ? document.getElementById('currentHuertoTitle').innerText : 'Huerto NFT Principal';
  
  // Umbrales actuales configurados en la interfaz
  const phMin = document.getElementById('threshPhMin') ? document.getElementById('threshPhMin').value : '5.5';
  const phMax = document.getElementById('threshPhMax') ? document.getElementById('threshPhMax').value : '6.5';
  const ecMin = document.getElementById('threshEcMin') ? document.getElementById('threshEcMin').value : '2.0';
  const ecMax = document.getElementById('threshEcMax') ? document.getElementById('threshEcMax').value : '2.5';
  const tempMin = document.getElementById('threshTempMin') ? document.getElementById('threshTempMin').value : '18.0';
  const tempMax = document.getElementById('threshTempMax') ? document.getElementById('threshTempMax').value : '24.0';

  const resumenData = [
    ["SISTEMA AUTOMATIZADO DE MONITOREO HIDROPÓNICO IoT"],
    ["ESCUELA SUPERIOR DE HUEJUTLA - UNIVERSIDAD AUTÓNOMA DEL ESTADO DE HIDALGO (UAEH)"],
    ["REPORTE EJECUTIVO DE MONITOREO E INVESTIGACIÓN HIDROPÓNICA"],
    [],
    ["METADATOS DEL REPORTE"],
    ["Fecha y Hora de Exportación:", fechaGeneracion],
    ["Módulo de Cultivo / Circuito:", huertoActual],
    ["Registros en Bitácora de Sensores:", datosHistorial.length],
    ["Eventos de Alerta / Anomalías Registradas:", datosAlertas.length],
    [],
    ["CONFIGURACIÓN DE UMBRALES ÓPTIMOS ESTABLECIDOS"],
    ["PARÁMETRO", "LÍMITE MÍNIMO", "LÍMITE MÁXIMO", "UNIDAD DE MEDIDA"],
    ["pH del Agua", phMin, phMax, "Escala pH"],
    ["Conductividad Eléctrica (CE)", ecMin, ecMax, "mS/cm"],
    ["Temperatura del Agua", tempMin + " °C", tempMax + " °C", "Grados Celsius"],
    ["Humedad Ambiente", "Ambiental Exterior", "Optimizado por Ventilación", "Porcentaje %"],
    [],
    ["RESPONSABLES DEL SISTEMA"],
    ["Institución:", "Escuela Superior de Huejutla · UAEH"],
    ["Área Académica:", "Propedéutico Ciencias Básicas e Ingeniería"],
    ["Desarrollo & Operación:", "Cuadrilla de Programación e Ingeniería IoT"]
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  
  // Ancho de columnas para Pestaña 1
  wsResumen['!cols'] = [
    { wch: 38 },
    { wch: 28 },
    { wch: 28 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Ejecutivo");

  // ---------------------------------------------------------
  // PESTAÑA 2: BITÁCORA HISTÓRICA DE SENSORES Y CALIBRACIÓN
  // ---------------------------------------------------------
  if (datosHistorial.length > 0) {
    const wsHistorial = XLSX.utils.json_to_sheet(datosHistorial);
    wsHistorial['!cols'] = [
      { wch: 24 },
      { wch: 15 },
      { wch: 24 },
      { wch: 24 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsHistorial, "Bitácora de Sensores");
  } else {
    const wsVacio = XLSX.utils.aoa_to_sheet([["No hay lecturas de sensores registradas en la bitácora actual"]]);
    XLSX.utils.book_append_sheet(wb, wsVacio, "Bitácora de Sensores");
  }

  // ---------------------------------------------------------
  // PESTAÑA 3: DIAGNÓSTICO DE ALERTAS & EVENTOS PUSH
  // ---------------------------------------------------------
  if (datosAlertas.length > 0) {
    const wsAlertas = XLSX.utils.json_to_sheet(datosAlertas);
    wsAlertas['!cols'] = [
      { wch: 24 },
      { wch: 45 },
      { wch: 35 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsAlertas, "Historial de Alertas Push");
  } else {
    const wsAlertasVacio = XLSX.utils.aoa_to_sheet([["Todos los parámetros se han mantenido óptimos. Sin registro de alertas críticas."]]);
    XLSX.utils.book_append_sheet(wb, wsAlertasVacio, "Historial de Alertas Push");
  }

  // 4. Descargar el archivo Excel (.xlsx) con nombre dinámico
  const fechaNombre = new Date().toISOString().slice(0, 10);
  const nombreArchivo = `Reporte_Ejecutivo_Huerto_ESH_${fechaNombre}.xlsx`;

  XLSX.writeFile(wb, nombreArchivo);
  
  if (typeof mostrarToast === 'function') {
    mostrarToast("Exportación Exitosa", `Se descargó '${nombreArchivo}' con 3 pestañas de análisis.`, "success");
  } else {
    console.log(`✅ Reporte Excel descargado exitosamente: ${nombreArchivo}`);
  }
}

function exportarCSV() {
  const tablaBody = document.getElementById('tablaHistorialBody');
  const filas = tablaBody ? tablaBody.querySelectorAll('tr') : [];

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Hora/Fecha,pH del Agua,Conductividad CE (mS/cm),Temperatura Agua (C),Humedad Ambiente (%)\n";

  let cont = 0;
  filas.forEach((fila) => {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length >= 5 && !fila.innerText.includes('Cargando')) {
      const hora = celdas[0].innerText.trim();
      const ph = celdas[1].innerText.trim();
      const ce = celdas[2].innerText.trim();
      const temp = celdas[3].innerText.trim();
      const hum = celdas[4].innerText.trim();
      
      csvContent += `"${hora}","${ph}","${ce}","${temp}","${hum}"\n`;
      cont++;
    }
  });

  if (cont === 0) {
    if (typeof mostrarToast === 'function') return mostrarToast("Sin Datos", "No hay datos en la tabla para exportar a CSV.", "warning");
    return alert("No hay datos en la tabla para exportar a CSV.");
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  const fechaNombre = new Date().toISOString().slice(0, 10);
  
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Bitacora_Hidroponica_ESH_${fechaNombre}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (typeof mostrarToast === 'function') {
    mostrarToast("CSV Generado", `Descargado archivo CSV con ${cont} registros.`, "success");
  }
}