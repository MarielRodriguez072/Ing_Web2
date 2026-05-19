let sessionTimer = null;
let selectedUserId = null;

document.addEventListener('DOMContentLoaded', async function() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const userNameEl = document.getElementById('user-name');
  if (userNameEl) userNameEl.textContent = user.username || user.email;

  const roleEl = document.getElementById('role-indicator');
  if (roleEl) {
    const role = user.role || 'cliente';
    roleEl.textContent = role.toUpperCase();
    roleEl.style.display = 'inline-block';
    roleEl.className = 'role-badge ' + role;
  }

  setupRoleUI();
  updateSidebarByRole();

  resetSessionTimer();
  document.addEventListener('click', resetSessionTimer);
  document.addEventListener('keypress', resetSessionTimer);

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

  if (user.role === 'asesor') {
    await setupAsesorUI(user);
  } else {
    await loadDashboardData();
  }
});

async function setupAsesorUI(user) {
  const subtitle = document.getElementById('dashboard-subtitle');
  if (subtitle) subtitle.textContent = 'Panel de Asesor - Visualización de clientes';

  const selector = document.getElementById('client-selector');
  const select = document.getElementById('client-select');
  if (!selector || !select) return;

  selector.style.display = 'flex';

  select.innerHTML = '<option value="">Seleccioná un cliente...</option>';

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
      await loadDashboardData(savedId);
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
      await loadDashboardData(selectedUserId);
    } else {
      localStorage.removeItem('asesor_selected_client_id');
      localStorage.removeItem('asesor_selected_client_name');
      clearDashboard();
    }
  });
}

function clearDashboard() {
  var totalEl = document.getElementById('total-gastado');
  if (totalEl) totalEl.textContent = '$0.00';
  var monthlyEl = document.getElementById('monthly-gastado');
  if (monthlyEl) monthlyEl.textContent = '$0.00';
  var avgEl = document.getElementById('avg-diario');
  if (avgEl) avgEl.textContent = '$0.00';
  var countEl = document.getElementById('total-count');
  if (countEl) countEl.textContent = '0';
  var tbody = document.getElementById('expenses-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="centered">Seleccioná un cliente para ver sus gastos</td></tr>';
}

async function loadDashboardData(userId) {
  try {
    let expenses = await getExpenses(userId || undefined);
    if (!Array.isArray(expenses)) expenses = [];

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

    var totalEl = document.getElementById('total-gastado');
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);

    var monthlyEl = document.getElementById('monthly-gastado');
    if (monthlyEl) monthlyEl.textContent = '$' + monthly.toFixed(2);

    var avgEl = document.getElementById('avg-diario');
    if (avgEl) avgEl.textContent = '$' + (monthly / daysInMonth).toFixed(2);

    var countEl = document.getElementById('total-count');
    if (countEl) countEl.textContent = expenses.length;

    var tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;

    if (expenses.length === 0) {
      var msg = getCurrentUser()?.role === 'asesor'
        ? '<tr><td colspan="4" class="centered">Este cliente no tiene gastos registrados</td></tr>'
        : '<tr><td colspan="4" class="centered">No hay gastos registrados. <a href="tickets.html">Cargá tu primer ticket →</a></td></tr>';
      tbody.innerHTML = msg;
      return;
    }

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
