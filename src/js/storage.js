const STORAGE_KEY = 'check_stock_data_v1';

export const loadInventory = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Datos iniciales por defecto para que la app no nazca vacía
    const initialData = [
      { id: 1, name: 'Laptop HP ProBook', category: 'Tecnología', stock: 12, price: 2500000 },
      { id: 2, name: 'Lector de Código de Barras', category: 'Hardware', stock: 5, price: 180000 },
      { id: 3, name: 'Papel Bond Carta (Resma)', category: 'Papelería', stock: 45, price: 22000 }
    ];
    saveInventory(initialData);
    return initialData;
  }
  return JSON.parse(data);
};

export const saveInventory = (inventory) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
};