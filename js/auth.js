// =========================================================
// MÓDULO DE AUTENTICACIÓN, SESIONES Y RELOJ - HUERTO ESH V3
// =========================================================

let userRole = null;

document.addEventListener("DOMContentLoaded", () => {
  iniciarReloj();
  
  // Cargar y aplicar el tema visual guardado previamente
  const savedTheme = localStorage.getItem("hidro_theme") || "theme-midnight";
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
  document.body.className = "theme-" + themeName.replace("theme-", "");
  if (guardar) localStorage.setItem("hidro_theme", themeName);
}

function togglePasswordVisibility() {
  const pass = document.getElementById("inputPassword");
  const icon = document.querySelector(".toggle-password");
  if (!pass || !icon) return;
  
  if (pass.type === "password") { 
    pass.type = "text"; 
    icon.classList.replace("fa-eye", "fa-eye-slash"); 
  } else { 
    pass.type = "password"; 
    icon.classList.replace("fa-eye-slash", "fa-eye"); 
  }
}

let perfilSeleccionadoTemp = 'admin';

function seleccionarPerfil(tipo) {
  perfilSeleccionadoTemp = tipo;
  const userSelectionStep = document.getElementById('userSelectionStep');
  const loginFormStep = document.getElementById('loginFormStep');
  const selectedRoleTitle = document.getElementById('selectedRoleTitle');
  const selectedRoleIcon = document.getElementById('selectedRoleIcon');
  const passInput = document.getElementById('inputPassword');

  if (userSelectionStep) userSelectionStep.classList.add('hidden');
  if (loginFormStep) loginFormStep.classList.remove('hidden');

  if (selectedRoleTitle) {
    selectedRoleTitle.innerText = tipo === 'admin' ? 'H.A.G.D.R. (Administrador)' : 'Hidrouser (Invitado)';
  }
  if (selectedRoleIcon) {
    selectedRoleIcon.className = tipo === 'admin' ? 'fa-solid fa-user-gear' : 'fa-solid fa-eye';
  }
  if (passInput) passInput.focus();
}

function regresarSeleccionPerfil() {
  const passInput = document.getElementById('inputPassword');
  const errorMsg = document.getElementById('loginErrorMsg');
  const userSelectionStep = document.getElementById('userSelectionStep');
  const loginFormStep = document.getElementById('loginFormStep');

  if (passInput) passInput.value = '';
  if (errorMsg) errorMsg.classList.add('hidden');
  if (loginFormStep) loginFormStep.classList.add('hidden');
  if (userSelectionStep) userSelectionStep.classList.remove('hidden');
}

function ejecutarLogin(event) {
  if (event) event.preventDefault();
  
  const passInputEl = document.getElementById("inputPassword");
  const rememberEl = document.getElementById("rememberSession");
  const loginCard = document.querySelector(".login-hex-card");
  const loginErrorMsg = document.getElementById("loginErrorMsg");

  if (!passInputEl) return;

  const pass = passInputEl.value;
  const remember = rememberEl ? rememberEl.checked : false;

  // Credenciales oficiales del huerto hidropónico de la ESH (UAEH)
  const passAdmin = "HidroESH#2026!";
  const passGuest = "HydroUser_2026*";

  let autenticadoValido = false;
  if (perfilSeleccionadoTemp === 'admin' && pass === passAdmin) {
    userRole = 'admin';
    autenticadoValido = true;
  } else if (perfilSeleccionadoTemp === 'guest' && pass === passGuest) {
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
  const roleBadgeText = document.getElementById('roleBadgeText');

  if (overlay) {
    overlay.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    overlay.style.opacity = "0";
    overlay.style.transform = "scale(1.03)";
    
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 400);
  }

  const rolActivo = userRole || localStorage.getItem("hidro_role") || "guest";
  const roleText = rolActivo === 'admin' ? 'Admin' : 'Guest';
  
  if (roleBadgeText) roleBadgeText.innerText = roleText;

  if (rolActivo === 'guest') {
    document.body.classList.add('role-guest');
  } else {
    document.body.classList.remove('role-guest');
  }
}

function cerrarSesionSistema() {
  localStorage.removeItem("hidro_logged_in"); 
  localStorage.removeItem("hidro_role");
  location.reload();
}

function iniciarReloj() {
  setInterval(() => {
    const reloj = document.getElementById("headerClock");
    if (reloj) {
      const spanTime = reloj.querySelector("span");
      const horaActual = new Date().toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      if (spanTime) spanTime.innerText = horaActual;
    }
  }, 1000);
}