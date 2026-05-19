let sessionTimer = null;

document.addEventListener('DOMContentLoaded', async function() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  if (user.role !== 'asesor') {
    window.location.href = 'dashboard.html';
    return;
  }

  const userNameEl = document.getElementById('user-name');
  if (userNameEl) userNameEl.textContent = user.username || user.email;

  const roleEl = document.getElementById('role-indicator');
  if (roleEl) {
    roleEl.textContent = user.role.toUpperCase();
    roleEl.style.display = 'inline-block';
    roleEl.className = 'role-badge ' + user.role;
  }

  setupRoleUI();
  updateSidebarByRole();

  resetSessionTimer();
  document.addEventListener('click', resetSessionTimer);
  document.addEventListener('keypress', resetSessionTimer);

  await loadClients();
});

async function loadClients() {
  try {
    const clients = await getUsers();
    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;

    if (!Array.isArray(clients) || clients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="centered">No hay clientes registrados</td></tr>';
      return;
    }

    tbody.innerHTML = clients.map(function(client) {
      const fecha = client.createdAt
        ? new Date(client.createdAt).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '---';

      return '<tr>' +
        '<td><strong>' + escapeHtml(client.username) + '</strong></td>' +
        '<td>' + escapeHtml(client.email) + '</td>' +
        '<td>' + fecha + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn-action btn-dashboard" data-userid="' + client.id + '" data-username="' + escapeHtml(client.username) + '">📊 Dashboard</button>' +
          '<button class="btn-action btn-analysis" data-userid="' + client.id + '" data-username="' + escapeHtml(client.username) + '">📈 Análisis</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    tbody.querySelectorAll('.btn-dashboard').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const userId = this.dataset.userid;
        const userName = this.dataset.username;
        localStorage.setItem('asesor_selected_client_id', userId);
        localStorage.setItem('asesor_selected_client_name', userName);
        window.location.href = 'dashboard.html';
      });
    });

    tbody.querySelectorAll('.btn-analysis').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const userId = this.dataset.userid;
        const userName = this.dataset.username;
        localStorage.setItem('asesor_selected_client_id', userId);
        localStorage.setItem('asesor_selected_client_name', userName);
        window.location.href = 'analysis.html';
      });
    });
  } catch (error) {
    console.error('Error cargando clientes:', error);
    showAlert('Error cargando clientes: ' + error.message, 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function resetSessionTimer() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(function() {
    logout();
    window.location.href = 'login.html';
  }, SESSION_TIMEOUT);
}
