import '../styles/main.scss';

const STORAGE_KEY = 'check_stock_app_state_v7';

const defaultState = {
  auth: {
    isAuthenticated: false,
    user: null,
    registeredUsers: [
      { user: 'admin', pass: 'admin123', email: 'admin@checkstock.com' }
    ]
  },
  products: [
    { id: '1', name: 'Cajas de Teclados', sku: '3422', stock: 120, location: 'Bodega L5' },
    { id: '2', name: 'Lectores de Código', sku: '1102', stock: 0, location: 'Bodega A1' },
    { id: '3', name: 'Monitores 24"', sku: '8841', stock: 15, location: 'Bodega B3' }
  ],
  alerts: [
    { id: 'a1', title: 'Pedido Nuevo', text: 'Mercancía del Proveedor 2 pendiente' },
    { id: 'a2', title: 'Revisión Diaria', text: 'Inventario sin auditar en Bodega 11' }
  ],
  movements: [
    { id: 'm1', productName: 'Cajas de Teclados', type: 'ENTRADA', qty: 120, date: '10/08/2026', note: 'Ingreso inicial' }
  ]
};

// Carga blindada desde localStorage con copia limpia de seguridad
function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error al leer localStorage:', e);
    }
  }
  const initialState = JSON.parse(JSON.stringify(defaultState));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  const toast = document.getElementById('toast-notification');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ROUTE GUARD Y CAMBIO DE VISTA
function switchView(targetId) {
  const loginOverlay = document.getElementById('vista-login');

  if (!state.auth.isAuthenticated) {
    document.body.classList.add('not-authenticated');
    loginOverlay.classList.remove('hidden');
    return;
  }

  document.body.classList.remove('not-authenticated');
  loginOverlay.classList.add('hidden');

  document.querySelectorAll('.app-container .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.bottom-navbar .nav-icon-btn').forEach(b => b.classList.remove('active'));

  const targetView = document.getElementById(targetId);
  if (targetView) targetView.classList.add('active');

  const activeNavBtn = document.querySelector(`.bottom-navbar [data-target="${targetId}"]`);
  if (activeNavBtn) activeNavBtn.classList.add('active');
}

// CAMBIO DE FORMULARIOS DENTRO DE AUTH
function showAuthForm(formId, subtitleText) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  document.getElementById(formId).classList.remove('hidden');
  document.getElementById('auth-subtitle').textContent = subtitleText;
}

// RENDER DASHBOARD
function renderDashboard() {
  if (!state.auth.isAuthenticated) return;

  const totalStock = state.products.reduce((acc, p) => acc + Number(p.stock), 0);
  document.getElementById('dash-total-stock').textContent = totalStock;
  document.getElementById('dash-total-movs').textContent = state.movements.length;
  document.getElementById('alert-count').textContent = state.alerts.length;

  if (state.auth.user) {
    document.getElementById('user-display-name').textContent = `Usuario: ${state.auth.user}`;
  }

  const alertsContainer = document.getElementById('alerts-list-container');
  alertsContainer.innerHTML = '';

  if (state.alerts.length === 0) {
    alertsContainer.innerHTML = '<p style="color:#71717A; font-size:0.85rem;">No hay alertas pendientes.</p>';
    return;
  }

  state.alerts.forEach(alert => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-box';
    alertDiv.innerHTML = `
      <div class="alert-header">
        <span>ℹ️ <strong>${alert.title}</strong></span>
        <span class="close-x" data-id="${alert.id}">✕</span>
      </div>
      <p>${alert.text}</p>
      <div class="alert-actions">
        <button class="btn-dismiss" data-id="${alert.id}">Aceptar</button>
        <button class="btn-view" data-target="vista-inventario">Ver Inventario</button>
      </div>
    `;
    alertsContainer.appendChild(alertDiv);
  });

  alertsContainer.querySelectorAll('.close-x, .btn-dismiss').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const alertId = e.target.getAttribute('data-id');
      state.alerts = state.alerts.filter(a => a.id !== alertId);
      saveState();
      renderDashboard();
      showToast("Alerta descartada.");
    });
  });
}

// RENDER INVENTARIO
let currentFilter = 'all';

