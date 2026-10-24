document.addEventListener("DOMContentLoaded", () => {
  cargarCuadrillasFirebase();
});

// Crear una nueva carpeta de Cuadrilla con rango de fechas para el calendario (Solo Admin)
function crearCarpetaCuadrilla() {
  const nombre = document.getElementById('inputNombreCuadrilla').value.trim();
  const integrantes = document.getElementById('inputIntegrantes').value.trim();
  const fechaAsignada = document.getElementById('inputFechaCuadrilla').value.trim();

  if (!nombre || !fechaAsignada) {
    return alert("Por favor, ingresa el nombre de la cuadrilla y las fechas correspondientes.");
  }

  const cuadrillaId = 'cuadrilla_' + Date.now();
  
  database.ref('cuadrillas_sistema/' + cuadrillaId).set({
    id: cuadrillaId,
    nombre: nombre,
    integrantes: integrantes || "Sin registrar",
    fechaAsignada: fechaAsignada,
    creado: Date.now()
  }).then(() => {
    alert(`¡Carpeta y asignación para "${nombre}" creada exitosamente!`);
    document.getElementById('inputNombreCuadrilla').value = '';
    document.getElementById('inputIntegrantes').value = '';
    document.getElementById('inputFechaCuadrilla').value = '';
    cargarCuadrillasFirebase();
  }).catch(err => {
    console.error("Error al crear cuadrilla:", err);
    alert("Error al conectar con la base de datos de Firebase.");
  });
}

