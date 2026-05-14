// shared.js - Utilidades compartidas para el frontend
const SESSION_TIMEOUT = 30 * 60 * 1000;
let sharedSessionTimer = null;

function parseLocalStorageJSON(key, defaultValue) {
  const value = localStorage.getItem(key);
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(`Error parseando ${key}:`, error);
    localStorage.removeItem(key);
    return defaultValue;
  }
}

function getCurrentUser() {
  return parseLocalStorageJSON('mangometro_user', null);
}

function getAllUsers() {
  return parseLocalStorageJSON('mangometro_users', []);
}

function getUserByEmail(email) {
  return getAllUsers().find((user) => user.email === email);
}

function saveUser(user) {
  const users = getAllUsers();
  const existingIndex = users.findIndex((item) => item.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem('mangometro_users', JSON.stringify(users));
}

function getUserExpenses(userId) {
  return parseLocalStorageJSON(`mangometro_expenses_${userId}`, []);
}

function saveUserExpenses(userId, expenses) {
  localStorage.setItem(`mangometro_expenses_${userId}`, JSON.stringify(expenses));
}

function logout() {
  localStorage.removeItem('mangometro_user');
  localStorage.removeItem('mangometro_token');
}

function clearAuthStorage() {
  localStorage.removeItem('mangometro_user');
  localStorage.removeItem('mangometro_users');
  localStorage.removeItem('mangometro_token');
  localStorage.removeItem('mangometro_remember_username');
}

function isAuthenticated() {
  return getCurrentUser() !== null;
}

function requireAuth(redirect = 'login.html') {
  if (!isAuthenticated()) {
    window.location.href = redirect;
    return false;
  }
  return true;
}

var LOGIN_ATTEMPTS = window.LOGIN_ATTEMPTS || {};
var MAX_ATTEMPTS = window.MAX_ATTEMPTS || 5;
var LOCKOUT_TIME = window.LOCKOUT_TIME || 15 * 60 * 1000;
window.LOGIN_ATTEMPTS = LOGIN_ATTEMPTS;
window.MAX_ATTEMPTS = MAX_ATTEMPTS;
window.LOCKOUT_TIME = LOCKOUT_TIME;

function checkLoginAttempts() {
  const key = 'localhost';
  if (LOGIN_ATTEMPTS[key]?.locked && Date.now() - LOGIN_ATTEMPTS[key].lockedAt < LOCKOUT_TIME) {
    return false;
  }
  if (LOGIN_ATTEMPTS[key]?.locked) {
    delete LOGIN_ATTEMPTS[key];
  }
  return true;
}

function recordFailedAttempt() {
  const key = 'localhost';
  LOGIN_ATTEMPTS[key] = LOGIN_ATTEMPTS[key] || {};
  LOGIN_ATTEMPTS[key].attempts = (LOGIN_ATTEMPTS[key].attempts || 0) + 1;
  if (LOGIN_ATTEMPTS[key].attempts >= MAX_ATTEMPTS) {
    LOGIN_ATTEMPTS[key].locked = true;
    LOGIN_ATTEMPTS[key].lockedAt = Date.now();
  }
}

function recordSuccessfulLogin() {
  delete LOGIN_ATTEMPTS['localhost'];
}

function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Mayúscula requerida');
  if (!/[0-9]/.test(password)) errors.push('Número requerido');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Símbolo requerido (!@#$%^&*)');
  return { isValid: errors.length === 0, errors };
}

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
  if (!container) return;
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
