document.addEventListener("DOMContentLoaded", () => {
  // Inicializar el selector de mes con el mes actual
  const mesInput = document.getElementById('mesPlanificadorInput');
  if (mesInput) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    mesInput.value = `${anio}-${mes}`;
  }
  cargarCuadrillasFirebase();
});

// Arreglo temporal para almacenar las fechas seleccionadas al crear una cuadrilla
let fechasSeleccionadasCuadrilla = [];

// Función para agregar fecha desde el selector al arreglo múltiple
function agregarFechaASeleccion() {
  const inputPicker = document.getElementById('inputFechaCuadrillaPicker');
  const fecha = inputPicker.value;
  if (fecha && !fechasSeleccionadasCuadrilla.includes(fecha)) {
    fechasSeleccionadasCuadrilla.push(fecha);
    actualizarBadgesFechas();
  }
  inputPicker.value = '';
}

// Función para remover una fecha de la selección actual
function removerFechaSeleccion(fecha) {
  fechasSeleccionadasCuadrilla = fechasSeleccionadasCuadrilla.filter(f => f !== fecha);
  actualizarBadgesFechas();
}

// Renderizar las etiquetas visuales (badges) de las fechas seleccionadas
function actualizarBadgesFechas() {
  const container = document.getElementById('selectedBadgesDates');
  if (!container) return;
  
  if (fechasSeleccionadasCuadrilla.length === 0) {
    container.innerHTML = `<small style="color: var(--text-muted);">Ninguna fecha seleccionada todavía.</small>`;
    return;
  }

  container.innerHTML = fechasSeleccionadasCuadrilla.map(f => `
    <span style="background: rgba(0,240,255,0.15); border: 1px solid var(--cyan-neon); color: var(--cyan-neon); padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
      <i class="fa-regular fa-calendar"></i> ${f}
      <i class="fa-solid fa-xmark" style="cursor: pointer; color: var(--danger);" onclick="removerFechaSeleccion('${f}')" title="Quitar fecha"></i>
    </span>
  `).join('');
}

// Crear cuadrilla asignando múltiples fechas de labor
function crearCarpetaCuadrilla() {
  const nombre = document.getElementById('inputNombreCuadrilla').value.trim();
  const integrantes = document.getElementById('inputIntegrantes').value.trim();

  if (!nombre) {
    return alert("Por favor, ingresa el nombre de la cuadrilla.");
  }

  if (fechasSeleccionadasCuadrilla.length === 0) {
    return alert("Por favor, selecciona al menos una fecha de labor para la cuadrilla.");
  }

  const cuadrillaId = 'cuadrilla_' + Date.now();
  
  database.ref('cuadrillas_sistema/' + cuadrillaId).set({
    id: cuadrillaId,
    nombre: nombre,
    integrantes: integrantes || "Sin registrar",
    fechasAsignadas: fechasSeleccionadasCuadrilla,
    creado: Date.now()
  }).then(() => {
    alert(`¡Cuadrilla "${nombre}" creada exitosamente con ${fechasSeleccionadasCuadrilla.length} fechas asignadas!`);
    document.getElementById('inputNombreCuadrilla').value = '';
    document.getElementById('inputIntegrantes').value = '';
    fechasSeleccionadasCuadrilla = [];
    actualizarBadgesFechas();
    cargarCuadrillasFirebase();
  }).catch(err => {
    console.error("Error al crear cuadrilla:", err);
    alert("Error al conectar con la base de datos.");
  });
}