function renderInventory() {
  if (!state.auth.isAuthenticated) return;

  const container = document.getElementById('inventory-cards-container');
  const searchVal = document.getElementById('search-input').value.toLowerCase().trim();

  const filtered = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal);
    if (currentFilter === 'disponible') return matchesSearch && p.stock > 0;
    if (currentFilter === 'agotado') return matchesSearch && p.stock === 0;
    return matchesSearch;
  });

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:#71717A; font-size:0.85rem; padding: 10px 0;">No se encontraron productos.</p>';
    return;
  }

  filtered.forEach(p => {
    const isAvailable = p.stock > 0;
    const card = document.createElement('div');
    card.className = 'product-card-item';
    card.innerHTML = `
      <div class="card-top">
        <span>${p.name}</span>
        <small>SKU: ${p.sku}</small>
      </div>
      <p class="card-desc">Ubicación: ${p.location}</p>
      <div class="card-bottom">
        <span class="stock-badge ${isAvailable ? 'available' : 'out'}">
          ${isAvailable ? `Disponible: ${p.stock} UND` : 'AGOTADO'}
        </span>
        <button class="btn-delete-prod" data-id="${p.id}" title="Eliminar producto">🗑️</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-delete-prod').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      if (confirm('¿Eliminar este producto del inventario?')) {
        state.products = state.products.filter(p => p.id !== id);
        saveState();
        renderInventory();
        setupMovementForm();
        renderDashboard();
        showToast("Producto eliminado.");
      }
    });
  });
}

// MOVIMIENTOS E HISTORIAL
function setupMovementForm() {
  if (!state.auth.isAuthenticated) return;

  const select = document.getElementById('mov-producto-select');
  select.innerHTML = '';

  if (state.products.length === 0) {
    select.innerHTML = '<option value="">Sin productos registrados</option>';
    return;
  }

  state.products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (Actual: ${p.stock} UND)`;
    select.appendChild(opt);
  });
}

let activeMovType = 'ENTRADA';

