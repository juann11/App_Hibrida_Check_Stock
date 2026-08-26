import '../styles/main.scss';

const STORAGE_KEY = 'check_stock_app_state_v4';

const defaultState = {
  auth: {
    isAuthenticated: false,
    user: null
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

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  const toast = document.getElementById('toast-notification');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

// Control de vistas y barra inferior
function switchView(targetId) {
  const bottomNav = document.getElementById('bottom-nav');

  if (targetId === 'vista-login') {
    bottomNav.classList.add('hidden');
  } else {
    bottomNav.classList.remove('hidden');
  }

  document.querySelectorAll('.app-container .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.bottom-navbar .nav-icon-btn').forEach(b => b.classList.remove('active'));

  const targetView = document.getElementById(targetId);
  if (targetView) targetView.classList.add('active');

  const activeNavBtn = document.querySelector(`.bottom-navbar [data-target="${targetId}"]`);
  if (activeNavBtn) activeNavBtn.classList.add('active');
}

// Dashboard
function renderDashboard() {
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

// Inventario
let currentFilter = 'all';

function renderInventory() {
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

// Formulario de Movimiento e Historial
function setupMovementForm() {
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

// Eventos e Inicialización
document.addEventListener('DOMContentLoaded', () => {

  // Login Submit
  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (user && pass) {
      state.auth.isAuthenticated = true;
      state.auth.user = user;
      saveState();

      renderDashboard();
      switchView('vista-dashboard');
      showToast(`¡Bienvenido, ${user}!`);
    } else {
      showToast("Ingresa credenciales válidas.");
    }
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    state.auth.isAuthenticated = false;
    state.auth.user = null;
    saveState();
    switchView('vista-login');
    showToast("Sesión cerrada.");
  });

  // Delegación de Navegación SPA y Botones de Retorno (←)
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-target]');
    if (btn && state.auth.isAuthenticated) {
      e.preventDefault();
      switchView(btn.getAttribute('data-target'));
    }
  });

  // Filtros
  document.getElementById('filter-pills').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
      document.querySelectorAll('#filter-pills .pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.getAttribute('data-filter');
      renderInventory();
    }
  });

  // Buscador
  document.getElementById('search-input').addEventListener('input', renderInventory);

  // Formulario Nuevo Producto
  const newProdForm = document.getElementById('form-nuevo-producto');
  document.getElementById('btn-toggle-new-product').addEventListener('click', () => {
    newProdForm.classList.remove('hidden');
  });
  document.getElementById('btn-cancel-product').addEventListener('click', () => {
    newProdForm.classList.add('hidden');
  });

  newProdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-prod-name').value.trim();
    const sku = document.getElementById('new-prod-sku').value.trim();
    const stock = Number(document.getElementById('new-prod-stock').value);
    const location = document.getElementById('new-prod-loc').value.trim();

    if (!name || !sku || isNaN(stock) || stock < 0) {
      showToast("Por favor ingresa datos válidos.");
      return;
    }

    state.products.push({ id: 'p_' + Date.now(), name, sku, stock, location });
    saveState();

    newProdForm.reset();
    newProdForm.classList.add('hidden');
    renderInventory();
    setupMovementForm();
    renderDashboard();
    showToast("¡Producto registrado con éxito!");
  });

  // Selector Tipo de Movimiento
  document.getElementById('mov-type-selector').addEventListener('click', (e) => {
    if (e.target.classList.contains('pill-type')) {
      document.querySelectorAll('#mov-type-selector .pill-type').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeMovType = e.target.getAttribute('data-type');
    }
  });

  // accesos Rápidos
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
    if (isNaN(qty) || qty <= 0) return showToast("Ingresa una cantidad mayor a 0.");

    const product = state.products.find(p => p.id === prodId);
    if (!product) return;

    if (activeMovType === 'SALIDA' && product.stock < qty) {
      showToast(`Stock insuficiente (Disponible: ${product.stock})`);
      return;
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
    setupMovementForm();
    renderDashboard();
    renderInventory();
    renderMovementsHistory();

    document.getElementById('form-movimiento').reset();
    showToast("¡Movimiento registrado!");
    switchView('vista-inventario');
  });

  // Verificación Inicial de Autenticación
  renderDashboard();
  renderInventory();
  setupMovementForm();
  renderMovementsHistory();

  if (state.auth.isAuthenticated) {
    switchView('vista-dashboard');
  } else {
    switchView('vista-login');
  }
});