import { state } from './storage.js';

export function getFilteredMovements(filterType) {
  const now = new Date();

  return state.movements.filter(m => {
    const movDate = new Date(m.date);
    if (isNaN(movDate.getTime())) return true;

    if (filterType === 'hoy') {
      return movDate.toDateString() === now.toDateString();
    } else if (filterType === 'semana') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return movDate >= oneWeekAgo;
    } else if (filterType === 'mes') {
      return movDate.getMonth() === now.getMonth() && movDate.getFullYear() === now.getFullYear();
    }
    return true; // 'todos'
  });
}

export function exportMovementsCSV(filterType = 'todos') {
  const movs = getFilteredMovements(filterType);
  if (movs.length === 0) return false;

  // Encabezado UTF-8 BOM para soporte correcto de caracteres en Excel
  let csvContent = "\uFEFF";
  csvContent += "ID;Tipo;Producto;Cantidad;Fecha;Notas\n";

  movs.forEach(m => {
    const formattedDate = isNaN(new Date(m.date).getTime()) ? m.date : new Date(m.date).toLocaleDateString('es-ES');
    csvContent += `"${m.id}";"${m.type}";"${m.productName}";"${m.qty}";"${formattedDate}";"${m.note || ''}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_movimientos_${filterType}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}