// Funciones compartidas de autenticación y seguridad
// Este archivo maneja el usuario activo, el almacenamiento en localStorage y la autorización básica.

function parseLocalStorageJSON(key, defaultValue) {
    const value = localStorage.getItem(key);
    if (!value) return defaultValue;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error(`Error parseando ${key} de localStorage:`, error);
        localStorage.removeItem(key);
        return defaultValue;
    }
}

function getCurrentUser() {
    // Obtener el usuario actual almacenado en localStorage
    return parseLocalStorageJSON('mangometro_user', null);
}

function getAllUsers() {
    // Obtener todos los usuarios registrados en localStorage
    return parseLocalStorageJSON('mangometro_users', []);
}

function getUserByEmail(email) {
    // Buscar un usuario por su correo electrónico
    return getAllUsers().find(u => u.email === email);
}

function saveUser(user) {
    // Guardar o actualizar un usuario en el arreglo de usuarios local
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    localStorage.setItem('mangometro_users', JSON.stringify(users));
}

function logout() {
    // Cerrar sesión removiendo los datos del usuario y token
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
    // Retornar verdadero si hay un usuario iniciado
    return getCurrentUser() !== null;
}

function requireAuth() {
    // Redirigir al login si no hay sesión activa
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// ================= RATE LIMITING =================
// Limitar los intentos de login en caso de múltiples accesos fallidos.
const LOGIN_ATTEMPTS = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

function checkLoginAttempts() {
    const key = 'localhost';
    if (LOGIN_ATTEMPTS[key]?.locked && Date.now() - LOGIN_ATTEMPTS[key].lockedAt < LOCKOUT_TIME) {
        return false; // bloqueo todavía activo
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
    // Reiniciar el contador de intentos fallidos tras un login exitoso
    delete LOGIN_ATTEMPTS['localhost'];
}

function validatePasswordStrength(password) {
    // Validar fuerza de contraseña según requisitos básicos
    const errors = [];
    if (password.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Mayúscula requerida');
    if (!/[0-9]/.test(password)) errors.push('Número requerido');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Símbolo requerido (!@#$%^&*)');
    return { isValid: errors.length === 0, errors };
}
