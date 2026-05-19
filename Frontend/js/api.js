const API_URL = 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('mangometro_token');
}

function setToken(token) {
  localStorage.setItem('mangometro_token', token);
}

function clearToken() {
  localStorage.removeItem('mangometro_token');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('mangometro_user');
  return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
  localStorage.setItem('mangometro_user', JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem('mangometro_user');
}

async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    if (err.message && err.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000');
    }
    throw new Error('Error de conexión. Verifica que el backend esté corriendo.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Error ${res.status}`);
  }

  return res.json();
}

async function register(username, email, password, role) {
  const data = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role }),
  });
  setToken(data.token);
  setCurrentUser(data.user);
  return data;
}

async function login(identifier, password) {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  setToken(data.token);
  setCurrentUser(data.user);
  return data;
}

async function getProfile() {
  return apiCall('/auth/profile');
}

async function getExpenses() {
  return apiCall('/expenses');
}

async function createExpense(expense) {
  return apiCall('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

async function deleteExpense(id) {
  return apiCall(`/expenses/${id}`, { method: 'DELETE' });
}

function logout() {
  clearToken();
  clearCurrentUser();
}

function isAuthenticated() {
  return getToken() !== null && getCurrentUser() !== null;
}

function requireAuth(redirect = 'login.html') {
  if (!isAuthenticated()) {
    window.location.href = redirect;
    return false;
  }
  return true;
}
