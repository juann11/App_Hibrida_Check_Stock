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

  const totalStock = state.products.reduce((acc, p) => acc + Number(p.stock), 0);
  const lowStockCount = state.products.filter(p => p.stock <= 15).length;

  const elStock = document.getElementById('dash-total-stock');
  const elMovs = document.getElementById('dash-total-movs');
  const elAlerts = document.getElementById('alert-count');
  const elUser = document.getElementById('user-display-name');

  if (elStock) elStock.textContent = totalStock;
  if (elMovs) elMovs.textContent = state.movements.length;
  if (elAlerts) elAlerts.textContent = state.alerts.length;
  if (elUser && state.auth.user) elUser.textContent = `Usuario: ${state.auth.user}`;

  // Mini Dashboard de Métricas
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
    `;
  }

  // Alertas
  const alertsContainer = document.getElementById('alerts-list-container');
  if (alertsContainer) {
    alertsContainer.innerHTML = '';
    if (state.alerts.length === 0) {
      alertsContainer.innerHTML = '<p style="color:#71717A; font-size:0.85rem;">No hay alertas pendientes.</p>';
    } else {
      state.alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-box';
        alertDiv.innerHTML = `
          <div class="alert-header">
            <span><strong>${alert.title}</strong></span>
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
  }
}

export function renderInventory(currentFilter = 'all') {
  if (!state.auth.isAuthenticated) return;

  const container = document.getElementById('inventory-cards-container');
  const searchInput = document.getElementById('search-input');
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchVal) || p.sku.toLowerCase().includes(searchVal);
    if (currentFilter === 'disponible') return matchesSearch && p.stock > 0;
    if (currentFilter === 'agotado') return matchesSearch && p.stock === 0;
    if (currentFilter === 'critico') return matchesSearch && p.stock <= 15;
    return matchesSearch;
  });

  if (!container) return;
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:#71717A; font-size:0.85rem; padding:10px 0;">No se encontraron productos.</p>';
    return;
  }

  filtered.forEach(p => {
    const isAvailable = p.stock > 0;
    const isLow = p.stock <= 15;
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
    container.innerHTML = '<p style="color:#71717A; font-size:0.85rem;">No hay movimientos en este periodo.</p>';
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