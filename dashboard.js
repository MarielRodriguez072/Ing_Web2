// Dashboard - Mangómetro
// Funcionalidades: mostrar usuario, calcular y mostrar estadísticas de gastos

document.addEventListener('DOMContentLoaded', function() {
    // ========== OBTENER USUARIO DESDE LOCALSTORAGE ==========
    const user = getCurrentUser();
    if (!user) {
        alert('No hay sesión activa. Redirigiendo al login...');
        window.location.href = 'login.html';
        return;
    }

    // Mostrar nombre del usuario
    displayUserName(user);

    // ========== OBTENER GASTOS ==========
    const expenses = getUserExpenses(user.id);

    // ========== CALCULAR ESTADÍSTICAS ==========
    const stats = calculateStats(expenses);

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

function calculateStats(expenses) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let total = 0;
    let monthly = 0;

    expenses.forEach(expense => {
        const amount = parseFloat(expense.amount) || 0;
        total += amount;

        // Calcular gasto mensual (mes actual)
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
            monthly += amount;
        }
    });

    return {
        total: total.toFixed(2),
        monthly: monthly.toFixed(2)
    };
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
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('mangometro_user');
            localStorage.removeItem('mangometro_token');
            alert('Sesión cerrada correctamente');
            window.location.href = 'login.html';
        });
    }
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

// ========== LOGGING ==========
console.log('🥭 Dashboard - Lógica cargada correctamente');