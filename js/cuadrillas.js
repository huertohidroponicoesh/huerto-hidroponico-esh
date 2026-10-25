// =========================================================
// MÓDULO DE GESTIÓN DE CUADRILLAS, DRAG & DROP Y EDICIÓN (ADMIN)
// =========================================================

let fechasSeleccionadasCuadrilla = [];
let dragSrcEl = null;

document.addEventListener("DOMContentLoaded", () => {
  const mesInput = document.getElementById('mesPlanificadorInput');
  if (mesInput) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    mesInput.value = `${anio}-${mes}`;
    
    mesInput.addEventListener('change', () => {
      cargarCuadrillasFirebase();
    });
  }
  cargarCuadrillasFirebase();
});

function agregarFechaASeleccion() {
  const inputPicker = document.getElementById('inputFechaCuadrillaPicker');
  const fecha = inputPicker.value;
  if (fecha && !fechasSeleccionadasCuadrilla.includes(fecha)) {
    fechasSeleccionadasCuadrilla.push(fecha);
    actualizarBadgesFechas();
  }
  inputPicker.value = '';
}

function removerFechaSeleccion(fecha) {
  fechasSeleccionadasCuadrilla = fechasSeleccionadasCuadrilla.filter(f => f !== fecha);
  actualizarBadgesFechas();
}

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
      <i class="fa-solid fa-xmark" style="cursor: pointer; color: var(--danger);" onclick="removerFechaSeleccion('${f}')"></i>
    </span>
  `).join('');
}

function crearCarpetaCuadrilla() {
  const nombre = document.getElementById('inputNombreCuadrilla').value.trim();
  const integrantes = document.getElementById('inputIntegrantes').value.trim();

  if (!nombre) {
    return alert("Por favor, ingresa el nombre de la cuadrilla.");
  }

  if (fechasSeleccionadasCuadrilla.length === 0) {
    return alert("Por favor, selecciona al menos una fecha de labor.");
  }

  const cuadrillaId = 'cuadrilla_' + Date.now();
  
  database.ref('cuadrillas_sistema/' + cuadrillaId).set({
    id: cuadrillaId,
    nombre: nombre,
    integrantes: integrantes || "Sin registrar",
    fechasAsignadas: fechasSeleccionadasCuadrilla,
    creado: Date.now(),
    orden: Date.now()
  }).then(() => {
    alert(`¡Cuadrilla "${nombre}" creada exitosamente!`);
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

function cargarCuadrillasFirebase() {
  database.ref('cuadrillas_sistema').on('value', (snapCuadrillas) => {
    const cuadrillasData = snapCuadrillas.val();
    const container = document.getElementById('cuadrillasContainer');
    
    if (!container) return;

    if (!cuadrillasData) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 25px; font-size: 0.9rem;"><i class="fa-solid fa-folder-open" style="font-size: 1.8rem; display: block; margin-bottom: 8px; opacity: 0.5;"></i>No hay cuadrillas registradas.</p>`;
      renderizarCalendarioMensual({});
      return;
    }

    container.innerHTML = '';
    
    database.ref('reportes_cuadrillas').once('value', (snapReportes) => {
      const reportesData = snapReportes.val() || {};
      const esAdmin = (userRole || localStorage.getItem("hidro_role")) === 'admin';

      let listaCuadrillas = Object.values(cuadrillasData);
      listaCuadrillas.sort((a, b) => (a.orden || 0) - (b.orden || 0));

      listaCuadrillas.forEach((c, index) => {
        const fechasTexto = c.fechasAsignadas ? c.fechasAsignadas.join(', ') : 'Sin fechas';

        const card = document.createElement('div');
        card.className = `folder-card animate-fade-in ${esAdmin ? 'draggable-folder' : ''}`;
        card.setAttribute('data-id', c.id);
        if (esAdmin) card.setAttribute('draggable', 'true');
        card.style.animationDelay = `${index * 0.05}s`;

        card.innerHTML = `
          <div class="folder-header" onclick="toggleAcordeonCuadrilla('${c.id}')">
            <div style="display: flex; align-items: center; gap: 12px; overflow: hidden; flex: 1;">
              ${esAdmin ? '<i class="fa-solid fa-grip-vertical drag-handle" style="color: var(--text-muted); cursor: grab;"></i>' : ''}
              <div class="folder-icon-glow">
                <i class="fa-solid fa-folder"></i>
              </div>
              <div style="overflow: hidden; flex: 1;">
                <h4 style="margin: 0; font-size: 0.98rem; font-weight: 800; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.nombre}</h4>
                <small style="color: var(--text-muted); font-size: 0.72rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  <i class="fa-regular fa-calendar" style="color: var(--cyan-neon);"></i> Días: ${fechasTexto}
                </small>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;" onclick="event.stopPropagation();">
              ${esAdmin ? `
                <button class="btn-action" style="width: 32px; height: 32px; font-size: 0.8rem;" onclick="abrirModalEditarCuadrilla('${c.id}')" title="Editar Cuadrilla">
                  <i class="fa-solid fa-pen-to-square" style="color: var(--warning);"></i>
                </button>
              ` : ''}
              <i class="fa-solid fa-chevron-down" id="chevron-${c.id}" style="color: var(--text-muted); transition: transform 0.3s; font-size: 0.9rem;"></i>
            </div>
          </div>

          <div class="folder-content hidden" id="content-${c.id}" style="padding: 16px; background: rgba(0,0,0,0.25); border-radius: 0 0 18px 18px; border: 1px solid var(--card-border); border-top: none;">
            <div style="margin-bottom: 12px;">
              <small style="color: var(--text-muted); font-size: 0.78rem; display: block; margin-bottom: 8px;">
                <i class="fa-solid fa-users" style="color: var(--cyan-neon);"></i> <strong>Integrantes:</strong> ${c.integrantes}
              </small>
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-main); display: block; margin-bottom: 6px;">Adjuntar Reporte PDF por Jornada:</label>
              
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <select id="selectFechaJornada-${c.id}" style="flex: 1; min-width: 130px; padding: 10px; background: rgba(0,0,0,0.4); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem; outline: none;">
                  ${(c.fechasAsignadas || []).map(f => `<option value="${f}">${f}</option>`).join('')}
                </select>
                <input type="text" id="nombrePdf-${c.id}" placeholder="Nombre del reporte" style="flex: 2; min-width: 140px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem; outline: none;">
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <input type="url" id="linkPdf-${c.id}" placeholder="https://drive.google.com/file/d/..." style="flex: 1; min-width: 200px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem; outline: none;">
                <button class="btn-add" style="padding: 10px 16px; font-size: 0.8rem; white-space: nowrap;" onclick="guardarLinkDriveCuadrilla('${c.id}')">
                  <i class="fa-solid fa-link"></i> Adjuntar
                </button>
              </div>
            </div>

            <div id="pdfList-${c.id}" style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
              <small style="color: var(--text-muted);">Cargando enlaces...</small>
            </div>

            ${esAdmin ? `
              <div style="margin-top: 15px; text-align: right; border-top: 1px dashed var(--card-border); padding-top: 12px;">
                <button class="btn-danger-custom" onclick="eliminarCuadrilla('${c.id}')" style="padding: 6px 12px; font-size: 0.78rem;">
                  <i class="fa-solid fa-trash-can"></i> Eliminar Cuadrilla
                </button>
              </div>
            ` : ''}
          </div>
        `;
        container.appendChild(card);
        cargarLinksDeCuadrilla(c.id);
      });

      if (esAdmin) {
        activarDragAndDropCuadrillas();
      }

      renderizarCalendarioMensual(cuadrillasData, reportesData);
    });
  });
}

