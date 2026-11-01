// =========================================================
// MÓDULO DE TRACKERS, LOTES Y CHECKLIST DE TAREAS - HUERTO ESH (HUD v3)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // Escuchar y sincronizar en tiempo real los trackers o lotes de cultivo
  database.ref('trackers').on('value', (snap) => {
    const container = document.getElementById('tracker-container');
    if (!container) return; 
    container.innerHTML = '';
    const trackers = snap.val();
    if (trackers) {
      Object.keys(trackers).forEach(k => renderTrackerItem(k, trackers[k]));
    } else {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.85rem;">No hay lotes de cultivo activos en este momento.</p>`;
    }
  });

  // Escuchar y sincronizar en tiempo real las tareas del checklist
  database.ref('tasks').on('value', (snap) => {
    const container = document.getElementById('task-container');
    if (!container) return; 
    container.innerHTML = '';
    const tasks = snap.val();
    if (tasks) {
      Object.keys(tasks).forEach(k => renderTaskItem(k, tasks[k]));
    } else {
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 15px; font-size: 0.85rem;">Sin tareas pendientes en el checklist.</p>`;
    }
  });
});

function addTracker() {
  const inputTitle = document.getElementById('tracker-input');
  const inputDays = document.getElementById('tracker-days-total');
  const inputDate = document.getElementById('tracker-date-input');

  if (!inputTitle) return;
  const title = inputTitle.value.trim();
  const totalDays = parseInt(inputDays ? inputDays.value : 30) || 30;
  const dateInput = inputDate ? inputDate.value : '';

  if (!title) {
    if (typeof mostrarToast === 'function') {
      mostrarToast("Campo Requerido", "Debes ingresar un nombre para el lote", "warning");
    } else {
      alert("Debes ingresar un nombre para el lote.");
    }
    return;
  }

  const fechaHoy = new Date().toISOString().split('T')[0];

  database.ref('trackers').push({
    title: title,
    totalDays: totalDays,
    startDate: dateInput ? dateInput : fechaHoy
  }, (error) => {
    if (!error) {
      if (typeof mostrarToast === 'function') {
        mostrarToast("Lote Creado", `Se añadió el tracker: ${title}`, "success");
      }
      inputTitle.value = '';
      if (inputDays) inputDays.value = '30';
      if (inputDate) inputDate.value = '';
    }
  });
}