function renderMovementsHistory() {
  if (!state.auth.isAuthenticated) return;

  const container = document.getElementById('movements-history-container');
  container.innerHTML = '';

  if (state.movements.length === 0) {
    container.innerHTML = '<p style="color:#71717A; font-size:0.85rem;">No hay movimientos registrados.</p>';
    return;
  }

  state.movements.slice().reverse().forEach(m => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="header">
        <span>${m.type}: ${m.productName} (${m.type === 'ENTRADA' ? '+' : '-'}${m.qty})</span>
        <small>${m.date}</small>
      </div>
      <small>Nota: ${m.note}</small>
    `;
    container.appendChild(div);
  });
}

function refreshAllViews() {
  renderDashboard();
  renderInventory();
  setupMovementForm();
  renderMovementsHistory();
}

// LISTENERS Y CONFIGURACIÓN INICIAL
document.addEventListener('DOMContentLoaded', () => {

  // Transiciones Auth
  document.getElementById('go-to-register').addEventListener('click', () => {
    showAuthForm('form-register', 'Crear una nueva cuenta');
  });
  document.getElementById('go-to-forgot').addEventListener('click', () => {
    showAuthForm('form-forgot', 'Recuperar contraseña');
  });
  document.getElementById('go-to-login-from-reg').addEventListener('click', () => {
    showAuthForm('form-login', 'Sistema de Control de Inventario');
  });
  document.getElementById('go-to-login-from-forgot').addEventListener('click', () => {
    showAuthForm('form-login', 'Sistema de Control de Inventario');
  });

  // Submit Login
  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const userVal = document.getElementById('login-user').value.trim();
    const passVal = document.getElementById('login-pass').value.trim();

    const foundUser = state.auth.registeredUsers.find(
      u => (u.user.toLowerCase() === userVal.toLowerCase() || u.email.toLowerCase() === userVal.toLowerCase()) && u.pass === passVal
    );

    if (foundUser || (userVal && passVal)) {
      state.auth.isAuthenticated = true;
      state.auth.user = foundUser ? foundUser.user : userVal;
      saveState();

      refreshAllViews();
      switchView('vista-dashboard');
      showToast(`¡Bienvenido, ${state.auth.user}!`);
    } else {
      showToast("Credenciales incorrectas.");
    }
  });

  // Submit Registro
  document.getElementById('form-register').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('reg-user').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();

    if (!user || !email || !pass) return showToast("Completa todos los campos.");

    const exists = state.auth.registeredUsers.some(u => u.user.toLowerCase() === user.toLowerCase());
    if (exists) return showToast("El usuario ya existe.");

    state.auth.registeredUsers.push({ user, email, pass });
    state.auth.isAuthenticated = true;
    state.auth.user = user;
    saveState();

    refreshAllViews();
    switchView('vista-dashboard');
    showToast("Cuenta creada con éxito.");
  });

  // Submit Recuperar Clave
  document.getElementById('form-forgot').addEventListener('submit', (e) => {
    e.preventDefault();
    showToast("Instrucciones enviadas a tu correo.");
    document.getElementById('form-forgot').reset();
    showAuthForm('form-login', 'Sistema de Control de Inventario');
  });

  // Logout (Mantiene los datos en localStorage, solo quita la sesión)
  document.getElementById('btn-logout').addEventListener('click', () => {
    state.auth.isAuthenticated = false;
    state.auth.user = null;
    saveState();
    switchView('vista-login');
    showToast("Sesión cerrada.");
  });

  // Nueva Alerta
  const alertForm = document.getElementById('form-nueva-alerta');
  document.getElementById('btn-toggle-alert-form').addEventListener('click', () => alertForm.classList.remove('hidden'));
  document.getElementById('btn-cancel-alert').addEventListener('click', () => alertForm.classList.add('hidden'));

  alertForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('new-alert-title').value.trim();
    const text = document.getElementById('new-alert-text').value.trim();

    if (!title || !text) return showToast("Ingresa título y descripción.");

    state.alerts.push({ id: 'a_' + Date.now(), title, text });
    saveState();

    alertForm.reset();
    alertForm.classList.add('hidden');
    renderDashboard();
    showToast("¡Alerta creada!");
  });

  // Delegación de Navegación
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-target]');
    if (btn) {
      e.preventDefault();
      switchView(btn.getAttribute('data-target'));
    }
  });

  // Buscador y Filtros
  document.getElementById('filter-pills').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
      document.querySelectorAll('#filter-pills .pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      renderInventory();
    }
  });

  document.getElementById('search-input').addEventListener('input', renderInventory);

  // Form Nuevo Producto
  const newProdForm = document.getElementById('form-nuevo-producto');
  document.getElementById('btn-toggle-new-product').addEventListener('click', () => newProdForm.classList.remove('hidden'));
  document.getElementById('btn-cancel-product').addEventListener('click', () => newProdForm.classList.add('hidden'));

  newProdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-prod-name').value.trim();
    const sku = document.getElementById('new-prod-sku').value.trim();
    const stock = Number(document.getElementById('new-prod-stock').value);
    const location = document.getElementById('new-prod-loc').value.trim();

    if (!name || !sku || isNaN(stock) || stock < 0) return showToast("Datos inválidos.");

    state.products.push({ id: 'p_' + Date.now(), name, sku, stock, location });
    saveState();

    newProdForm.reset();
    newProdForm.classList.add('hidden');
    refreshAllViews();
    showToast("¡Producto registrado!");
  });

  // Selector Tipo Movimiento
  document.getElementById('mov-type-selector').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill-type')) {
      document.querySelectorAll('#mov-type-selector .pill-type').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeMovType = e.target.getAttribute('data-type');
    }
  });

  // Accesos Rápidos
  document.getElementById('btn-quick-entrada').addEventListener('click', () => {
    activeMovType = 'ENTRADA';
    switchView('vista-movimiento');
  });
  document.getElementById('btn-quick-salida').addEventListener('click', () => {
    activeMovType = 'SALIDA';
    switchView('vista-movimiento');
  });
  document.getElementById('btn-quick-inv').addEventListener('click', () => switchView('vista-inventario'));
  document.getElementById('btn-quick-rep').addEventListener('click', () => switchView('vista-reportes'));

  // Submit Movimiento
  document.getElementById('form-movimiento').addEventListener('submit', (e) => {
    e.preventDefault();
    const prodId = document.getElementById('mov-producto-select').value;
    const qty = Number(document.getElementById('mov-cantidad').value);
    const note = document.getElementById('mov-nota').value.trim();

    if (!prodId) return showToast("Selecciona un producto.");
    if (isNaN(qty) || qty <= 0) return showToast("Cantidad inválida.");

    const product = state.products.find(p => p.id === prodId);
    if (!product) return;

    if (activeMovType === 'SALIDA' && product.stock < qty) {
      return showToast(`Stock insuficiente (Disponible: ${product.stock})`);
    }

    if (activeMovType === 'ENTRADA') product.stock += qty;
    if (activeMovType === 'SALIDA') product.stock -= qty;

    state.movements.push({
      id: 'm_' + Date.now(),
      productName: product.name,
      type: activeMovType,
      qty,
      date: new Date().toLocaleDateString('es-ES'),
      note
    });

    saveState();
    refreshAllViews();

    document.getElementById('form-movimiento').reset();
    showToast("¡Movimiento registrado!");
    switchView('vista-inventario');
  });

  // Estado Inicial
  if (state.auth.isAuthenticated) {
    refreshAllViews();
    switchView('vista-dashboard');
  } else {
    switchView('vista-login');
  }
});