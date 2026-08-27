import { state, saveState } from './storage.js';
import { getFilteredMovements } from './reports.js';
import { deleteProduct } from './inventory.js';

export function showToast(message) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

// Generador auxiliar de Empty States Ilustrados
function getEmptyStateHTML(icon, title, description) {
  return `
    <div class="empty-state-card" style="text-align: center; padding: 25px 15px; color: #71717A;">
      <div style="font-size: 2.2rem; margin-bottom: 8px;">${icon}</div>
      <h5 style="font-size: 0.95rem; font-weight: 600; margin: 0 0 4px 0; color: #E4E4E7;">${title}</h5>
      <p style="font-size: 0.8rem; margin: 0;">${description}</p>
    </div>
  `;
}

export function switchView(targetId) {
  const loginOverlay = document.getElementById('vista-login');

  if (!state.auth.isAuthenticated) {
    document.body.classList.add('not-authenticated');
    if (loginOverlay) loginOverlay.classList.remove('hidden');
    return;
  }

  document.body.classList.remove('not-authenticated');
  if (loginOverlay) loginOverlay.classList.add('hidden');

  document.querySelectorAll('.app-container .view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.bottom-navbar .nav-icon-btn').forEach(b => b.classList.remove('active'));

  const targetView = document.getElementById(targetId);
  if (targetView) targetView.classList.add('active');

  const activeNavBtn = document.querySelector(`.bottom-navbar [data-target="${targetId}"]`);
  if (activeNavBtn) activeNavBtn.classList.add('active');
}

export function renderDashboard() {
  if (!state.auth.isAuthenticated) return;

  // 1. Un solo recorrido para calcular todas las métricas de productos
  const { totalStock, outOfStockCount, lowStockCount, optimalStockCount } = state.products.reduce(
    (acc, p) => {
      const stock = Number(p.stock) || 0;
      acc.totalStock += stock;

      if (stock === 0) acc.outOfStockCount++;
      else if (stock <= 15) acc.lowStockCount++;
      else acc.optimalStockCount++;

      return acc;
    },
    { totalStock: 0, outOfStockCount: 0, lowStockCount: 0, optimalStockCount: 0 }
  );

  // 2. Actualización rápida de elementos de cabecera
  const elements = {
    'dash-total-stock': totalStock,
    'dash-total-movs': state.movements.length,
    'alert-count': state.alerts.length,
    'user-display-name': state.auth.user ? `Usuario: ${state.auth.user}` : null
  };

  Object.entries(elements).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val !== null) el.textContent = val;
  });

  // 3. Mini Dashboard de Métricas
  const miniDashContainer = document.getElementById('mini-dashboard-stats');
  if (miniDashContainer) {
    miniDashContainer.innerHTML = `
      <div class="mini-stat-card">
        <span>🏷️ SKU Únicos</span>
        <strong>${state.products.length}</strong>
      </div>
      <div class="mini-stat-card ${lowStockCount > 0 ? 'warning' : ''}">
        <span>⚠️ Stock Crítico (≤15)</span>
        <strong>${lowStockCount}</strong>
      </div>
      <div class="mini-stat-card ${outOfStockCount > 0 ? 'danger' : ''}">
        <span>🚫 Agotados</span>
        <strong>${outOfStockCount}</strong>
      </div>
      <div class="mini-stat-card success">
        <span>✅ En Regla</span>
        <strong>${optimalStockCount}</strong>
      </div>
    `;
  }

  // 4. Renderizado optimizado de Alertas
  const alertsContainer = document.getElementById('alerts-list-container');
  if (!alertsContainer) return;

  alertsContainer.innerHTML = '';

  if (state.alerts.length === 0) {
    alertsContainer.innerHTML = getEmptyStateHTML('🔔', 'Sin alertas pendientes', 'Todo está al día en tu inventario.');
    return;
  }

  const fragment = document.createDocumentFragment();

  state.alerts.forEach(alert => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-box';
    alertDiv.innerHTML = `
      <div class="alert-header">
        <span><strong>${alert.title}</strong></span>
        <button type="button" class="close-x" data-id="${alert.id}" aria-label="Cerrar">✕</button>
      </div>
      <p>${alert.text}</p>
      <div class="alert-actions">
        <button type="button" class="btn-dismiss" data-id="${alert.id}">Aceptar</button>
        <button type="button" class="btn-view" data-target="vista-inventario">Ver Inventario</button>
      </div>
    `;
    fragment.appendChild(alertDiv);
  });

  alertsContainer.appendChild(fragment);

  // 5. Delegación de Eventos (Un solo Listener para todo el contenedor)
  alertsContainer.onclick = (e) => {
    const dismissBtn = e.target.closest('.close-x, .btn-dismiss');
    if (dismissBtn) {
      const alertId = dismissBtn.getAttribute('data-id');
      state.alerts = state.alerts.filter(a => a.id !== alertId);
      saveState();
      renderDashboard();
      showToast("Alerta descartada.");
      return;
    }

    const viewBtn = e.target.closest('.btn-view');
    if (viewBtn) {
      const target = viewBtn.getAttribute('data-target');
      switchView(target);
    }
  };
}

