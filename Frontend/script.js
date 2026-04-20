// script.js - Utilidades compartidas + Index handlers (Paso 8)

// Auth guard genérico
function requireAuth(redirect = 'login.html') {
  if (!getCurrentUser()) {
    window.location.href = redirect;
    return false;
  }
  return true;
}

// Nav para cards index
document.addEventListener('DOMContentLoaded', function() {
  // Si es index.html
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    setupIndexCards();
  }
});

// Handlers cards en index
function setupIndexCards() {
  const cards = document.querySelectorAll('.card[data-page]');
  cards.forEach(card => {
    card.addEventListener('click', function() {
      if (requireAuth()) {
        const page = this.dataset.page;
        window.location.href = `${page}.html`;
      }
    });
  });

  // Botones login/register
  document.getElementById('login-btn')?.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
  document.getElementById('register-btn')?.addEventListener('click', () => {
    window.location.href = 'register.html';
  });

  // Demo btn
  document.getElementById('demo-btn')?.addEventListener('click', () => {
    alert('Demo interactiva: Regístrate/Login → Agrega gastos → Ve análisis!');
  });
}

// Global getCurrentUser (from auth.js fallback)
function getCurrentUser() {
  const userStr = localStorage.getItem('mangometro_user');
  return userStr ? JSON.parse(userStr) : null;
}

console.log('🥭 Script global listo');

