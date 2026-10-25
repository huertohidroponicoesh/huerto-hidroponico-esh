// =========================================================
// MÓDULO DE AUTENTICACIÓN, SESIONES Y RELOJ - HUERTO ESH V3
// =========================================================

let userRole = null;

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

function seleccionarPerfil(user) {
  const userInput = document.getElementById('userInput');
  const userLabel = document.getElementById('selectedUserLabel');
  const usersGrid = document.getElementById('hydeUsersGrid');
  const loginForm = document.getElementById('loginForm');
  const passInput = document.getElementById('passInput');

  if (userInput) userInput.value = user;
  if (userLabel) {
    userLabel.innerText = user === 'H.A.G.D.R.' ? 'H.A.G.D.R. (Administrador)' : 'Hidrouser (Monitor)';
  }
  if (usersGrid) usersGrid.classList.add('hidden');
  if (loginForm) loginForm.classList.remove('hidden');
  if (passInput) passInput.focus();
}

function regresarSeleccionUsuarios() {
  const passInput = document.getElementById('passInput');
  const errorMsg = document.getElementById('loginErrorMsg');
  const loginForm = document.getElementById('loginForm');
  const usersGrid = document.getElementById('hydeUsersGrid');

  if (passInput) passInput.value = '';
  if (errorMsg) errorMsg.classList.add('hidden');
  if (loginForm) loginForm.classList.add('hidden');
  if (usersGrid) usersGrid.classList.remove('hidden');
}

function autenticar() {
  const userInputEl = document.getElementById("userInput");
  const passInputEl = document.getElementById("passInput");
  const rememberEl = document.getElementById("rememberMe");
  const loginCard = document.getElementById("loginCard");
  const loginErrorMsg = document.getElementById("loginErrorMsg");

  if (!userInputEl || !passInputEl) return;

  const user = userInputEl.value;
  const pass = passInputEl.value;
  const remember = rememberEl ? rememberEl.checked : false;

  // Credenciales oficiales del huerto hidropónico de la ESH (UAEH)
  if (
    (user === "H.A.G.D.R." && pass === "HidroESH#2026!") || 
    (user === "Hidrouser" && pass === "HydroUser_2026*")
  ) {
    // CORRECCIÓN: Asignar explícitamente "admin" o "monitor"
    userRole = (user === "H.A.G.D.R.") ? "admin" : "monitor";
    
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
      loginCard.classList.add("shake");
      setTimeout(() => loginCard.classList.remove("shake"), 500);
    }
    if (loginErrorMsg) loginErrorMsg.classList.remove("hidden");
  }
}

function mostrarInterfaz() {
  const overlay = document.getElementById("loginOverlay");
  const app = document.getElementById("appContainer");
  const lblUserRole = document.getElementById('lblUserRole');

  if (overlay) {
    overlay.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    overlay.style.opacity = "0";
    overlay.style.transform = "scale(1.05)";
    
    setTimeout(() => {
      overlay.classList.add("hidden");
      if (app) app.classList.remove("hidden");
    }, 500);
  } else if (app) {
    app.classList.remove("hidden");
  }

  const rolActivo = userRole || localStorage.getItem("hidro_role") || "monitor";
  const roleText = rolActivo === 'admin' ? 'Administrador General' : 'Monitor de Campo';
  
  if (lblUserRole) lblUserRole.innerText = roleText;

  if (rolActivo === 'monitor') {
    document.body.classList.add('role-guest');
  } else {
    document.body.classList.remove('role-guest');
  }
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
      reloj.innerText = new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    }
  }, 1000);
}