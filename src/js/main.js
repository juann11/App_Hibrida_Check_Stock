import { initInventoryApp } from './inventory.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Control de navegación SPA (Pestañas)
  const navButtons = document.querySelectorAll('.nav-menu button');
  const views = document.querySelectorAll('.app-container .view');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');

      // Limpiar la clase 'active' de todas las vistas
      views.forEach(view => {
        view.classList.remove('active');
      });

      // Activar únicamente la vista seleccionada
      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.add('active');
      }
    });
  });

  // 2. Inicializar el sistema de inventario y datos offline
  initInventoryApp();
  
  console.log("Check Stock SPA inicializada con éxito.");
});