function renderTrackerItem(key, item) {
  const container = document.getElementById('tracker-container');
  if (!container) return;
  
  const isAdmin = (typeof userRole !== 'undefined' ? userRole : localStorage.getItem("hidro_role")) === 'admin';
  
  const totalDays = item.totalDays || 30;
  const fechaValida = item.startDate || new Date().toISOString().split('T')[0];
  
  // Calcular días transcurridos desde la fecha de inicio
  const diffDays = Math.floor(Math.max(0, new Date() - new Date(fechaValida)) / (1000 * 60 * 60 * 24));
  let currentDay = Math.min(totalDays, Math.max(1, 1 + diffDays));
  const percentage = Math.min(100, Math.max(0, (currentDay / totalDays) * 100));

  // Distribución de fases por defecto
  const diasAgua = Math.min(7, totalDays);
  const dias50 = Math.min(7, Math.max(0, totalDays - 7));
  const dias100 = Math.max(0, totalDays - 14);

  const wAgua = ((diasAgua / totalDays) * 100).toFixed(2);
  const w50 = ((dias50 / totalDays) * 100).toFixed(2);
  const w100 = ((dias100 / totalDays) * 100).toFixed(2);

  let stagesHTML = `
    <div class="tracker-stage-segment stage-agua" style="width: ${wAgua}%; background: rgba(0, 240, 255, 0.25); border-right: 1px solid rgba(255,255,255,0.1); padding: 6px; font-size: 0.72rem; font-weight: 700; color: var(--cyan-neon); text-align: center;">Agua (${diasAgua}d)</div>
    <div class="tracker-stage-segment stage-sol50" style="width: ${w50}%; background: rgba(255, 209, 102, 0.25); border-right: 1px solid rgba(255,255,255,0.1); padding: 6px; font-size: 0.72rem; font-weight: 700; color: var(--warning); text-align: center;">Sol. 50% (${dias50}d)</div>
    <div class="tracker-stage-segment stage-sol100" style="width: ${w100}%; background: rgba(53, 229, 138, 0.25); padding: 6px; font-size: 0.72rem; font-weight: 700; color: var(--green-bright); text-align: center;">Sol. 100% (${dias100}d)</div>
  `;

  const div = document.createElement('div');
  div.className = 'tracker-item-hud animate-fade-in';
  div.innerHTML = `
    <div class="tracker-item-header">
      <strong><i class="fa-solid fa-seedling" style="color: var(--green-bright);"></i> ${item.title}</strong>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 0.8rem; font-weight: 700; background: rgba(53,229,138,0.1); border: 1px solid var(--card-border); padding: 4px 10px; border-radius: 10px; color: var(--green-bright);">Día ${currentDay} / ${totalDays}</span>
        ${isAdmin ? `<button class="btn-danger-custom" style="padding: 6px 10px;" onclick="eliminarTracker('${key}')" title="Eliminar Lote"><i class="fa-solid fa-xmark"></i></button>` : ''}
      </div>
    </div>
    
    <div class="tracker-visual-bar" style="position: relative; display: flex; height: 32px; background: rgba(0,0,0,0.4); border-radius: 10px; overflow: hidden; border: 1px solid var(--card-border);">
      ${stagesHTML}
      <div class="tracker-cursor" style="position: absolute; top: 0; bottom: 0; width: 3px; background: #fff; box-shadow: 0 0 10px #fff; left: ${percentage}%; transition: left 0.5s ease;"></div>
    </div>

    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
      <span><i class="fa-regular fa-calendar"></i> Inicio: ${fechaValida}</span>
      <span><i class="fa-solid fa-flag-checkered" style="color: var(--cyan-neon);"></i> Cosecha estimada: +${totalDays} días</span>
    </div>
  `;
  container.appendChild(div);
}

function eliminarTracker(key) {
  if (confirm("¿Estás seguro de eliminar este lote de cultivo?")) {
    database.ref(`trackers/${key}`).remove(() => {
      if (typeof mostrarToast === 'function') {
        mostrarToast("Lote Eliminado", "El tracker se ha borrado con éxito", "warning");
      }
    });
  }
}

function addTask() {
  const taskInput = document.getElementById('task-input');
  if (!taskInput) return;
  const text = taskInput.value.trim();
  
  if (!text) return;

  database.ref('tasks').push({ text, completed: false }, (error) => {
    if (!error) {
      taskInput.value = '';
      if (typeof mostrarToast === 'function') {
        mostrarToast("Tarea Añadida", "Se agregó un nuevo pendiente al checklist", "success");
      }
    }
  });
}

function renderTaskItem(key, task) {
  const container = document.getElementById('task-container');
  if (!container) return;
  
  const isAdmin = (typeof userRole !== 'undefined' ? userRole : localStorage.getItem("hidro_role")) === 'admin';
  
  const div = document.createElement('div');
  div.className = `task-item ${task.completed ? 'completed' : ''}`;
  div.innerHTML = `
    <div class="task-checkbox" onclick="database.ref('tasks/${key}/completed').set(!${task.completed})"><i class="fa-solid fa-check"></i></div>
    <span class="task-text">${task.text}</span>
    ${isAdmin ? `<button class="task-delete" onclick="database.ref('tasks/${key}').remove()" title="Eliminar Tarea"><i class="fa-solid fa-xmark"></i></button>` : ''}
  `;
  container.appendChild(div);
}

function guardarProgramacion() {
  const actSelect = document.getElementById('schedActuator');
  const timeOn = document.getElementById('schedTimeOn');
  const timeOff = document.getElementById('schedTimeOff');

  if (!actSelect || !timeOn || !timeOff) return;

  const act = actSelect.value;
  const on = timeOn.value;
  const off = timeOff.value;

  database.ref(`schedules/${act}`).set({ on, off }, (error) => {
    if (!error) {
      if (typeof mostrarToast === 'function') {
        mostrarToast("Programador Cloud", "Regla de horario guardada con éxito", "success");
      } else {
        alert("Regla de horario guardada con éxito.");
      }
    }
  });
}