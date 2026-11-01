// =========================================================
// MÓDULO INDEPENDIENTE: MENÚ LATERAL MÓVIL (HAMBURGUESA)
// =========================================================

function inicializarMenuMobileIndividual() {
  const sidebar = document.querySelector('.ags-sidebar');
  const btnToggle = document.getElementById('btnToggleSidebar');

  if (btnToggle && sidebar) {
    const toggleSidebarHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
      console.log("📱 Menú lateral alternado:", sidebar.classList.contains('mobile-open'));
    };

    btnToggle.onclick = toggleSidebarHandler;
    btnToggle.ontouchstart = toggleSidebarHandler;
  }

  // Cerrar al hacer clic en las opciones del menú en móvil
  document.querySelectorAll('.ags-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 992 && sidebar) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });

  // Cerrar al hacer clic fuera del sidebar
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('mobile-open')) {
      if (!sidebar.contains(e.target) && btnToggle && !btnToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", inicializarMenuMobileIndividual);
} else {
  inicializarMenuMobileIndividual();
}