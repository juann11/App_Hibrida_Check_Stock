import { state, saveState } from './storage.js';

export function addProduct(name, sku, stock, location) {
  if (!name || !sku || isNaN(stock) || stock < 0) {
    return { success: false, message: "Datos del producto inválidos." };
  }

  const skuExists = state.products.some(p => p.sku.toLowerCase() === sku.toLowerCase());
  if (skuExists) {
    return { success: false, message: "El código SKU ya está registrado." };
  }

  const newProd = { id: 'p_' + Date.now(), name, sku, stock: Number(stock), location };
  state.products.push(newProd);
  saveState();
  return { success: true, product: newProd };
}

export function deleteProduct(id) {
  state.products = state.products.filter(p => p.id !== id);
  saveState();
}

export function recordMovement(prodId, type, qty, note) {
  const product = state.products.find(p => p.id === prodId);
  if (!product) return { success: false, message: "Producto no encontrado." };
  if (isNaN(qty) || qty <= 0) return { success: false, message: "Cantidad inválida." };

  if (type === 'SALIDA' && product.stock < qty) {
    return { success: false, message: `Stock insuficiente (Disponible: ${product.stock})` };
  }

  if (type === 'ENTRADA') product.stock += qty;
  if (type === 'SALIDA') product.stock -= qty;

  state.movements.push({
    id: 'm_' + Date.now(),
    productName: product.name,
    type,
    qty,
    date: new Date().toISOString(),
    note
  });

  saveState();
  return { success: true };
}