export function renderInventory(currentFilter = 'all') {
  if (!state.auth.isAuthenticated) return;

  const container = document.getElementById('inventory-cards-container');
  const searchInput = document.getElementById('search-input');
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal);
    const st = Number(p.stock);
    if (currentFilter === 'disponible') return matchesSearch && st > 15;
    if (currentFilter === 'critico') return matchesSearch && st > 0 && st <= 15;
    if (currentFilter === 'agotado') return matchesSearch && st === 0;
    return matchesSearch;
  });

  if (!container) return;
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = getEmptyStateHTML('🔍', 'No se encontraron productos', 'Intenta con otro término o ajusta el filtro actual.');
    return;
  }

  filtered.forEach(p => {
    const st = Number(p.stock);
    const isAvailable = st > 0;
    const isLow = st <= 15;
    const card = document.createElement('div');
    card.className = `product-card-item ${isLow ? 'card-low-stock' : ''}`;
    card.innerHTML = `
      <div class="card-top">
        <span>${p.name}</span>
        <small>SKU: ${p.sku}</small>
      </div>
      <p class="card-desc">Ubicación: ${p.location}</p>
      <div class="card-bottom">
        <span class="stock-badge ${isLow ? 'out' : isAvailable ? 'available' : 'out'}">
          ${isAvailable ? `Disponible: ${st} UND` : 'AGOTADO'}
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
        deleteProduct(id);
        refreshAllViews();
        showToast("Producto eliminado.");
      }
    });
  });
}

export function renderMovementsHistory(filterType = 'todos') {
  if (!state.auth.isAuthenticated) return;

  const container = document.getElementById('movements-history-container');
  if (!container) return;
  container.innerHTML = '';

  const filteredMovs = getFilteredMovements(filterType);

  if (filteredMovs.length === 0) {
    container.innerHTML = getEmptyStateHTML('📊', 'Sin movimientos en este período', 'No se registraron entradas o salidas dentro de esta fecha.');
    return;
  }

  filteredMovs.slice().reverse().forEach(m => {
    const div = document.createElement('div');
    div.className = 'history-item';
    const displayDate = isNaN(new Date(m.date).getTime()) ? m.date : new Date(m.date).toLocaleDateString('es-ES');
    div.innerHTML = `
      <div class="header">
        <span><strong>${m.type}</strong>: ${m.productName} (${m.type === 'ENTRADA' ? '+' : '-'}${m.qty})</span>
        <small>${displayDate}</small>
      </div>
      <small>Nota: ${m.note || 'Sin nota'}</small>
    `;
    container.appendChild(div);
  });
}

export function setupMovementForm() {
  if (!state.auth.isAuthenticated) return;
  const select = document.getElementById('mov-producto-select');
  if (!select) return;

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

export function refreshAllViews() {
  renderDashboard();
  renderInventory();
  setupMovementForm();
  renderMovementsHistory();
}