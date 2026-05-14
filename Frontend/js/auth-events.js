// auth-events.js - Manejo unificado de logout para sidebar
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('sidebar-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
            window.location.href = 'index.html';
        });
    }
    
    // Soporte para múltiples páginas dashboard
    const allLogouts = document.querySelectorAll('.logout-link');
    allLogouts.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
            window.location.href = 'index.html';
        });
    });
});