// Cargar carpetas y renderizar el planificador mensual
function cargarCuadrillasFirebase() {
  database.ref('cuadrillas_sistema').on('value', (snapCuadrillas) => {
    const cuadrillasData = snapCuadrillas.val();
    const container = document.getElementById('cuadrillasContainer');
    
    if (!container) return;

    if (!cuadrillasData) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay cuadrillas registradas.</p>`;
      renderizarCalendarioMensual({});
      return;
    }

    container.innerHTML = '';
    
    // Obtenemos los reportes para cruzar la información en el calendario
    database.ref('reportes_cuadrillas').once('value', (snapReportes) => {
      const reportesData = snapReportes.val() || {};

      Object.values(cuadrillasData).forEach(c => {
        const fechasTexto = c.fechasAsignadas ? c.fechasAsignadas.join(', ') : (c.fechaAsignada || 'Sin fechas');

        // Renderizar Acordeón de Carpeta
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.innerHTML = `
          <div class="folder-header" onclick="toggleAcordeonCuadrilla('${c.id}')">
            <div class="folder-title-box">
              <div class="folder-icon"><i class="fa-solid fa-folder-open"></i></div>
              <div class="folder-info">
                <h4>${c.nombre}</h4>
                <small><i class="fa-regular fa-calendar"></i> Fechas: ${fechasTexto} | Integrantes: ${c.integrantes}</small>
              </div>
            </div>
            <i class="fa-solid fa-chevron-down" id="chevron-${c.id}" style="color: var(--text-muted); transition: transform 0.3s;"></i>
          </div>

          <div class="folder-content hidden" id="content-${c.id}">
            <div style="margin-bottom: 12px;">
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 6px;">Adjuntar Enlace del PDF de Google Drive:</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <input type="text" id="nombrePdf-${c.id}" placeholder="Nombre del reporte (ej. Reporte Jornada)" style="flex: 1; min-width: 140px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem; outline: none;">
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <input type="url" id="linkPdf-${c.id}" placeholder="https://drive.google.com/file/d/..." style="flex: 1; min-width: 200px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem; outline: none;">
                <button class="btn-add" style="padding: 10px 16px; font-size: 0.8rem;" onclick="guardarLinkDriveCuadrilla('${c.id}', '${c.nombre}')"><i class="fa-solid fa-link"></i> Adjuntar Link</button>
              </div>
            </div>

            <div id="pdfList-${c.id}" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
              <small style="color: var(--text-muted);">Cargando enlaces...</small>
            </div>

            ${(userRole || localStorage.getItem("hidro_role")) === 'admin' ? `
              <div style="margin-top: 15px; text-align: right;">
                <button class="btn-danger-custom" onclick="eliminarCuadrilla('${c.id}')"><i class="fa-solid fa-trash-can"></i> Eliminar Cuadrilla</button>
              </div>
            ` : ''}
          </div>
        `;
        container.appendChild(card);
        cargarLinksDeCuadrilla(c.id);
      });

      // Dibujar el Planificador Mensual
      renderizarCalendarioMensual(cuadrillasData, reportesData);
    });
  });
}

// Generar la cuadrícula visual del mes
function renderizarCalendarioMensual(cuadrillas = {}, reportes = {}) {
  const calContainer = document.getElementById('calendarioOperativoContainer');
  const mesInput = document.getElementById('mesPlanificadorInput');
  if (!calContainer) return;

  calContainer.innerHTML = '';

  const [anio, mes] = mesInput && mesInput.value ? mesInput.value.split('-') : [new Date().getFullYear(), new Date().getMonth() + 1];
  
  const primerDiaMes = new Date(anio, mes - 1, 1).getDay();
  const totalDiasMes = new Date(anio, mes, 0).getDate();
  const ajusteInicio = primerDiaMes === 0 ? 6 : primerDiaMes - 1;

  for (let i = 0; i < ajusteInicio; i++) {
    const emptyBox = document.createElement('div');
    emptyBox.style.cssText = `background: rgba(0,0,0,0.1); border-radius: 8px; min-height: 65px; opacity: 0.2;`;
    calContainer.appendChild(emptyBox);
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const diaStr = String(dia).padStart(2, '0');
    const mesStr = String(mes).padStart(2, '0');
    const fechaActualStr = `${anio}-${mesStr}-${diaStr}`;

    const dayBox = document.createElement('div');
    dayBox.style.cssText = `
      background: rgba(0,0,0,0.25);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 6px;
      min-height: 75px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 0.75rem;
      position: relative;
    `;

    let cuadrillaAsignada = null;
    let estaCumplido = false;
    let reportesDelDia = [];

    Object.values(cuadrillas).forEach(c => {
      const listaFechas = c.fechasAsignadas || (c.fechaAsignada ? [c.fechaAsignada] : []);
      if (listaFechas.includes(fechaActualStr)) {
        cuadrillaAsignada = c;
        const reps = reportes[c.id];
        if (reps && Object.keys(reps).length > 0) {
          estaCumplido = true;
          reportesDelDia = Object.values(reps);
        }
      }
    });

    if (cuadrillaAsignada) {
      dayBox.style.cursor = 'pointer';
      if (estaCumplido) {
        dayBox.style.borderColor = 'var(--green-bright)';
        dayBox.style.background = 'rgba(53, 229, 138, 0.2)';
        dayBox.title = "Haz clic para ver el resumen y los enlaces del reporte.";
      } else {
        dayBox.style.borderColor = 'var(--warning)';
        dayBox.style.background = 'rgba(255, 209, 102, 0.12)';
        dayBox.title = "Día asignado - Pendiente de subir reporte.";
      }

      // Al hacer clic abre el modal emergente con la información de la jornada
      dayBox.onclick = () => {
        abrirResumenDiaCalendario(fechaActualStr, cuadrillaAsignada, reportesDelDia);
      };
    }

    let contenidoHtml = `<div style="font-weight: 800; color: var(--text-main);">${dia}</div>`;
    
    if (cuadrillaAsignada) {
      const badgeColor = estaCumplido ? 'var(--green-bright)' : 'var(--warning)';
      const iconoEstado = estaCumplido ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-clock"></i>';
      contenidoHtml += `
        <div style="background: rgba(0,0,0,0.4); border-radius: 4px; padding: 2px 4px; margin-top: 2px; overflow: hidden;">
          <strong style="color: ${badgeColor}; display: block; font-size: 0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cuadrillaAsignada.nombre}</strong>
          <span style="font-size: 0.6rem; color: var(--text-muted);">${iconoEstado} ${estaCumplido ? 'Cumplido' : 'Pendiente'}</span>
        </div>
      `;
    }

    dayBox.innerHTML = contenidoHtml;
    calContainer.appendChild(dayBox);
  }
}

// Abrir el Modal de Resumen Operativo
function abrirResumenDiaCalendario(fecha, cuadrilla, reportes) {
  const modal = document.getElementById('calendarSummaryModal');
  const modalTitle = document.getElementById('modalCalTitle');
  const modalBody = document.getElementById('modalCalBody');

  if (!modal || !modalBody) return;

  modalTitle.innerHTML = `<i class="fa-regular fa-calendar-check"></i> Resumen de Jornada: ${fecha}`;

  const tieneReportes = reportes && reportes.length > 0;
  const estadoBadge = tieneReportes 
    ? `<span style="background: rgba(53, 229, 138, 0.2); border: 1px solid var(--green-bright); color: var(--green-bright); padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 800;"><i class="fa-solid fa-check-circle"></i> Cumplido</span>`
    : `<span style="background: rgba(255, 209, 102, 0.2); border: 1px solid var(--warning); color: var(--warning); padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 800;"><i class="fa-solid fa-clock"></i> Pendiente de Reporte</span>`;

  let htmlReportes = '';
  if (tieneReportes) {
    htmlReportes = reportes.map(r => `
      <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); padding: 10px 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
        <div>
          <strong style="color: var(--text-main); font-size: 0.85rem; display: block;"><i class="fa-brands fa-google-drive" style="color: var(--cyan-neon);"></i> ${r.nombreArchivo}</strong>
          <small style="color: var(--text-muted); font-size: 0.75rem;">Subido el ${r.fechaSubida} por ${r.subidoPor}</small>
        </div>
        <a href="${r.pdfUrl}" target="_blank" class="btn-export" style="text-decoration: none; padding: 6px 12px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-external-link-alt"></i> Ver PDF
        </a>
      </div>
    `).join('');
  } else {
    htmlReportes = `<p style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 10px; border: 1px dashed var(--card-border);">Esta cuadrilla aún no adjunta su enlace de reporte en Google Drive para esta jornada.</p>`;
  }

  modalBody.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h4 style="color: var(--text-main); font-size: 1.1rem; font-weight: 800;">${cuadrilla.nombre}</h4>
      ${estadoBadge}
    </div>
    
    <div style="font-size: 0.85rem; margin-bottom: 12px;">
      <strong style="color: var(--text-muted);">Integrantes:</strong> <span style="color: var(--text-main);">${cuadrilla.integrantes}</span>
    </div>

    <div style="border-top: 1px solid var(--card-border); padding-top: 10px;">
      <h5 style="color: var(--cyan-neon); font-size: 0.85rem; margin-bottom: 8px;"><i class="fa-solid fa-file-pdf"></i> Reportes Adjuntos:</h5>
      ${htmlReportes}
    </div>
  `;

  modal.classList.remove('hidden');
}

function cerrarModalResumenCalendario() {
  const modal = document.getElementById('calendarSummaryModal');
  if (modal) modal.classList.add('hidden');
}

function toggleAcordeonCuadrilla(id) {
  const content = document.getElementById(`content-${id}`);
  const chevron = document.getElementById(`chevron-${id}`);
  if (content) {
    content.classList.toggle('hidden');
    if (chevron) {
      chevron.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }
}

function guardarLinkDriveCuadrilla(cuadrillaId, nombreCuadrilla) {
  const inputNombre = document.getElementById(`nombrePdf-${cuadrillaId}`);
  const inputLink = document.getElementById(`linkPdf-${cuadrillaId}`);
  
  const nombreArchivo = inputNombre.value.trim();
  const linkUrl = inputLink.value.trim();

  if (!nombreArchivo || !linkUrl) {
    return alert("Por favor, ingresa el nombre del reporte y el enlace de Google Drive.");
  }

  const fechaSubida = new Date().toLocaleString('es-MX');
  const operador = (userRole || localStorage.getItem("hidro_role")) === 'admin' ? 'H.A.G.D.R. (Admin)' : 'Hidrouser (Monitor)';

  database.ref(`reportes_cuadrillas/${cuadrillaId}`).push({
    nombreArchivo: nombreArchivo,
    pdfUrl: linkUrl,
    fechaSubida: fechaSubida,
    subidoPor: operador,
    timestamp: Date.now()
  }).then(() => {
    alert(`¡Reporte adjuntado! El calendario se ha actualizado a verde en las fechas asignadas.`);
    inputNombre.value = '';
    inputLink.value = '';
    cargarCuadrillasFirebase();
  }).catch(err => {
    console.error("Error al guardar enlace:", err);
    alert("Error al conectar con la base de datos.");
  });
}

function cargarLinksDeCuadrilla(cuadrillaId) {
  database.ref(`reportes_cuadrillas/${cuadrillaId}`).on('value', (snap) => {
    const data = snap.val();
    const listContainer = document.getElementById(`pdfList-${cuadrillaId}`);
    if (!listContainer) return;

    if (!data) {
      listContainer.innerHTML = `<small style="color: var(--text-muted);">Sin reportes en enlace adjuntos.</small>`;
      return;
    }

    listContainer.innerHTML = '';
    Object.entries(data).forEach(([pdfKey, pdfObj]) => {
      const item = document.createElement('div');
      item.className = 'pdf-file-item';
      item.innerHTML = `
        <div class="pdf-file-info">
          <i class="fa-brands fa-google-drive" style="color: var(--cyan-neon);"></i>
          <div>
            <strong>${pdfObj.nombreArchivo}</strong>
            <small>Añadido el ${pdfObj.fechaSubida}</small>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <a href="${pdfObj.pdfUrl}" target="_blank" class="btn-export" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-external-link-alt"></i> Abrir</a>
          ${(userRole || localStorage.getItem("hidro_role")) === 'admin' ? `
            <button class="btn-danger-custom" onclick="eliminarLinkCuadrilla('${cuadrillaId}', '${pdfKey}')" style="padding: 6px 10px; font-size: 0.75rem;"><i class="fa-solid fa-trash"></i></button>
          ` : ''}
        </div>
      `;
      listContainer.appendChild(item);
    });
  });
}

function eliminarCuadrilla(cuadrillaId) {
  if (confirm("¿Estás seguro de eliminar esta cuadrilla?")) {
    database.ref(`cuadrillas_sistema/${cuadrillaId}`).remove();
    database.ref(`reportes_cuadrillas/${cuadrillaId}`).remove();
    alert("Cuadrilla eliminada.");
    cargarCuadrillasFirebase();
  }
}

function eliminarLinkCuadrilla(cuadrillaId, pdfKey) {
  if (confirm("¿Desea eliminar este enlace?")) {
    database.ref(`reportes_cuadrillas/${cuadrillaId}/${pdfKey}`).remove();
    cargarCuadrillasFirebase();
  }
}