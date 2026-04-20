// analysis.js - Módulo Análisis Gastos Mangómetro
// Funciones localStorage + cálculos + render HTML

// Dependencias globales ya cargadas desde expenses.js (no redeclarar)
// CATEGORIES, getExpenses, getCurrentUser, requireAuth, showAlert disponibles globalmente

// Inicialización página
document.addEventListener('DOMContentLoaded', function() {
  setupRoleUI();
  updateSidebarByRole();
  requireAuth();
  populateMonthFilter();
  initAnalysis();
  resetSessionTimer();
});

// Poblar filtro meses con datos reales
function populateMonthFilter() {
  const select = document.getElementById('month-filter');
  if (!select) return;

  const user = getCurrentUser();
  const expenses = getExpenses(user.id) || [];
  const byMes = getGastoPorMes(expenses);
  const months = Object.keys(byMes).sort().reverse();

  const allMonths = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  select.innerHTML = '<option value="">Todos los meses</option>';
  allMonths.forEach((monthName, index) => {
    const monthKey = `2024-${String(index + 1).padStart(2, '0')}`;
    const option = document.createElement('option');
    option.value = monthKey;
    option.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    select.appendChild(option);
  });

}




// 1. TOTAL GASTADO
function getTotalGastado(expenses) {
  return expenses.reduce((total, exp) => total + parseFloat(exp.monto || exp.amount || 0), 0).toFixed(2);
}

// 2. GASTO POR CATEGORÍA
function getGastoPorCategoria(expenses) {
  const byCat = {};
  expenses.forEach(exp => {
    const cat = exp.categoria || exp.category || 'otro';
    byCat[cat] = (byCat[cat] || 0) + parseFloat(exp.monto || exp.amount || 0);
  });
  return byCat;
}

// 3. GASTO POR MES (YYYY-MM)
function getGastoPorMes(expenses) {
  const byMes = {};
  expenses.forEach(exp => {
    const date = new Date(exp.fecha || exp.date);
    const mesKey = date.toISOString().slice(0, 7); // YYYY-MM
    byMes[mesKey] = (byMes[mesKey] || 0) + parseFloat(exp.monto || exp.amount || 0);
  });
  return Object.entries(byMes)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((obj, [key, val]) => ({...obj, [key]: val.toFixed(2)}), {});
}

// 4. CATEGORÍA MAYOR GASTO
function getCategoriaMayorGasto(byCategoria) {
  return Object.entries(byCategoria)
    .reduce((max, [cat, monto]) => monto > max.monto ? {cat, monto} : max, {cat: 'ninguna', monto: 0});
}

// 5. ÚLTIMOS GASTOS (10 más recientes)
function getUltimosGastos(expenses, limit = 10) {
  return expenses
    .sort((a, b) => new Date(b.fecha || b.date) - new Date(a.fecha || a.date))
    .slice(0, limit);
}

// 6. PROMEDIO GASTO
function getPromedioGasto(expenses) {
  const total = getTotalGastado(expenses);
  const count = expenses.length;
  return count > 0 ? (total / count).toFixed(2) : '0.00';
}

// Inicializar análisis
async function initAnalysis() {
  try {
    const user = getCurrentUser();
    const role = getUserRole();
    
    // Vista especial asesor
    if (role === 'asesor') {
      const asesorCard = document.querySelector('#asesor-card');
      if (asesorCard) asesorCard.style.display = 'flex';
      
      const topCat = getCategoriaMayorGasto(getGastoPorCategoria(getExpenses(user.id) || []));
      document.getElementById('global-top-cat').textContent = topCat.cat || 'Sin datos';
      document.getElementById('global-avg').textContent = `$${getPromedioGasto(getExpenses(user.id) || [])}`;
      document.getElementById('asesor-cat-sugerida').textContent = topCat.cat || 'gastos';
      
      document.querySelector('.content-header p').textContent = 'Vista de asesor: Análisis profesional de patrones de consumo globales';
      return;
    }

    const expenses = getExpenses(user.id) || [];
    
    // Render métricas
    const totalEl = document.getElementById('total-gastado');
    if (totalEl) totalEl.textContent = `$${getTotalGastado(expenses)}`;
    const promedioEl = document.getElementById('promedio-gasto');
    if (promedioEl) promedioEl.textContent = `$${getPromedioGasto(expenses)}`;
    
    const byCat = getGastoPorCategoria(expenses);
    const topCat = getCategoriaMayorGasto(byCat);
    const topCatEl = document.getElementById('top-categoria');
    if (topCatEl) topCatEl.textContent = topCat.cat || 'Ninguna';
    const topMontoEl = document.getElementById('top-monto');
    if (topMontoEl) topMontoEl.textContent = `$${topCat.monto.toFixed(2)}`;
    
    const byMes = getGastoPorMes(expenses);
    renderMesesChart(byMes);
    
    renderCategoriasChart(byCat);
    
    const ultimos = getUltimosGastos(expenses);
    renderUltimosGastos(ultimos);
    
  } catch (error) {
    console.error('Error análisis:', error);
    showAlert('Error cargando análisis', 'error');
  }
}

