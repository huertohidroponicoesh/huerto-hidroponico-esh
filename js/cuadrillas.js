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

// Crear cuadrilla asignando fechas específicas (ej. formato YYYY-MM-DD)
function crearCarpetaCuadrilla() {
  const nombre = document.getElementById('inputNombreCuadrilla').value.trim();
  const integrantes = document.getElementById('inputIntegrantes').value.trim();
  const fechaAsignada = document.getElementById('inputFechaCuadrilla').value.trim();

  if (!nombre || !fechaAsignada) {
    return alert("Por favor, ingresa el nombre de la cuadrilla y la fecha asignada (Ej. 2026-10-25).");
  }

  const cuadrillaId = 'cuadrilla_' + Date.now();
  
  database.ref('cuadrillas_sistema/' + cuadrillaId).set({
    id: cuadrillaId,
    nombre: nombre,
    integrantes: integrantes || "Sin registrar",
    fechaAsignada: fechaAsignada,
    creado: Date.now()
  }).then(() => {
    alert(`¡Cuadrilla "${nombre}" creada exitosamente!`);
    document.getElementById('inputNombreCuadrilla').value = '';
    document.getElementById('inputIntegrantes').value = '';
    document.getElementById('inputFechaCuadrilla').value = '';
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
    
    // Obtenemos también los reportes para cruzar la información en el calendario
    database.ref('reportes_cuadrillas').once('value', (snapReportes) => {
      const reportesData = snapReportes.val() || {};

      Object.values(cuadrillasData).forEach(c => {
        // 1. Renderizar Acordeón de Carpeta
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.innerHTML = `
          <div class="folder-header" onclick="toggleAcordeonCuadrilla('${c.id}')">
            <div class="folder-title-box">
              <div class="folder-icon"><i class="fa-solid fa-folder-open"></i></div>
              <div class="folder-info">
                <h4>${c.nombre}</h4>
                <small><i class="fa-regular fa-calendar"></i> Fecha: ${c.fechaAsignada} | Integrantes: ${c.integrantes}</small>
              </div>
            </div>
            <i class="fa-solid fa-chevron-down" id="chevron-${c.id}" style="color: var(--text-muted); transition: transform 0.3s;"></i>
          </div>

          <div class="folder-content hidden" id="content-${c.id}">
            <div style="margin-bottom: 12px;">
              <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 6px;">Adjuntar Enlace del PDF de Google Drive:</label>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                <input type="text" id="nombrePdf-${c.id}" placeholder="Nombre del reporte (ej. Reporte Día 25)" style="flex: 1; min-width: 140px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem; outline: none;">
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

      // 2. Dibujar el Planificador Mensual con las cuadrillas y reportes cargados
      renderizarCalendarioMensual(cuadrillasData, reportesData);
    });
  });
}

// Generar la cuadrícula visual del mes (Estilo Planificador Mensual)
function renderizarCalendarioMensual(cuadrillas = {}, reportes = {}) {
  const calContainer = document.getElementById('calendarioOperativoContainer');
  const mesInput = document.getElementById('mesPlanificadorInput');
  if (!calContainer) return;

  calContainer.innerHTML = '';

  const [anio, mes] = mesInput && mesInput.value ? mesInput.value.split('-') : [new Date().getFullYear(), new Date().getMonth() + 1];
  
  const primerDiaMes = new Date(anio, mes - 1, 1).getDay();
  const totalDiasMes = new Date(anio, mes, 0).getDate();
  const ajusteInicio = primerDiaMes === 0 ? 6 : primerDiaMes - 1;

  // Rellenar espacios vacíos previos al inicio del mes
  for (let i = 0; i < ajusteInicio; i++) {
    const emptyBox = document.createElement('div');
    emptyBox.style.cssText = `background: rgba(0,0,0,0.1); border-radius: 8px; min-height: 65px; opacity: 0.2;`;
    calContainer.appendChild(emptyBox);
  }

  // Dibujar cada día del mes
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
    let urlReporte = '';

    Object.values(cuadrillas).forEach(c => {
      if (c.fechaAsignada && c.fechaAsignada.includes(fechaActualStr)) {
        cuadrillaAsignada = c;
        const reps = reportes[c.id];
        if (reps && Object.keys(reps).length > 0) {
          estaCumplido = true;
          const primerRep = Object.values(reps)[0];
          urlReporte = primerRep.pdfUrl;
        }
      }
    });

    if (cuadrillaAsignada) {
      if (estaCumplido) {
        dayBox.style.borderColor = 'var(--green-bright)';
        dayBox.style.background = 'rgba(53, 229, 138, 0.15)';
        dayBox.style.cursor = 'pointer';
        dayBox.title = "¡Clic para abrir el reporte en PDF!";
        dayBox.onclick = () => {
          window.open(urlReporte, '_blank');
        };
      } else {
        dayBox.style.borderColor = 'var(--warning)';
        dayBox.style.background = 'rgba(255, 209, 102, 0.08)';
      }
    }

    let contenidoHtml = `<div style="font-weight: 800; color: var(--text-main);">${dia}</div>`;
    
    if (cuadrillaAsignada) {
      const badgeColor = estaCumplido ? 'var(--green-bright)' : 'var(--warning)';
      const iconoEstado = estaCumplido ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-clock"></i>';
      contenidoHtml += `
        <div style="background: rgba(0,0,0,0.4); border-radius: 4px; padding: 2px 4px; margin-top: 2px; overflow: hidden;">
          <strong style="color: ${badgeColor}; display: block; font-size: 0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cuadrillaAsignada.nombre}</strong>
          <span style="font-size: 0.6rem; color: var(--text-muted);">${iconoEstado} ${estaCumplido ? 'Ver PDF' : 'Pendiente'}</span>
        </div>
      `;
    }

    dayBox.innerHTML = contenidoHtml;
    calContainer.appendChild(dayBox);
  }
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
    alert(`¡Reporte adjuntado! El calendario se ha actualizado a verde.`);
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