// =========================================================
// LÓGICA DE DRAG & DROP OPTIMIZADA (SIN GLITCHES NI DUPLICADOS)
// =========================================================
function activarDragAndDropCuadrillas() {
  const draggables = document.querySelectorAll('.draggable-folder');
  
  draggables.forEach(elem => {
    // Evitar acumulación de múltiples event listeners
    elem.removeEventListener('dragstart', handleDragStart);
    elem.removeEventListener('dragover', handleDragOver);
    elem.removeEventListener('drop', handleDrop);
    elem.removeEventListener('dragend', handleDragEnd);

    elem.addEventListener('dragstart', handleDragStart);
    elem.addEventListener('dragover', handleDragOver);
    elem.addEventListener('drop', handleDrop);
    elem.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
  
  setTimeout(() => {
    this.style.opacity = '0.4';
  }, 0);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (dragSrcEl !== this) {
    const container = document.getElementById('cuadrillasContainer');
    const allCards = Array.from(container.querySelectorAll('.folder-card'));
    const srcIndex = allCards.indexOf(dragSrcEl);
    const targetIndex = allCards.indexOf(this);

    if (srcIndex < targetIndex) {
      container.insertBefore(dragSrcEl, this.nextSibling);
    } else {
      container.insertBefore(dragSrcEl, this);
    }
    
    // Actualizar orden en Firebase de manera limpia
    actualizarOrdenFirebase();
  }
  return false;
}

function handleDragEnd(e) {
  this.style.opacity = '1';
  
  // Limpiar estados visuales en el contenedor
  const container = document.getElementById('cuadrillasContainer');
  if (container) {
    container.querySelectorAll('.folder-card').forEach(card => {
      card.style.opacity = '1';
    });
  }
  dragSrcEl = null;
}

function actualizarOrdenFirebase() {
  const folders = document.querySelectorAll('.folder-card');
  folders.forEach((f, idx) => {
    const id = f.getAttribute('data-id');
    if (id) {
      database.ref(`cuadrillas_sistema/${id}/orden`).set(idx);
    }
  });
}

// =========================================================
// MODAL DE EDICIÓN DE CUADRILLA (ADMIN)
// =========================================================
let cuadrillaEditandoId = null;
let editFechasArray = [];

function abrirModalEditarCuadrilla(id) {
  cuadrillaEditandoId = id;
  database.ref(`cuadrillas_sistema/${id}`).once('value', (snap) => {
    const c = snap.val();
    if (!c) return;

    document.getElementById('editNombreCuadrilla').value = c.nombre || '';
    document.getElementById('editIntegrantesCuadrilla').value = c.integrantes || '';
    editFechasArray = [...(c.fechasAsignadas || [])];
    
    renderEditFechasBadges();
    document.getElementById('editCuadrillaModal').classList.remove('hidden');
  });
}

function renderEditFechasBadges() {
  const container = document.getElementById('editFechasBadgesContainer');
  if (!container) return;

  container.innerHTML = editFechasArray.map((d, index) => `
    <span style="background: rgba(0,240,255,0.15); border: 1px solid var(--cyan-neon); color: var(--cyan-neon); font-size: 0.75rem; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px;">
      <i class="fa-regular fa-calendar"></i> ${d}
      <i class="fa-solid fa-xmark" style="cursor: pointer; color: var(--danger);" onclick="eliminarFechaEdicion(${index})"></i>
    </span>
  `).join('');
}

function agregarFechaEdicion() {
  const picker = document.getElementById('editFechaPicker');
  if (picker.value && !editFechasArray.includes(picker.value)) {
    editFechasArray.push(picker.value);
    renderEditFechasBadges();
  }
  picker.value = '';
}

function eliminarFechaEdicion(index) {
  editFechasArray.splice(index, 1);
  renderEditFechasBadges();
}

function guardarEdicionCuadrilla() {
  if (!cuadrillaEditandoId) return;

  const nombre = document.getElementById('editNombreCuadrilla').value.trim();
  const integrantes = document.getElementById('editIntegrantesCuadrilla').value.trim();

  if (!nombre) {
    alert("El nombre no puede estar vacío.");
    return;
  }

  database.ref(`cuadrillas_sistema/${cuadrillaEditandoId}`).update({
    nombre: nombre,
    integrantes: integrantes,
    fechasAsignadas: editFechasArray
  }, (err) => {
    if (!err) {
      alert("Cuadrilla actualizada exitosamente.");
      cerrarModalEditarCuadrilla();
      cargarCuadrillasFirebase();
    } else {
      alert("Error al actualizar la cuadrilla.");
    }
  });
}

function cerrarModalEditarCuadrilla() {
  const modal = document.getElementById('editCuadrillaModal');
  if (modal) modal.classList.add('hidden');
  cuadrillaEditandoId = null;
}

// =========================================================
// CALENDARIO Y REPORTES
// =========================================================
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
    emptyBox.style.cssText = `background: rgba(0,0,0,0.1); border-radius: 8px; opacity: 0.2; min-height: 58px;`;
    calContainer.appendChild(emptyBox);
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const diaStr = String(dia).padStart(2, '0');
    const mesStr = String(mes).padStart(2, '0');
    const fechaActualStr = `${anio}-${mesStr}-${diaStr}`;

    const dayBox = document.createElement('div');
    dayBox.className = 'calendar-day-box';

    let cuadrillaAsignada = null;
    let tieneReporteEstaFecha = false;
    let reportesDeEstaFecha = [];

    Object.values(cuadrillas).forEach(c => {
      const listaFechas = c.fechasAsignadas || [];
      if (listaFechas.includes(fechaActualStr)) {
        cuadrillaAsignada = c;
        const repsCuadrilla = reportes[c.id] || {};
        
        const filtrados = Object.values(repsCuadrilla).filter(r => r.fechaJornada === fechaActualStr);
        if (filtrados.length > 0) {
          tieneReporteEstaFecha = true;
          reportesDeEstaFecha = filtrados;
        }
      }
    });

    if (cuadrillaAsignada) {
      dayBox.style.cursor = 'pointer';
      if (tieneReporteEstaFecha) {
        dayBox.classList.add("calendar-day-cumplido");
        dayBox.title = "Reporte cumplido - Clic para ver detalles.";
      } else {
        dayBox.classList.add("calendar-day-pendiente");
        dayBox.title = "Día asignado - Pendiente de reporte.";
      }

      dayBox.onclick = () => {
        abrirResumenDiaCalendario(fechaActualStr, cuadrillaAsignada, reportesDeEstaFecha);
      };
    }

    let contenidoHtml = `<div style="font-weight: 800; color: var(--text-main); font-size: 0.8rem;">${dia}</div>`;
    
    if (cuadrillaAsignada) {
      const indicadorColor = tieneReporteEstaFecha ? 'var(--green-bright)' : 'var(--warning)';
      const textoEstado = tieneReporteEstaFecha ? '✔' : '⏳';
      const primerNombre = cuadrillaAsignada.nombre.split(' ')[0];

      contenidoHtml += `
        <div class="calendar-badge-mobile" style="background: rgba(0,0,0,0.5); border-radius: 6px; padding: 2px 4px; margin-top: auto; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
          <div style="font-weight: 700; color: var(--text-main); font-size: 0.62rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${primerNombre}</div>
          <div style="font-weight: 800; color: ${indicadorColor}; font-size: 0.6rem; margin-top: 1px;">${textoEstado}</div>
        </div>
      `;
    }

    dayBox.innerHTML = contenidoHtml;
    calContainer.appendChild(dayBox);
  }
}