// Render gráfico meses (canvas trends-chart)
function renderMesesChart(byMes) {
  const canvas = document.getElementById('trends-chart');
  if (!canvas || Object.keys(byMes).length === 0) return;

  const ctx = canvas.getContext('2d');
  canvas.width = 600;
  canvas.height = 300;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const labels = Object.keys(byMes);
  const data = Object.values(byMes).map(v => parseFloat(v));
  const maxVal = Math.max(...data);
  
  labels.forEach((label, i) => {
    const barHeight = (data[i] / maxVal) * 200;
    const x = 60 + i * 50;
    
    // Barra
    ctx.fillStyle = '#FFC72C';
    ctx.fillRect(x, 250 - barHeight, 35, barHeight);
    
    // Label
    ctx.fillStyle = '#2D2D2D';
    ctx.font = 'bold 11px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i].slice(-2), x + 17, 275);
    
    // Valor
    ctx.font = '11px Roboto';
    ctx.fillText(`$${data[i]}`, x + 17, 240 - barHeight);
  });
}

// Render torta categorías (canvas pie-chart)
function renderCategoriasChart(byCat) {
  const canvas = document.getElementById('pie-chart');
  if (!canvas || Object.keys(byCat).length === 0) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = 300;
  canvas.height = 300;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const total = Object.values(byCat).reduce((sum, v) => sum + parseFloat(v), 0);
  let startAngle = 0;
  
  Object.entries(byCat).forEach(([cat, amount]) => {
    const sliceAngle = (parseFloat(amount) / total) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 120, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    
    // Colores por categoría
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#95A5A6'];
    ctx.fillStyle = colors[Object.keys(byCat).indexOf(cat) % colors.length];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    
    startAngle += sliceAngle;
  });
}

// Render últimos gastos (tabla)
function renderUltimosGastos(ultimos) {
  const tbody = document.querySelector('#recent-gastos tbody');
  if (!tbody) return;
  
  if (ultimos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-light)">No hay gastos</td></tr>';
    return;
  }
  
  tbody.innerHTML = ultimos.map(exp => `
    <tr>
      <td>${new Date(exp.fecha || exp.date).toLocaleDateString('es-ES')}</td>
      <td>${exp.comercio}</td>
      <td>${exp.categoria}</td>
      <td>$${parseFloat(exp.monto || exp.amount).toFixed(2)}</td>
      <td>
        <button onclick="deleteExpense('${exp.id}')" class="btn-sm danger">🗑️</button>
      </td>
    </tr>
  `).join('');
}

// Utils adicionales
function parseLocalStorageJSON(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function resetSessionTimer() {
  // Session logic from dashboard
  clearTimeout(window.sessionTimer);
  window.sessionTimer = setTimeout(() => {
    localStorage.removeItem('mangometro_user');
    localStorage.removeItem('mangometro_token');
    showAlert('Sesión expirada', 'error');
    setTimeout(() => location.href = 'login.html', 2000);
  }, 30 * 60 * 1000);
}

// Export global
window.initAnalysis = initAnalysis;
window.getTotalGastado = getTotalGastado;
window.getGastoPorCategoria = getGastoPorCategoria;
window.getGastoPorMes = getGastoPorMes;
window.getCategoriaMayorGasto = getCategoriaMayorGasto;
window.getUltimosGastos = getUltimosGastos;
window.getPromedioGasto = getPromedioGasto;

