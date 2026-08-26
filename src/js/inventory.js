import { loadInventory, saveInventory } from './storage.js';

let inventory = loadInventory();

export function initInventoryApp() {
  renderDashboard();
  renderTable();
  setupFormListener();
}

// Actualiza las tarjetas de resumen en la vista de Inicio
function renderDashboard() {
  const totalProductsEl = document.getElementById('stat-total-products');
  const totalStockEl = document.getElementById('stat-total-stock');
  const lowStockEl = document.getElementById('stat-low-stock');

  if (!totalProductsEl) return;

  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((acc, item) => acc + Number(item.stock), 0);
  const lowStock = inventory.filter(item => Number(item.stock) <= 5).length;

  totalProductsEl.textContent = totalProducts;
  totalStockEl.textContent = totalStock;
  lowStockEl.textContent = lowStock;
}

// Pinta la tabla de productos en la vista de Inventario
function renderTable() {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (inventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No hay productos registrados en el inventario.</td></tr>`;
    return;
  }

  inventory.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td><span class="badge">${item.category}</span></td>
      <td>${item.stock} unidades</td>
      <td>$${Number(item.price).toLocaleString()}</td>
      <td class="actions">
        <button class="btn-stock" data-action="minus" data-id="${item.id}">-</button>
        <button class="btn-stock" data-action="plus" data-id="${item.id}">+</button>
        <button class="btn-delete" data-id="${item.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachTableEventListeners();
}

// Configura los clics en los botones de la tabla (+, -, eliminar)
function attachTableEventListeners() {
  document.querySelectorAll('.btn-stock').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.target.getAttribute('data-id'));
      const action = e.target.getAttribute('data-action');
      
      inventory = inventory.map(item => {
        if (item.id === id) {
          if (action === 'plus') item.stock += 1;
          if (action === 'minus' && item.stock > 0) item.stock -= 1;
        }
        return item;
      });

      saveInventory(inventory);
      renderTable();
      renderDashboard();
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.target.getAttribute('data-id'));
      inventory = inventory.filter(item => item.id !== id);
      
      saveInventory(inventory);
      renderTable();
      renderDashboard();
    });
  });
}

// Maneja el formulario para agregar nuevos productos de forma dinámica
function setupFormListener() {
  const form = document.getElementById('product-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value.trim();
    const stock = Number(document.getElementById('prod-stock').value);
    const price = Number(document.getElementById('prod-price').value);

    if (!name || !category) return;

    const newProduct = {
      id: Date.now(), // ID único basado en timestamp
      name,
      category,
      stock,
      price
    };

    inventory.push(newProduct);
    saveInventory(inventory);
    
    renderTable();
    renderDashboard();
    form.reset();
  });
}