// =========================================================
// MÓDULO DE GESTIÓN DE CUADRILLAS, DRAG & DROP Y EDICIÓN (ADMIN)
// =========================================================

let selectedDatesArray = [];
let dragSrcEl = null;

// Agregar fecha seleccionada como etiqueta (Badge) al crear cuadrilla
function agregarFechaASeleccion() {
  const picker = document.getElementById('inputFechaCuadrillaPicker');
  const dateVal = picker.value;
  if (!dateVal) return;

  if (!selectedDatesArray.includes(dateVal)) {
    selectedDatesArray.push(dateVal);
    renderSelectedBadges();
  }
  picker.value = '';
}

function renderSelectedBadges() {
  const container = document.getElementById('selectedBadgesDates');
  if (!container) return;
  
  container.innerHTML = selectedDatesArray.map((d, index) => `
    <span style="background: rgba(0,240,255,0.15); border: 1px solid var(--cyan-neon); color: var(--cyan-neon); font-size: 0.75rem; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px;">
      <i class="fa-regular fa-calendar"></i> ${d}
      <i class="fa-solid fa-xmark" style="cursor: pointer;" onclick="eliminarFechaSeleccionada(${index})"></i>
    </span>
  `).join('');
}

function eliminarFechaSeleccionada(index) {
  selectedDatesArray.splice(index, 1);
  renderSelectedBadges();
}

// Crear nueva cuadrilla en Firebase
function crearCarpetaCuadrilla() {
  const nombre = document.getElementById('inputNombreCuadrilla').value.trim();
  const integrantes = document.getElementById('inputIntegrantes').value.trim();

  if (!nombre) {
    alert("Por favor ingrese el nombre de la cuadrilla.");
    return;
  }
  if (selectedDatesArray.length === 0) {
    alert("Por favor seleccione al menos una fecha de labor.");
    return;
  }

  const idCuadrilla = "cuadrilla_" + Date.now();
  const nuevaCuadrilla = {
    id: idCuadrilla,
    nombre: nombre,
    integrantes: integrantes || "Sin integrantes especificados",
    fechas: selectedDatesArray,
    reportes: {},
    orden: Date.now()
  };

  db.ref('cuadrillas/' + idCuadrilla).set(nuevaCuadrilla, (error) => {
    if (error) {
      alert("Error al guardar la cuadrilla.");
    } else {
      document.getElementById('inputNombreCuadrilla').value = '';
      document.getElementById('inputIntegrantes').value = '';
      selectedDatesArray = [];
      renderSelectedBadges();
      cargarCuadrillasFirebase();
    }
  });
}

// Cargar y Renderizar Cuadrillas desde Firebase
function cargarCuadrillasFirebase() {
  const container = document.getElementById('cuadrillasContainer');
  if (!container) return;

  db.ref('cuadrillas').once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay cuadrillas registradas.</p>`;
      return;
    }

    const list = Object.values(data);
    // Ordenar por la propiedad 'orden'
    list.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    const esAdmin = currentUserRole === 'admin';

    container.innerHTML = list.map((c) => {
      const fechasStr = (c.fechas || []).join(', ');
      
      return `
        <div class="folder-card ${esAdmin ? 'draggable-folder' : ''}" 
             data-id="${c.id}" 
             ${esAdmin ? 'draggable="true"' : ''}>
          
          <div class="folder-header" onclick="toggleFolderContent('${c.id}')">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
              ${esAdmin ? '<i class="fa-solid fa-grip-vertical drag-handle" style="color: var(--text-muted); cursor: grab;"></i>' : ''}
              <div class="folder-icon-glow"><i class="fa-solid fa-folder"></i></div>
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-main); display: block;">${c.nombre}</strong>
                <small style="font-size: 0.75rem; color: var(--cyan-neon);"><i class="fa-regular fa-calendar-days"></i> Días: ${fechasStr}</small>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px;" onclick="event.stopPropagation();">
              ${esAdmin ? `
                <button class="btn-action" style="width: 32px; height: 32px; font-size: 0.8rem;" onclick="abrirModalEditarCuadrilla('${c.id}')" title="Editar Cuadrilla">
                  <i class="fa-solid fa-pen-to-square" style="color: var(--warning);"></i>
                </button>
                <button class="btn-action" style="width: 32px; height: 32px; font-size: 0.8rem;" onclick="eliminarCuadrillaFirebase('${c.id}')" title="Eliminar Cuadrilla">
                  <i class="fa-solid fa-trash-can" style="color: var(--danger);"></i>
                </button>
              ` : ''}
              <i class="fa-solid fa-chevron-down" id="arrow-${c.id}" style="color: var(--text-muted); transition: transform 0.3s;"></i>
            </div>
          </div>

          <div class="folder-content hidden" id="content-${c.id}" style="padding: 15px; background: rgba(0,0,0,0.2); border-top: 1px solid var(--card-border);">
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 10px;">
              <strong style="color: var(--text-main);"><i class="fa-solid fa-users"></i> Integrantes:</strong> ${c.integrantes}
            </p>
            
            <!-- Adjuntar Reporte Drive -->
            ${esAdmin ? `
              <div style="display: flex; gap: 8px; margin-top: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                <select id="selectFechaReporte-${c.id}" class="select-metric" style="font-size: 0.78rem;">
                  ${(c.fechas || []).map(f => `<option value="${f}">${f}</option>`).join('')}
                </select>
                <input type="text" id="inputUrlDrive-${c.id}" placeholder="Enlace de Google Drive PDF..." style="flex: 1; min-width: 180px; padding: 8px 12px; background: rgba(0,0,0,0.4); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem;">
                <button class="btn-add" style="padding: 8px 14px; font-size: 0.78rem;" onclick="adjuntarReporteDrive('${c.id}')"><i class="fa-solid fa-link"></i> Adjuntar</button>
              </div>
            ` : ''}

            <!-- Lista de Reportes Adjuntos -->
            <div id="listaReportes-${c.id}" style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
              ${renderListaReportesDrive(c)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (esAdmin) {
      activarDragAndDropCuadrillas();
    }
  });
}

