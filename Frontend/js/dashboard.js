// Dashboard - Mangómetro
let sessionTimer = null;

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🥭 Dashboard cargado');

  const user = getCurrentUser();
  if (!user) {
    console.log('No hay usuario, redirigiendo a login');
    window.location.href = 'login.html';
    return;
  }

  console.log('Usuario:', user.username, '| Rol:', user.role);

  // Mostrar nombre y rol
  const userNameEl = document.getElementById('user-name');
  if (userNameEl) userNameEl.textContent = user.username || user.email;

  const roleEl = document.getElementById('role-indicator');
  if (roleEl) {
    const role = user.role || 'cliente';
    roleEl.textContent = role.toUpperCase();
    roleEl.style.display = 'inline-block';
    roleEl.className = 'role-badge ' + role;
  }

  // Sidebar role
  setupRoleUI();
  updateSidebarByRole();

  // Session timeout
  resetSessionTimer();
  document.addEventListener('click', resetSessionTimer);
  document.addEventListener('keypress', resetSessionTimer);

  // Cargar datos
  await loadDashboardData(user);

  // Botón agregar gasto
  const addBtn = document.getElementById('add-expense-btn');
  if (addBtn) {
    if (user.role === 'asesor') {
      addBtn.style.display = 'none';
    } else {
      addBtn.addEventListener('click', function() {
        window.location.href = 'tickets.html';
      });
    }
  }
});

async function loadDashboardData(user) {
  try {
    let expenses = await getExpenses();
    if (!Array.isArray(expenses)) expenses = [];

    console.log('Gastos cargados:', expenses.length);

    // Calcular stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let total = 0;
    let monthly = 0;

    expenses.forEach(function(exp) {
      const amount = parseFloat(exp.amount) || 0;
      total += amount;
      const expDate = new Date(exp.date);
      if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
        monthly += amount;
      }
    });

    const dailyAvg = monthly / daysInMonth;

    // Mostrar stats
    var totalEl = document.getElementById('total-gastado');
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);

    var monthlyEl = document.getElementById('monthly-gastado');
    if (monthlyEl) monthlyEl.textContent = '$' + monthly.toFixed(2);

    var avgEl = document.getElementById('avg-diario');
    if (avgEl) avgEl.textContent = '$' + dailyAvg.toFixed(2);

    var countEl = document.getElementById('total-count');
    if (countEl) countEl.textContent = expenses.length;

    // Mostrar tabla
    var tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;

    if (expenses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="centered">No hay gastos registrados. <a href="tickets.html">Cargá tu primer ticket →</a></td></tr>';
      return;
    }

    // Ordenar por fecha descendente y tomar los últimos 10
    var sorted = expenses.slice().sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    var recent = sorted.slice(0, 10);

    tbody.innerHTML = recent.map(function(exp) {
      var dateStr = new Date(exp.date).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      var catLabel = getCategoryLabel(exp.category);
      var desc = exp.description || exp.commerce || 'Sin descripción';
      return '<tr>' +
        '<td>' + dateStr + '</td>' +
        '<td>' + desc + '</td>' +
        '<td>' + catLabel + '</td>' +
        '<td>$' + parseFloat(exp.amount).toFixed(2) + '</td>' +
        '</tr>';
    }).join('');

  } catch (error) {
    console.error('Error:', error);
    showAlert('Error cargando datos: ' + error.message, 'error');
  }
}

function resetSessionTimer() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(function() {
    logout();
    window.location.href = 'login.html';
  }, SESSION_TIMEOUT);
}
