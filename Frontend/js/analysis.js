let selectedUserId = null;

document.addEventListener('DOMContentLoaded', async function() {
  setupRoleUI();
  updateSidebarByRole();
  requireAuth();

  const user = getCurrentUser();
  if (user) displayUserName(user);

  await initAnalysis();
  resetSessionTimer();
});

function displayUserName(user) {
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = user.username || user.email;
  }
  setupRoleUI();
}

async function populateMonthFilter() {
  const select = document.getElementById('month-filter');
  if (!select) return;

  try {
    let expenses = await getExpenses(selectedUserId || undefined);
    if (!Array.isArray(expenses)) expenses = [];

    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    const availableMonths = [];
    expenses.forEach(function(exp) {
      const d = new Date(exp.date);
      const key = d.toISOString().slice(0, 7);
      if (!availableMonths.find(function(m) { return m.key === key; })) {
        availableMonths.push({
          key: key,
          label: monthNames[d.getMonth()] + ' ' + d.getFullYear(),
        });
      }
    });

    availableMonths.sort().reverse();

    select.innerHTML = '<option value="">Todos los meses</option>';

    if (availableMonths.length === 0) {
      const currentYear = new Date().getFullYear();
      for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        for (let m = 0; m < 12; m++) {
          const key = y + '-' + String(m + 1).padStart(2, '0');
          const option = document.createElement('option');
          option.value = key;
          option.textContent = monthNames[m] + ' ' + y;
          select.appendChild(option);
        }
      }
      return;
    }

    availableMonths.forEach(function(month) {
      const option = document.createElement('option');
      option.value = month.key;
      option.textContent = month.label;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando filtro:', error);
  }
}

function getTotalGastado(expenses) {
  return expenses.reduce((total, exp) => total + parseFloat(exp.amount || 0), 0).toFixed(2);
}

function getGastoPorCategoria(expenses) {
  const byCat = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'otro';
    byCat[cat] = (byCat[cat] || 0) + parseFloat(exp.amount || 0);
  });
  return byCat;
}

function getGastoPorMes(expenses) {
  const byMes = {};
  expenses.forEach(exp => {
    const date = new Date(exp.date);
    const mesKey = date.toISOString().slice(0, 7);
    byMes[mesKey] = (byMes[mesKey] || 0) + parseFloat(exp.amount || 0);
  });
  return Object.entries(byMes)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((obj, [key, val]) => ({...obj, [key]: val.toFixed(2)}), {});
}

function getCategoriaMayorGasto(byCategoria) {
  return Object.entries(byCategoria)
    .reduce((max, [cat, monto]) => monto > max.monto ? {cat, monto} : max, {cat: 'ninguna', monto: 0});
}

