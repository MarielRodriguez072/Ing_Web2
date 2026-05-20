// roles.js - Sistema de roles Mangómetro
function getUserRole() {
  const user = getCurrentUser();
  return user?.role || 'cliente';
}

function updateSidebarByRole() {
  const role = getUserRole();
  const sidebarUl = document.querySelector('#sidebar ul');
  if (!sidebarUl) return;

  if (role === 'asesor') {
    const ticketsLi = sidebarUl.querySelector('a[data-page="tickets"]')?.parentElement;
    if (ticketsLi) ticketsLi.remove();
    
    let clientesLi = sidebarUl.querySelector('a[data-page="clientes"]')?.parentElement;
    if (!clientesLi) {
      clientesLi = document.createElement('li');
      clientesLi.innerHTML = '<a href="clients.html" class="sidebar-link" data-page="clientes">👥 Clientes</a>';
      sidebarUl.insertBefore(clientesLi, sidebarUl.lastElementChild);
    }
  } else {
    const clientesLi = sidebarUl.querySelector('a[data-page="clientes"]')?.parentElement;
    if (clientesLi) clientesLi.remove();
  }
}

function isAsesor() {
  return getUserRole() === 'asesor';
}

function setupRoleUI() {
  const role = getUserRole();
  const roleIndicator = document.getElementById('role-indicator');
  if (roleIndicator) {
    roleIndicator.textContent = role.toUpperCase();
    roleIndicator.className = 'role-badge ' + role;
    roleIndicator.style.display = 'inline-block';
  }
}

window.getUserRole = getUserRole;
window.isAsesor = isAsesor;
window.setupRoleUI = setupRoleUI;