// Cargar y renderizar carpetas y el calendario interactivo
function cargarCuadrillasFirebase() {
  database.ref('cuadrillas_sistema').on('value', (snap) => {
    const data = snap.val();
    const container = document.getElementById('cuadrillasContainer');
    const calContainer = document.getElementById('calendarioOperativoContainer');
    
    if (!container) return;

    if (!data) {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay cuadrillas registradas todavía.</p>`;
      if (calContainer) calContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Sin asignaciones en el calendario.</p>`;
      return;
    }

    container.innerHTML = '';
    if (calContainer) calContainer.innerHTML = '';

    Object.values(data).forEach(c => {
      // 1. Renderizar acordeón de la carpeta de la cuadrilla
      const card = document.createElement('div');
      card.className = 'folder-card';
      card.innerHTML = `
        <div class="folder-header" onclick="toggleAcordeonCuadrilla('${c.id}')">
          <div class="folder-title-box">
            <div class="folder-icon"><i class="fa-solid fa-folder-open"></i></div>
            <div class="folder-info">
              <h4>${c.nombre}</h4>
              <small><i class="fa-regular fa-calendar"></i> Fechas de labor: ${c.fechaAsignada} | Integrantes: ${c.integrantes}</small>
            </div>
          </div>
          <i class="fa-solid fa-chevron-down" id="chevron-${c.id}" style="color: var(--text-muted); transition: transform 0.3s;"></i>
        </div>

        <div class="folder-content hidden" id="content-${c.id}">
          <div style="margin-bottom: 12px;">
            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 6px;">Adjuntar Enlace del PDF de Google Drive:</label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
              <input type="text" id="nombrePdf-${c.id}" placeholder="Nombre del reporte (ej. Reporte de Asistencia)" style="flex: 1; min-width: 140px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem; outline: none;">
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <input type="url" id="linkPdf-${c.id}" placeholder="https://drive.google.com/file/d/..." style="flex: 1; min-width: 200px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--card-border); color: var(--text-main); border-radius: 10px; font-size: 0.8rem; outline: none;">
              <button class="btn-add" style="padding: 10px 16px; font-size: 0.8rem;" onclick="guardarLinkDriveCuadrilla('${c.id}', '${c.nombre}')"><i class="fa-solid fa-link"></i> Adjuntar Link</button>
            </div>
          </div>

          <div id="pdfList-${c.id}" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
            <small style="color: var(--text-muted);">Cargando enlaces de reportes...</small>
          </div>

          ${(userRole || localStorage.getItem("hidro_role")) === 'admin' ? `
            <div style="margin-top: 15px; text-align: right;">
              <button class="btn-danger-custom" onclick="eliminarCuadrilla('${c.id}')"><i class="fa-solid fa-trash-can"></i> Eliminar Cuadrilla</button>
            </div>
          ` : ''}
        </div>
      `;
      container.appendChild(card);

      // 2. Renderizar en el Calendario Operativo y verificar si ya cumplió (se pinta en verde)
      database.ref(`reportes_cuadrillas/${c.id}`).on('value', (snapReportes) => {
        const tieneReportes = snapReportes.exists() && Object.keys(snapReportes.val()).length > 0;
        
        let calCard = document.getElementById(`cal-card-${c.id}`);
        if (!calCard) {
          calCard = document.createElement('div');
          calCard.id = `cal-card-${c.id}`;
          calCard.className = 'calendar-card';
          if (calContainer) calContainer.appendChild(calCard);
        }

        // Si ya hay reporte adjunto, se pinta de verde brillante indicando cumplimiento
        const borderColor = tieneReportes ? 'var(--green-bright)' : 'var(--card-border)';
        const bgColor = tieneReportes ? 'rgba(53, 229, 138, 0.1)' : 'rgba(0,0,0,0.25)';
        const estadoBadge = tieneReportes 
          ? `<span style="background: rgba(53, 229, 138, 0.25); color: var(--green-bright); padding: 3px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 800;"><i class="fa-solid fa-check-double"></i> Cumplido (Verde)</span>` 
          : `<span style="background: rgba(255, 209, 102, 0.15); color: var(--warning); padding: 3px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-clock"></i> Pendiente de Reporte</span>`;

        calCard.style.borderColor = borderColor;
        calCard.style.background = bgColor;

        const listaIntegrantes = c.integrantes.split(',').map(i => `<li><i class="fa-solid fa-circle-user"></i> ${i.trim()}</li>`).join('');
        
        calCard.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h5 style="margin: 0; color: ${tieneReportes ? 'var(--green-bright)' : 'var(--text-main)'};"><i class="fa-solid fa-users"></i> ${c.nombre}</h5>
            ${estadoBadge}
          </div>
          <small style="color: var(--cyan-neon); font-weight: 700; display: block; margin-bottom: 8px;"><i class="fa-regular fa-calendar-days"></i> Días asignados: ${c.fechaAsignada}</small>
          <ul class="crew-members-list">
            ${listaIntegrantes}
          </ul>
        `;
      });

      // Cargar links de reportes
      cargarLinksDeCuadrilla(c.id);
    });
  });
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

// Guardar enlace de Google Drive en Firebase
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
    alert(`¡Reporte "${nombreArchivo}" adjuntado con éxito! El calendario se ha actualizado a verde.`);
    inputNombre.value = '';
    inputLink.value = '';
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
      listContainer.innerHTML = `<small style="color: var(--text-muted);">Sin reportes en enlace adjuntos en esta carpeta.</small>`;
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
            <small>Añadido el ${pdfObj.fechaSubida} por ${pdfObj.subidoPor}</small>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <a href="${pdfObj.pdfUrl}" target="_blank" class="btn-export" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-external-link-alt"></i> Abrir Drive</a>
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
  if (confirm("¿Estás seguro de eliminar esta cuadrilla y sus reportes?")) {
    database.ref(`cuadrillas_sistema/${cuadrillaId}`).remove();
    database.ref(`reportes_cuadrillas/${cuadrillaId}`).remove();
    alert("Cuadrilla eliminada correctamente.");
  }
}

function eliminarLinkCuadrilla(cuadrillaId, pdfKey) {
  if (confirm("¿Desea eliminar este enlace de reporte?")) {
    database.ref(`reportes_cuadrillas/${cuadrillaId}/${pdfKey}`).remove();
  }
}