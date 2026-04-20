// Dashboard - Mangómetro
// Funcionalidades: mostrar usuario, calcular y mostrar estadísticas de gastos

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
let sessionTimer = null;

function resetSessionTimer() {
    clearTimeout(sessionTimer);
    sessionTimer = setTimeout(() => {
        localStorage.removeItem('mangometro_user');
        localStorage.removeItem('mangometro_token');
        alert('Tu sesión ha expirido por inactividad');
        window.location.href = 'login.html';
    }, SESSION_TIMEOUT);
}

document.addEventListener('DOMContentLoaded', function() {
    // ========== OBTENER USUARIO DESDE LOCALSTORAGE ==========
    const user = getCurrentUser();
    if (!user) {
        alert('No hay sesión activa. Redirigiendo al login...');
        window.location.href = 'login.html';
        return;
    }

    // Iniciar session timeout
    resetSessionTimer();
    document.addEventListener('click', resetSessionTimer);
    document.addEventListener('keypress', resetSessionTimer);

    // Mostrar nombre del usuario
    displayUserName(user);

    // ========== OBTENER GASTOS ==========
    const expenses = getUserExpenses(user.id);

    // ========== CALCULAR ESTADÍSTICAS ==========
    const stats = getStats(expenses);

    // ========== MOSTRAR EN PANTALLA ==========
    displayStats(stats);
    displayRecentExpenses(expenses);
    setActiveSidebarLink();

    // ========== EVENTOS ==========
    setupEventListeners();
});

function getCurrentUser() {
    const userStr = localStorage.getItem('mangometro_user');
    return userStr ? JSON.parse(userStr) : null;
}

function displayUserName(user) {
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = `Bienvenido, ${user.name || user.email}`;
    }
}

function getUserExpenses(userId) {
    const expensesKey = `mangometro_expenses_${userId}`;
    const expensesStr = localStorage.getItem(expensesKey);
    return expensesStr ? JSON.parse(expensesStr) : [];
}

function displayStats(stats) {
    // Total gastado
    const totalElement = document.querySelector('.card:nth-child(1) .value');
    if (totalElement) {
        totalElement.textContent = `$${stats.total}`;
    }

    // Gasto mensual
    const monthlyElement = document.querySelector('.card:nth-child(2) .value');
    if (monthlyElement) {
        monthlyElement.textContent = `$${stats.monthly}`;
    }
}

function displayRecentExpenses(expenses) {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    // Ordenar por fecha descendente (más recientes primero)
    const sortedExpenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Tomar solo los últimos 5
    const recentExpenses = sortedExpenses.slice(0, 5);

    if (recentExpenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-light);">No hay gastos recientes</td></tr>';
        return;
    }

    tbody.innerHTML = recentExpenses.map(expense => `
        <tr>
            <td>${formatDate(expense.date)}</td>
            <td>${expense.description || expense.commerce || 'Sin descripción'}</td>
            <td>${formatCategory(expense.category)}</td>
            <td>$${parseFloat(expense.amount).toFixed(2)}</td>
        </tr>
    `).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatCategory(category) {
    const categoryMap = {
        'supermercado': 'Supermercado',
        'transporte': 'Transporte',
        'entretenimiento': 'Entretenimiento',
        'comida': 'Comida',
        'servicios': 'Servicios',
        'otro': 'Otro'
    };
    return categoryMap[category] || category || 'Sin categoría';
}

function setupEventListeners() {
    const addBtn = document.getElementById('add-expense-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => window.location.href = 'tickets.html');
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    document.querySelectorAll('.delete-expense').forEach(btn => {
        btn.addEventListener('click', function() {
            const expenseId = this.dataset.id;
            const userId = getCurrentUser().id;
            if (confirm('¿Eliminar gasto?')) {
                deleteExpense(userId, expenseId);
                displayRecentExpenses(getUserExpenses(userId));
            }
        });
    });
}

function setActiveSidebarLink() {
    const currentPath = window.location.pathname.split('/').pop();
    const links = document.querySelectorAll('.sidebar a');
    links.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

function logout() {
    localStorage.removeItem('mangometro_user');
    localStorage.removeItem('mangometro_token');
    window.location.href = 'index.html';
}

