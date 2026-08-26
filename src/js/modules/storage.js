const STORAGE_KEY = 'check_stock_app_state_v7';

export const defaultState = {
  auth: {
    isAuthenticated: false,
    user: null,
    registeredUsers: [
      { user: 'admin', pass: 'admin123', email: 'admin@checkstock.com' }
    ]
  },
  products: [
    { id: '1', name: 'Cajas de Teclados', sku: '3422', stock: 120, location: 'Bodega L5' },
    { id: '2', name: 'Lectores de Código', sku: '1102', stock: 10, location: 'Bodega A1' },
    { id: '3', name: 'Monitores 24"', sku: '8841', stock: 15, location: 'Bodega B3' }
  ],
  alerts: [],
  movements: [
    { id: 'm1', productName: 'Cajas de Teclados', type: 'ENTRADA', qty: 120, date: new Date().toISOString(), note: 'Ingreso inicial' }
  ]
};

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando localStorage:', e);
    }
  }
  const initialState = JSON.parse(JSON.stringify(defaultState));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
  return initialState;
}

export let state = loadState();

// Verificación automática de stock crítico (<= 15 unidades)
export function checkLowStockAlerts() {
  const CRITICAL_STOCK = 15;
  state.products.forEach(prod => {
    if (Number(prod.stock) <= CRITICAL_STOCK) {
      const alertId = `low_stock_${prod.id}`;
      const exists = state.alerts.some(a => a.id === alertId);
      if (!exists) {
        state.alerts.push({
          id: alertId,
          title: `⚠️ Stock Bajo: ${prod.name}`,
          text: `El producto tiene ${prod.stock} unidades (mínimo recomendado: ${CRITICAL_STOCK}).`
        });
      }
    }
  });
}

export function saveState() {
  checkLowStockAlerts();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Exportar datos a JSON
export function exportBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `check_stock_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Importar datos desde JSON
export function importBackup(file, callback) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (importedData.products && importedData.auth) {
        state = importedData;
        saveState();
        callback(true, "Datos importados con éxito.");
      } else {
        callback(false, "El archivo JSON no tiene el formato correcto.");
      }
    } catch (err) {
      callback(false, "Error al procesar el archivo JSON.");
    }
  };
  reader.readAsText(file);
}