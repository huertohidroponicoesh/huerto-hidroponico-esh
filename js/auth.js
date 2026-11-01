// =========================================================
// MÓDULO DE AUTENTICACIÓN, SESIONES Y RELOJ - HUERTO ESH V3
// =========================================================

let userRole = null;
let perfilSeleccionadoTemp = 'H.A.G.D.R.';

document.addEventListener("DOMContentLoaded", () => {
  iniciarReloj();
  
  // Cargar y aplicar el tema visual guardado previamente
  const savedTheme = localStorage.getItem("hidro_theme") || "theme-emerald";
  cambiarTemaVisual(savedTheme, false);
  
  const themeSel = document.getElementById('themeSelector');
  if (themeSel) themeSel.value = savedTheme;

  // Validar si ya existe una sesión activa almacenada
  if (localStorage.getItem("hidro_logged_in") === "true") {
    userRole = localStorage.getItem("hidro_role") || "admin";
    mostrarInterfaz();
  }
});

function cambiarTemaVisual(themeName, guardar = true) {
  document.body.className = themeName;
  if (guardar) localStorage.setItem("hidro_theme", themeName);
}

function toggleMostrarPass() {
  const pass = document.getElementById("passInput");
  const icon = document.getElementById("togglePassword");
  if (!pass || !icon) return;
  
  if (pass.type === "password") { 
    pass.type = "text"; 
    icon.classList.replace("fa-eye", "fa-eye-slash"); 
  } else { 
    pass.type = "password"; 
    icon.classList.replace("fa-eye-slash", "fa-eye"); 
  }
}

function seleccionarPerfil(tipo) {
  perfilSeleccionadoTemp = tipo;
  const usersGrid = document.getElementById('hydeUsersGrid');
  const loginForm = document.getElementById('loginForm');
  const selectedUserLabel = document.getElementById('selectedUserLabel');
  const userInput = document.getElementById('userInput');
  const passInput = document.getElementById('passInput');

  if (usersGrid) usersGrid.classList.add('hidden');
  if (loginForm) loginForm.classList.remove('hidden');

  if (selectedUserLabel) {
    selectedUserLabel.innerText = tipo;
  }
  if (userInput) {
    userInput.value = tipo;
  }
  if (passInput) passInput.focus();
}

function regresarSeleccionUsuarios() {
  const passInput = document.getElementById('passInput');
  const errorMsg = document.getElementById('loginErrorMsg');
  const usersGrid = document.getElementById('hydeUsersGrid');
  const loginForm = document.getElementById('loginForm');

  if (passInput) passInput.value = '';
  if (errorMsg) errorMsg.classList.add('hidden');
  if (loginForm) loginForm.classList.add('hidden');
  if (usersGrid) usersGrid.classList.remove('hidden');
}

function autenticar() {
  const passInputEl = document.getElementById("passInput");
  const rememberEl = document.getElementById("rememberMe");
  const loginCard = document.getElementById("loginCard");
  const loginErrorMsg = document.getElementById("loginErrorMsg");

  if (!passInputEl) return;

  const pass = passInputEl.value;
  const remember = rememberEl ? rememberEl.checked : false;

  // Credenciales oficiales del huerto hidropónico de la ESH (UAEH)
  const passAdmin = "HidroESH#2026!";
  const passGuest = "HydroUser_2026*";

  let autenticadoValido = false;
  if (perfilSeleccionadoTemp === 'H.A.G.D.R.' && pass === passAdmin) {
    userRole = 'admin';
    autenticadoValido = true;
  } else if (perfilSeleccionadoTemp === 'Hidrouser' && pass === passGuest) {
    userRole = 'guest';
    autenticadoValido = true;
  }

  if (autenticadoValido) {
    if (remember) { 
      localStorage.setItem("hidro_logged_in", "true"); 
      localStorage.setItem("hidro_role", userRole); 
    } else {
      localStorage.removeItem("hidro_logged_in");
      localStorage.removeItem("hidro_role");
    }
    
    mostrarInterfaz();
  } else {
    if (loginCard) {
      loginCard.style.animation = "none";
      loginCard.offsetHeight; // trigger reflow
      loginCard.style.animation = "slideUpCard 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards";
    }
    if (loginErrorMsg) loginErrorMsg.classList.remove("hidden");
  }
}

function mostrarInterfaz() {
  const overlay = document.getElementById("loginOverlay");
  const lblUserRole = document.getElementById("lblUserRole");

  if (overlay) {
    overlay.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    overlay.style.opacity = "0";
    overlay.style.transform = "scale(1.03)";
    
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 400);
  }

  const rolActivo = userRole || localStorage.getItem("hidro_role") || "admin";
  const roleText = rolActivo === 'admin' ? 'Administrador General' : 'Monitor de Sistema';
  
  if (lblUserRole) lblUserRole.innerText = roleText;

  // Manejo de visibilidad para elementos de administrador en la interfaz
  if (rolActivo === 'guest') {
    document.body.classList.add('role-guest');
  } else {
    document.body.classList.remove('role-guest');
  }
  
  const appContainer = document.getElementById("appContainer");
  if (appContainer) appContainer.classList.remove("hidden");
}

function cerrarSesion() {
  localStorage.removeItem("hidro_logged_in"); 
  localStorage.removeItem("hidro_role");
  location.reload();
}

function iniciarReloj() {
  setInterval(() => {
    const reloj = document.getElementById("liveClock");
    if (reloj) {
      const horaActual = new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      reloj.innerText = horaActual;
    }
  }, 1000);
}