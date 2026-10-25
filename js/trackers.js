// =========================================================
// MÓDULO DE TRACKERS, LOTES Y CHECKLIST DE TAREAS - HUERTO ESH
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
      container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 15px; font-size: 0.85rem;">No hay lotes de cultivo activos.</p>`;
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

  // Distribución de fases por defecto (Fase 1: 7d Agua, Fase 2: 7d Sol 50%, Resto: Sol 100%)
  const diasAgua = Math.min(7, totalDays);
  const dias50 = Math.min(7, Math.max(0, totalDays - 7));
  const dias100 = Math.max(0, totalDays - 14);

  const wAgua = ((diasAgua / totalDays) * 100).toFixed(2);
  const w50 = ((dias50 / totalDays) * 100).toFixed(2);
  const w100 = ((dias100 / totalDays) * 100).toFixed(2);

  let stagesHTML = `
    <div class="tracker-stage-segment stage-agua" style="width: ${wAgua}%;">Agua (${diasAgua}d)</div>
    <div class="tracker-stage-segment stage-sol50" style="width: ${w50}%;">Sol. 50% (${dias50}d)</div>
    <div class="tracker-stage-segment stage-sol100" style="width: ${w100}%;">Sol. 100% (${dias100}d)</div>
  `;

  const div = document.createElement('div');
  div.className = 'tracker-item animate-fade-in';
  div.innerHTML = `
    <div class="tracker-header">
      <span class="tracker-title"><i class="fa-solid fa-seedling" style="color: var(--green-bright);"></i> ${item.title}</span>
      <div class="tracker-actions">
        <span class="tracker-days">Día ${currentDay} / ${totalDays}</span>
        ${isAdmin ? `<button class="tracker-delete" onclick="eliminarTracker('${key}')" title="Eliminar Lote"><i class="fa-solid fa-xmark"></i></button>` : ''}
      </div>
    </div>
    <div class="tracker-visual-bar">
      ${stagesHTML}
      <div class="tracker-cursor" style="left: ${percentage}%;"></div>
    </div>
    <div class="tracker-dates">
      <span>Inicio: ${fechaValida}</span>
      <span>Cosecha estimada: +${totalDays} días</span>
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