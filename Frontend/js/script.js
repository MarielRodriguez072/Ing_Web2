// script.js - Index page handlers
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    setupIndexCards();
  }
});

function setupIndexCards() {
  const cards = document.querySelectorAll('.card[data-page]');
  cards.forEach(card => {
    card.addEventListener('click', function() {
      if (isAuthenticated()) {
        const page = this.dataset.page;
        if (page === 'dashboard') window.location.href = 'dashboard.html';
        else if (page === 'tickets') window.location.href = 'tickets.html';
        else if (page === 'analisis') window.location.href = 'analysis.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  });

  document.getElementById('login-btn')?.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
  document.getElementById('register-btn')?.addEventListener('click', () => {
    window.location.href = 'register.html';
  });
}

console.log('🥭 Script global listo');