function getUltimosGastos(expenses, limit = 10) {
  return expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

function getPromedioGasto(expenses) {
  const count = expenses.length;
  if (count === 0) return '0.00';
  const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  return (total / count).toFixed(2);
}

async function setupAsesorUI() {
  const subtitle = document.getElementById('analysis-subtitle');
  if (subtitle) subtitle.textContent = 'Análisis de cliente - Panel de Asesor';

  const selector = document.getElementById('client-selector');
  const select = document.getElementById('client-select');
  if (!selector || !select) return;

  selector.style.display = 'flex';

  try {
    const clients = await getUsers();
    if (!Array.isArray(clients)) return;

    clients.forEach(function(client) {
      const opt = document.createElement('option');
      opt.value = client.id;
      opt.textContent = client.username + ' (' + client.email + ')';
      select.appendChild(opt);
    });

    const savedId = localStorage.getItem('asesor_selected_client_id');
    if (savedId) {
      select.value = savedId;
      selectedUserId = savedId;
    }
  } catch (err) {
    console.error('Error cargando clientes:', err);
  }

  select.addEventListener('change', async function() {
    selectedUserId = this.value;
    const selectedOption = this.options[this.selectedIndex];
    const clientName = selectedOption ? selectedOption.textContent.split(' (')[0] : '';

    if (selectedUserId) {
      localStorage.setItem('asesor_selected_client_id', selectedUserId);
      localStorage.setItem('asesor_selected_client_name', clientName);
      await populateMonthFilter();
      await renderAnalysis(selectedUserId);
    } else {
      localStorage.removeItem('asesor_selected_client_id');
      localStorage.removeItem('asesor_selected_client_name');
      clearAnalysis();
    }
  });
}

function clearAnalysis() {
  document.getElementById('total-gastado').textContent = '$0.00';
  document.getElementById('promedio-gasto').textContent = '$0.00';
  document.getElementById('top-categoria').textContent = '--';
  document.getElementById('top-monto').textContent = '$0.00';
  document.getElementById('num-metric').textContent = '0';
  document.getElementById('top-category').textContent = '--';
  const tbody = document.querySelector('.expenses-table-section tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="centered">Seleccioná un cliente para ver su análisis</td></tr>';
  renderCategoriasChart({});
  renderMesesChart({});
}

async function initAnalysis() {
  try {
    const user = getCurrentUser();
    const role = getUserRole();

    if (role === 'asesor') {
      const asesorCard = document.querySelector('#asesor-card');
      if (asesorCard) asesorCard.style.display = 'flex';

      await setupAsesorUI();

      if (selectedUserId) {
        await populateMonthFilter();
        await renderAnalysis(selectedUserId);
      } else {
        await populateMonthFilter();
        clearAnalysis();
      }
      return;
    }

    await populateMonthFilter();
    await renderAnalysis();
  } catch (error) {
    console.error('Error inicializando análisis:', error);
    showAlert('Error cargando análisis: ' + error.message, 'error');
  }
}

async function renderAnalysis(userId) {
  try {
    let expenses = await getExpenses(userId || undefined);
    if (!Array.isArray(expenses)) expenses = [];

    const totalEl = document.getElementById('total-gastado');
    if (totalEl) totalEl.textContent = `$${getTotalGastado(expenses)}`;

    const promedioEl = document.getElementById('promedio-gasto');
    if (promedioEl) promedioEl.textContent = `$${getPromedioGasto(expenses)}`;

    const byCat = getGastoPorCategoria(expenses);
    const topCat = getCategoriaMayorGasto(byCat);

    const topCatEl = document.getElementById('top-categoria');
    if (topCatEl) topCatEl.textContent = getCategoryLabel(topCat.cat);

    const topMontoEl = document.getElementById('top-monto');
    if (topMontoEl) topMontoEl.textContent = `$${topCat.monto.toFixed(2)}`;

    const numEl = document.getElementById('num-metric');
    if (numEl) numEl.textContent = expenses.length;

    const topCategoryEl = document.getElementById('top-category');
    if (topCategoryEl) topCategoryEl.textContent = getCategoryLabel(topCat.cat);

    const byMes = getGastoPorMes(expenses);
    renderMesesChart(byMes);
    renderCategoriasChart(byCat);
    renderUltimosGastos(getUltimosGastos(expenses));

    const clientName = userId
      ? localStorage.getItem('asesor_selected_client_name') || 'Cliente'
      : null;

    if (userId && clientName) {
      document.getElementById('global-top-cat').textContent = topCat.cat || 'Sin datos';
      document.getElementById('global-avg').textContent = `$${getPromedioGasto(expenses)}`;
      document.getElementById('asesor-cat-sugerida').textContent = topCat.cat || 'gastos';
    }
  } catch (error) {
    console.error('Error renderizando análisis:', error);
    showAlert('Error cargando datos: ' + error.message, 'error');
  }
}

function renderMesesChart(byMes) {
  const canvas = document.getElementById('trends-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = 600;
  canvas.height = 350;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const entries = Object.entries(byMes);
  if (entries.length === 0) {
    ctx.fillStyle = '#999';
    ctx.font = '14px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos para mostrar', canvas.width / 2, canvas.height / 2);
    return;
  }

  const labels = entries.map(e => e[0]);
  const data = entries.map(e => parseFloat(e[1]));
  const maxVal = Math.max(...data);

  const padding = 60;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = 250;
  const barWidth = Math.min(40, (chartWidth / labels.length) - 10);

  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();

    const val = maxVal - (maxVal / 4) * i;
    ctx.fillStyle = '#666';
    ctx.font = '10px Roboto';
    ctx.textAlign = 'right';
    ctx.fillText(`$${val.toFixed(0)}`, padding - 5, y + 4);
  }

  labels.forEach((label, i) => {
    const barHeight = (data[i] / maxVal) * chartHeight;
    const x = padding + (chartWidth / labels.length) * i + (chartWidth / labels.length - barWidth) / 2;
    const y = padding + chartHeight - barHeight;

    ctx.fillStyle = '#FFC72C';
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#2D2D2D';
    ctx.font = 'bold 10px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText(`$${data[i].toFixed(0)}`, x + barWidth / 2, y - 5);

    ctx.fillStyle = '#666';
    ctx.font = '10px Roboto';
    ctx.fillText(label.slice(5), x + barWidth / 2, padding + chartHeight + 15);
  });

  ctx.fillStyle = '#2D2D2D';
  ctx.font = 'bold 12px Roboto';
  ctx.textAlign = 'center';
  ctx.fillText('Gastos por mes', canvas.width / 2, 15);
}

function renderCategoriasChart(byCat) {
  const canvas = document.getElementById('pie-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = 300;
  canvas.height = 350;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const entries = Object.entries(byCat);
  if (entries.length === 0) {
    ctx.fillStyle = '#999';
    ctx.font = '14px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos para mostrar', canvas.width / 2, canvas.height / 2);
    return;
  }

  const total = entries.reduce((sum, [, amount]) => sum + parseFloat(amount), 0);
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#95A5A6'];
  const centerX = 150;
  const centerY = 120;
  const radius = 90;

  let startAngle = 0;

  entries.forEach(([cat, amount], index) => {
    const sliceAngle = (parseFloat(amount) / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    startAngle += sliceAngle;
  });

  let legendY = 230;
  entries.forEach(([cat, amount], index) => {
    const percentage = ((parseFloat(amount) / total) * 100).toFixed(1);

    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(20, legendY, 12, 12);

    ctx.fillStyle = '#2D2D2D';
    ctx.font = 'bold 11px Roboto';
    ctx.textAlign = 'left';
    ctx.fillText(getCategoryLabel(cat), 38, legendY + 10);

    ctx.fillStyle = '#666';
    ctx.font = '10px Roboto';
    ctx.fillText(`$${parseFloat(amount).toFixed(2)} (${percentage}%)`, 38, legendY + 24);

    legendY += 32;
  });
}

function renderUltimosGastos(ultimos) {
  const tbody = document.querySelector('.expenses-table-section tbody');
  if (!tbody) return;

  if (ultimos.length === 0) {
    const user = getCurrentUser();
    const msg = user?.role === 'asesor'
      ? '<tr><td colspan="4" class="centered empty-row">Este cliente no tiene gastos registrados</td></tr>'
      : '<tr><td colspan="4" class="centered empty-row">No hay gastos</td></tr>';
    tbody.innerHTML = msg;
    return;
  }

  tbody.innerHTML = ultimos.map(exp => `
    <tr>
      <td>${new Date(exp.date).toLocaleDateString('es-ES')}</td>
      <td>${exp.commerce}</td>
      <td>${getCategoryLabel(exp.category)}</td>
      <td>$${parseFloat(exp.amount).toFixed(2)}</td>
    </tr>
  `).join('');
}

function resetSessionTimer() {
  clearTimeout(window.sessionTimer);
  window.sessionTimer = setTimeout(() => {
    logout();
    showAlert('Sesión expirada', 'error');
    setTimeout(() => location.href = 'login.html', 2000);
  }, 30 * 60 * 1000);
}

async function applyFilters() {
  const monthFilter = document.getElementById('month-filter')?.value;
  const categoryFilter = document.getElementById('category-filter')?.value;

  try {
    let expenses = await getExpenses(selectedUserId || undefined);
    if (!Array.isArray(expenses)) expenses = [];

    if (monthFilter) {
      expenses = expenses.filter(exp => {
        const expMonth = new Date(exp.date).toISOString().slice(0, 7);
        return expMonth === monthFilter;
      });
    }

    if (categoryFilter) {
      expenses = expenses.filter(exp => exp.category === categoryFilter);
    }

    document.getElementById('total-gastado').textContent = `$${getTotalGastado(expenses)}`;
    document.getElementById('promedio-gasto').textContent = `$${getPromedioGasto(expenses)}`;

    const byCat = getGastoPorCategoria(expenses);
    const topCat = getCategoriaMayorGasto(byCat);
    document.getElementById('top-categoria').textContent = getCategoryLabel(topCat.cat);
    document.getElementById('top-monto').textContent = `$${topCat.monto.toFixed(2)}`;
    document.getElementById('num-metric').textContent = expenses.length;

    const byMes = getGastoPorMes(expenses);
    renderMesesChart(byMes);
    renderCategoriasChart(byCat);
    renderUltimosGastos(getUltimosGastos(expenses));
  } catch (error) {
    console.error('Error aplicando filtros:', error);
  }
}

window.initAnalysis = initAnalysis;
window.applyFilters = applyFilters;
