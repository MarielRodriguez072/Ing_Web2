// shared.js - Utilidades compartidas para el frontend
const CATEGORIES = [
  { value: 'supermercado', label: 'Supermercado', icon: '🛒', color: '#FF6B6B' },
  { value: 'comida', label: 'Comida', icon: '🍔', color: '#4ECDC4' },
  { value: 'transporte', label: 'Transporte', icon: '🚗', color: '#45B7D1' },
  { value: 'entretenimiento', label: 'Entretenimiento', icon: '🎬', color: '#F7DC6F' },
  { value: 'servicios', label: 'Servicios', icon: '💡', color: '#BB8FCE' },
  { value: 'otro', label: 'Otro', icon: '📦', color: '#95A5A6' }
];

const SESSION_TIMEOUT = 30 * 60 * 1000;
let sharedSessionTimer = null;

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getCategoryLabel(value) {
  return CATEGORIES?.find((category) => category.value === value)?.label || value || 'Sin categoría';
}

function setActiveSidebarLink(activeHref) {
  const links = document.querySelectorAll('.sidebar a');
  links.forEach((link) => {
    if (link.getAttribute('href') === activeHref) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

function resetSessionTimer() {
  clearTimeout(sharedSessionTimer);
  sharedSessionTimer = setTimeout(() => {
    logout();
    alert('Tu sesión ha expirado por inactividad.');
    window.location.href = 'login.html';
  }, SESSION_TIMEOUT);
}

function showAlert(message, type = 'info') {
  const container = document.getElementById('alert-container');
  if (!container) {
    alert(`${type}: ${message}`);
    return;
  }
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  container.appendChild(alertEl);
  setTimeout(() => {
    alertEl.classList.add('fade-out');
    alertEl.addEventListener('transitionend', () => alertEl.remove(), { once: true });
  }, 3000);
}

function createElementFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

function getStats(expenses) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let total = 0, monthly = 0;
  const byCategory = {};

  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount) || 0;
    total += amount;
    const date = new Date(exp.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      monthly += amount;
    }
    byCategory[exp.category] = (byCategory[exp.category] || 0) + amount;
  });

  return { total: total.toFixed(2), monthly: monthly.toFixed(2), byCategory };
}
