// Funciones compartidas de autenticación y seguridad

function getCurrentUser() {
    const userStr = localStorage.getItem('mangometro_user');
    return userStr ? JSON.parse(userStr) : null;
}

function getAllUsers() {
    const usersStr = localStorage.getItem('mangometro_users') || '[]';
    return JSON.parse(usersStr);
}

function getUserByEmail(email) {
    return getAllUsers().find(u => u.email === email);
}

function saveUser(user) {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    localStorage.setItem('mangometro_users', JSON.stringify(users));
}

function logout() {
    localStorage.removeItem('mangometro_user');
    localStorage.removeItem('mangometro_token');
}

function isAuthenticated() {
    return getCurrentUser() !== null;
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// Rate limiting
const LOGIN_ATTEMPTS = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

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
