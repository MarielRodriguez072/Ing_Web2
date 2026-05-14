// expenses.js - CRUD Gastos para Mangómetro
// Almacena por usuario: `mangometro_expenses_${userId}`

const CATEGORIES = [
  { value: 'supermercado', label: 'Supermercado', icon: '🛒', color: '#FF6B6B' },
  { value: 'comida', label: 'Comida', icon: '🍔', color: '#4ECDC4' },
  { value: 'transporte', label: 'Transporte', icon: '🚗', color: '#45B7D1' },
  { value: 'entretenimiento', label: 'Entretenimiento', icon: '🎬', color: '#F7DC6F' },
  { value: 'servicios', label: 'Servicios', icon: '💡', color: '#BB8FCE' },
  { value: 'otro', label: 'Otro', icon: '📦', color: '#95A5A6' }
];

function getExpenses(userId) {
  const key = `mangometro_expenses_${userId}`;
  const expensesStr = localStorage.getItem(key);
  return expensesStr ? JSON.parse(expensesStr) : [];
}

function saveExpenses(userId, expenses) {
  const key = `mangometro_expenses_${userId}`;
  localStorage.setItem(key, JSON.stringify(expenses));
}

function addExpense(userId, expense) {
  // Validación
  if (!expense.commerce || !expense.amount || parseFloat(expense.amount) <= 0) {
    throw new Error('Comercio y monto válido requeridos');
  }
  if (!expense.date || isNaN(new Date(expense.date).getTime())) {
    throw new Error('Fecha válida requerida');
  }
  if (!CATEGORIES.find(cat => cat.value === expense.category)) {
    expense.category = 'otro'; // Default
  }

  const expenses = getExpenses(userId);
  expense.id = Date.now().toString();
  expense.createdAt = new Date().toISOString();
  expenses.push(expense);
  saveExpenses(userId, expenses);
  return expense;
}

function deleteExpense(userId, expenseId) {
  const expenses = getExpenses(userId);
  const initialLength = expenses.length;
  const filtered = expenses.filter(exp => exp.id !== expenseId);
  if (filtered.length === initialLength) {
    throw new Error('Gasto no encontrado');
  }
  saveExpenses(userId, filtered);
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

// Export para uso en otros JS
if (typeof module !== 'undefined') {
  module.exports = { CATEGORIES, getExpenses, addExpense, deleteExpense, getStats };
}

