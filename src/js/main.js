import '../styles/main.scss';

import { state, checkLowStockAlerts, exportBackup, importBackup } from './modules/storage.js';
import { loginUser, registerUser, logoutUser } from './modules/auth.js';
import { addProduct, recordMovement } from './modules/inventory.js';
import { exportMovementsCSV } from './modules/reports.js';
import {
  showToast,
  switchView,
  renderDashboard,
  renderInventory,
  renderMovementsHistory,
  refreshAllViews
} from './modules/ui.js';

let currentInventoryFilter = 'all';
let currentReportFilter = 'todos';
let activeMovType = 'ENTRADA';

document.addEventListener('DOMContentLoaded', () => {

  checkLowStockAlerts();

  const showAuthForm = (formId, subtitleText) => {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
    document.getElementById(formId).classList.remove('hidden');
    document.getElementById('auth-subtitle').textContent = subtitleText;
  };

  document.getElementById('go-to-register')?.addEventListener('click', () => showAuthForm('form-register', 'Crear una nueva cuenta'));
  document.getElementById('go-to-forgot')?.addEventListener('click', () => showAuthForm('form-forgot', 'Recuperar contraseña'));
  document.getElementById('go-to-login-from-reg')?.addEventListener('click', () => showAuthForm('form-login', 'Sistema de Control de Inventario'));
  document.getElementById('go-to-login-from-forgot')?.addEventListener('click', () => showAuthForm('form-login', 'Sistema de Control de Inventario'));

  // Formulario Login
  document.getElementById('form-login')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const userVal = document.getElementById('login-user').value.trim();
    const passVal = document.getElementById('login-pass').value.trim();

    const res = loginUser(userVal, passVal);
    if (res.success) {
      refreshAllViews();
      switchView('vista-dashboard');
      showToast(`¡Bienvenido, ${res.user}!`);
    } else {
      showToast(res.message);
    }
  });

  // Formulario Registro
  document.getElementById('form-register')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('reg-user').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();

    const res = registerUser(user, email, pass);
    if (res.success) {
      refreshAllViews();
      switchView('vista-dashboard');
      showToast("Cuenta creada con éxito.");
    } else {
      showToast(res.message);
    }
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    logoutUser();
    switchView('vista-login');
    showToast("Sesión cerrada.");
  });

  // Navegación
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-target]');
    if (btn) {
      e.preventDefault();
      switchView(btn.getAttribute('data-target'));
    }
  });

  // Respaldo de Datos (Backup / Restore)
  document.getElementById('btn-export-backup')?.addEventListener('click', () => {
    exportBackup();
    showToast("Respaldo descargado.");
  });

  document.getElementById('input-import-backup')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importBackup(file, (success, msg) => {
      showToast(msg);
      if (success) refreshAllViews();
    });
  });

  // Filtros de Inventario
  document.getElementById('filter-pills')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
      document.querySelectorAll('#filter-pills .pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      currentInventoryFilter = e.target.getAttribute('data-filter');
      renderInventory(currentInventoryFilter);
    }
  });

  document.getElementById('search-input')?.addEventListener('input', () => {
    renderInventory(currentInventoryFilter);
  });

  // Formulario Nuevo Producto
  const newProdForm = document.getElementById('form-nuevo-producto');
  document.getElementById('btn-toggle-new-product')?.addEventListener('click', () => newProdForm?.classList.remove('hidden'));
  document.getElementById('btn-cancel-product')?.addEventListener('click', () => newProdForm?.classList.add('hidden'));

  newProdForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-prod-name').value.trim();
    const sku = document.getElementById('new-prod-sku').value.trim();
    const stock = document.getElementById('new-prod-stock').value;
    const location = document.getElementById('new-prod-loc').value.trim();

    const res = addProduct(name, sku, stock, location);
    if (res.success) {
      newProdForm.reset();
      newProdForm.classList.add('hidden');
      refreshAllViews();
      showToast("¡Producto registrado con éxito!");
    } else {
      showToast(res.message);
    }
  });

  // Selector Tipo Movimiento
  document.getElementById('mov-type-selector')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill-type')) {
      document.querySelectorAll('#mov-type-selector .pill-type').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeMovType = e.target.getAttribute('data-type');
    }
  });

  // Formulario Movimientos
  document.getElementById('form-movimiento')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const prodId = document.getElementById('mov-producto-select').value;
    const qty = Number(document.getElementById('mov-cantidad').value);
    const note = document.getElementById('mov-nota').value.trim();

    const res = recordMovement(prodId, activeMovType, qty, note);
    if (res.success) {
      document.getElementById('form-movimiento').reset();
      refreshAllViews();
      showToast("¡Movimiento registrado!");
      switchView('vista-inventario');
    } else {
      showToast(res.message);
    }
  });

  // Filtro por Fecha de Reportes y Exportación CSV
  document.getElementById('report-date-filters')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill-report')) {
      document.querySelectorAll('#report-date-filters .pill-report').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentReportFilter = e.target.getAttribute('data-period');
      renderMovementsHistory(currentReportFilter);
    }
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    const ok = exportMovementsCSV(currentReportFilter);
    if (ok) {
      showToast("Reporte CSV descargado.");
    } else {
      showToast("No hay movimientos para exportar.");
    }
  });

  // Estado Inicial
  if (state.auth.isAuthenticated) {
    refreshAllViews();
    switchView('vista-dashboard');
  } else {
    switchView('vista-login');
  }
});