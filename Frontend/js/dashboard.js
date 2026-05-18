// Dashboard - Mangómetro
const SESSION_TIMEOUT = 30 * 60 * 1000;
let sessionTimer = null;

function resetSessionTimer() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    logout();
    alert('Tu sesión ha expirido por inactividad');
    window.location.href = 'login.html';
  }, SESSION_TIMEOUT);
}

document.addEventListener('DOMContentLoaded', async function() {
  setupRoleUI();
  updateSidebarByRole();

  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  resetSessionTimer();
  document.addEventListener('click', resetSessionTimer);
  document.addEventListener('keypress', resetSessionTimer);

  displayUserName(user);

  try {
    const expenses = await getExpenses();
    const stats = getStats(expenses);
    displayStats(stats);
    displayRecentExpenses(expenses);
  } catch (error) {
    console.error('Error cargando gastos:', error);
    showAlert('Error cargando datos', 'error');
  }

  setupEventListeners();
});

function displayUserName(user) {
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = user.username || user.email;
  }
  const roleIndicator = document.getElementById('role-indicator');
  if (roleIndicator) {
    roleIndicator.textContent = user.role ? user.role.toUpperCase() : 'CLIENTE';
    roleIndicator.style.display = 'inline-block';
    roleIndicator.style.marginLeft = '8px';
    roleIndicator.style.padding = '2px 8px';
    roleIndicator.style.borderRadius = '4px';
    roleIndicator.style.fontSize = '0.75rem';
    roleIndicator.style.fontWeight = '600';
    roleIndicator.style.backgroundColor = user.role === 'asesor' ? '#4ECDC4' : '#FFC72C';
    roleIndicator.style.color = user.role === 'asesor' ? '#fff' : '#2D2D2D';
  }
}

function displayStats(stats) {
  const totalElement = document.getElementById('total-gastado');
  if (totalElement) totalElement.textContent = `$${stats.total}`;

  const avgElement = document.getElementById('avg-diario');
  if (avgElement) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAvg = (parseFloat(stats.monthly) / daysInMonth).toFixed(2);
    avgElement.textContent = `$${dailyAvg}`;
  }
}

function displayRecentExpenses(expenses) {
  const tbody = document.querySelector('tbody');
  if (!tbody) return;

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentExpenses = sortedExpenses.slice(0, 5);

  if (recentExpenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="centered empty-row">No hay gastos recientes</td></tr>';
    return;
  }

  tbody.innerHTML = recentExpenses.map(expense => `
    <tr>
      <td>${formatDate(expense.date)}</td>
      <td>${expense.description || expense.commerce || 'Sin descripción'}</td>
      <td>${getCategoryLabel(expense.category)}</td>
      <td>$${parseFloat(expense.amount).toFixed(2)}</td>
    </tr>
  `).join('');
}

function setupEventListeners() {
  if (isAsesor()) {
    const addBtn = document.getElementById('add-expense-btn');
    if (addBtn) addBtn.style.display = 'none';
    return;
  }
  
  const addBtn = document.getElementById('add-expense-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => window.location.href = 'tickets.html');
  }
}
