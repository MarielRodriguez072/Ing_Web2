// auth.js - Funciones de autenticación y seguridad
// Usa api.js para comunicación con el backend

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
  if (LOGIN_ATTEMPTS[key]?.locked) delete LOGIN_ATTEMPTS[key];
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
