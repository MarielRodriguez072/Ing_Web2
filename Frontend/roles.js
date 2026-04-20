// roles.js - Sistema de roles Mangómetro
// Cliente vs Asesor UI/Logic

function getUserRole() {
  //const user = getCurrentUser();
  return user?.role || 'cliente'; // default cliente
}

function updateSidebarByRole() {
  const role = getUserRole();
  const sidebarUl = document.querySelector('#sidebar ul');
  if (!sidebarUl) return;

  // Remover link tickets para asesor
  if (role === 'asesor') {
    const ticketsLi = sidebarUl.querySelector('a[data-page="tickets"]')?.parentElement;
    if (ticketsLi) ticketsLi.remove();
    
    // Agregar link Clientes
    let clientesLi = sidebarUl.querySelector('a[data-page="clientes"]')?.parentElement;
    if (!clientesLi) {
      clientesLi = document.createElement('li');
      clientesLi.innerHTML = '<a href="#" class="sidebar-link" data-page="clientes">👥 Clientes</a>';
      sidebarUl.insertBefore(clientesLi, sidebarUl.lastElementChild);
      
      // Modal simulado
      clientesLi.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Vista Clientes (simulada): Lista de clientes del asesor\\nPróximamente con roles multiusuario.');
      });
    }
  } else {
    // Restaurar tickets para cliente
    const clientesLi = sidebarUl.querySelector('a[data-page="clientes"]')?.parentElement;
    if (clientesLi) clientesLi.remove();
  }
}


function isAsesor() {
  return getUserRole() === 'asesor';
}

function toggleElementsByRole(asesorElements, clienteElements) {
  if (isAsesor()) {
    showElements(asesorElements);
    hideElements(clienteElements);
  } else {
    showElements(clienteElements);
    hideElements(asesorElements);
  }
}

function showElements(selectors) {
  selectors.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) el.style.display = '';
  });
}

function hideElements(selectors) {
  selectors.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) el.style.display = 'none';
  });
}

function setupRoleUI() {
  const role = getUserRole();
  const roleIndicator = document.getElementById('role-indicator');
  if (roleIndicator) {
    roleIndicator.textContent = role.toUpperCase();
    roleIndicator.className = `role-badge ${role}`;
  }
}

// Exportar para uso global
window.getUserRole = getUserRole;
window.isAsesor = isAsesor;
window.toggleElementsByRole = toggleElementsByRole;
window.setupRoleUI = setupRoleUI;