function abrirResumenDiaCalendario(fecha, cuadrilla, reportes) {
  const modal = document.getElementById('calendarSummaryModal');
  const modalTitle = document.getElementById('modalCalTitle');
  const modalBody = document.getElementById('modalCalBody');

  if (!modal || !modalBody) return;

  modalTitle.innerHTML = `<i class="fa-regular fa-calendar-check"></i> Jornada: ${fecha}`;

  const tieneReportes = reportes && reportes.length > 0;
  const estadoBadge = tieneReportes 
    ? `<span style="background: rgba(53, 229, 138, 0.2); border: 1px solid var(--green-bright); color: var(--green-bright); padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 800;"><i class="fa-solid fa-check-circle"></i> Cumplido</span>`
    : `<span style="background: rgba(255, 209, 102, 0.2); border: 1px solid var(--warning); color: var(--warning); padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 800;"><i class="fa-solid fa-clock"></i> Pendiente</span>`;

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
    htmlReportes = `<p style="font-size: 0.82rem; color: var(--text-muted); font-style: italic; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 10px; border: 1px dashed var(--card-border);">Aún no hay reportes adjuntos para esta fecha específica.</p>`;
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
      <h5 style="color: var(--cyan-neon); font-size: 0.85rem; margin-bottom: 8px;"><i class="fa-solid fa-file-pdf"></i> Reporte de esta Jornada:</h5>
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

function guardarLinkDriveCuadrilla(cuadrillaId) {
  const selectFecha = document.getElementById(`selectFechaJornada-${cuadrillaId}`);
  const inputNombre = document.getElementById(`nombrePdf-${cuadrillaId}`);
  const inputLink = document.getElementById(`linkPdf-${cuadrillaId}`);
  
  const fechaJornada = selectFecha.value;
  const nombreArchivo = inputNombre.value.trim();
  const linkUrl = inputLink.value.trim();

  if (!fechaJornada || !nombreArchivo || !linkUrl) {
    return alert("Por favor, selecciona la fecha de la jornada, ingresa el nombre del reporte y el enlace.");
  }

  const fechaSubida = new Date().toLocaleString('es-MX');
  const operador = (userRole || localStorage.getItem("hidro_role")) === 'admin' ? 'H.A.G.D.R. (Admin)' : 'Hidrouser (Monitor)';

  database.ref(`reportes_cuadrillas/${cuadrillaId}`).push({
    fechaJornada: fechaJornada,
    nombreArchivo: nombreArchivo,
    pdfUrl: linkUrl,
    fechaSubida: fechaSubida,
    subidoPor: operador,
    timestamp: Date.now()
  }).then(() => {
    alert(`¡Reporte guardado para la jornada ${fechaJornada}! El calendario se ha actualizado.`);
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
      listContainer.innerHTML = `<small style="color: var(--text-muted);">Sin reportes adjuntos todavía.</small>`;
      return;
    }

    listContainer.innerHTML = '';
    Object.entries(data).forEach(([pdfKey, pdfObj]) => {
      const item = document.createElement('div');
      item.className = 'pdf-file-item';
      item.style.cssText = `background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); padding: 10px 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 6px; gap: 8px; flex-wrap: wrap;`;
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
          <i class="fa-brands fa-google-drive" style="color: var(--cyan-neon); font-size: 1.2rem;"></i>
          <div style="overflow: hidden;">
            <strong style="color: var(--text-main); font-size: 0.85rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">[${pdfObj.fechaJornada}] ${pdfObj.nombreArchivo}</strong>
            <small style="color: var(--text-muted); font-size: 0.72rem;">Añadido el ${pdfObj.fechaSubida}</small>
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <a href="${pdfObj.pdfUrl}" target="_blank" class="btn-export" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 0.78rem;"><i class="fa-solid fa-external-link-alt"></i> Abrir</a>
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