function renderListaReportesDrive(cuadrilla) {
  if (!cuadrilla.reportes) return `<small style="color: var(--text-muted); font-style: italic;">Sin reportes adjuntos.</small>`;

  return Object.entries(cuadrilla.reportes).map(([fecha, url]) => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(53, 229, 138, 0.08); border: 1px solid rgba(53, 229, 138, 0.2); padding: 8px 12px; border-radius: 10px; font-size: 0.8rem;">
      <span><i class="fa-solid fa-file-pdf" style="color: var(--danger);"></i> Reporte <strong>${fecha}</strong></span>
      <a href="${url}" target="_blank" style="color: var(--cyan-neon); text-decoration: none; font-weight: 700;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver PDF</a>
    </div>
  `).join('');
}

function toggleFolderContent(id) {
  const content = document.getElementById(`content-${id}`);
  const arrow = document.getElementById(`arrow-${id}`);
  if (content) content.classList.toggle('hidden');
  if (arrow) arrow.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}

// =========================================================
// LÓGICA DE DRAG & DROP PARA REORGANIZAR CARPETAS (ADMIN)
// =========================================================
function activarDragAndDropCuadrillas() {
  const draggables = document.querySelectorAll('.draggable-folder');

  draggables.forEach(elem => {
    elem.addEventListener('dragstart', handleDragStart);
    elem.addEventListener('dragover', handleDragOver);
    elem.addEventListener('drop', handleDrop);
    elem.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  this.style.opacity = '0.4';
}

function handleDragOver(e) {
  if (e.preventDefault) e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) e.stopPropagation();

  if (dragSrcEl !== this) {
    const container = document.getElementById('cuadrillasContainer');
    const nodes = Array.from(container.children);
    const srcIndex = nodes.indexOf(dragSrcEl);
    const targetIndex = nodes.indexOf(this);

    if (srcIndex < targetIndex) {
      container.insertBefore(dragSrcEl, this.nextSibling);
    } else {
      container.insertBefore(dragSrcEl, this);
    }

    // Reordenar y actualizar el campo 'orden' en Firebase
    actualizarOrdenFirebase();
  }
  return false;
}

function handleDragEnd() {
  this.style.opacity = '1';
}

function actualizarOrdenFirebase() {
  const folders = document.querySelectorAll('.folder-card');
  folders.forEach((f, idx) => {
    const id = f.getAttribute('data-id');
    if (id) {
      db.ref(`cuadrillas/${id}/orden`).set(idx);
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
  db.ref(`cuadrillas/${id}`).once('value', (snap) => {
    const c = snap.val();
    if (!c) return;

    document.getElementById('editNombreCuadrilla').value = c.nombre || '';
    document.getElementById('editIntegrantesCuadrilla').value = c.integrantes || '';
    editFechasArray = [...(c.fechas || [])];
    
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
      <i class="fa-solid fa-xmark" style="cursor: pointer;" onclick="eliminarFechaEdicion(${index})"></i>
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

  db.ref(`cuadrillas/${cuadrillaEditandoId}`).update({
    nombre: nombre,
    integrantes: integrantes,
    fechas: editFechasArray
  }, (err) => {
    if (!err) {
      cerrarModalEditarCuadrilla();
      cargarCuadrillasFirebase();
    }
  });
}

function cerrarModalEditarCuadrilla() {
  document.getElementById('editCuadrillaModal').classList.add('hidden');
  cuadrillaEditandoId = null;
}

function eliminarCuadrillaFirebase(id) {
  if (confirm("¿Está seguro de eliminar esta cuadrilla?")) {
    db.ref(`cuadrillas/${id}`).remove(() => cargarCuadrillasFirebase());
  }
}