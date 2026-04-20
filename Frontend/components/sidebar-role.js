// sidebar-role.js - Dinamizar sidebar por rol
document.addEventListener('DOMContentLoaded', function() {
  if (typeof getUserRole !== 'undefined') {
    const role = getUserRole();
    const sidebarUl = document.querySelector('#sidebar ul');
    
    if (role === 'asesor') {
      // Ocultar tickets para asesor
      const ticketsLi = document.querySelector('#tickets-link') || document.querySelector('a[data-page="tickets"]').parentElement;
      if (ticketsLi) ticketsLi.style.display = 'none';
      
      // Mostrar clientes
      const clientesLi = document.querySelector('#clientes-link');
      if (clientesLi) clientesLi.style.display = '';
    }
  }
});

