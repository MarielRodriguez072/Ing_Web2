// tickets.js - Gestión Tickets + Gastos Manuales (Paso 2)

// import replaced - using globals from expenses.js

document.addEventListener('DOMContentLoaded', function() {
  setupRoleUI();
  updateSidebarByRole();
  requireAuth();
  initTicketsPage();
});


function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function initTicketsPage() {
  const user = getCurrentUser();
  resetSessionTimer();
  
  // Ocultar tickets para asesor
  if (isAsesor()) {
    const uploadZone = document.getElementById('uploadZone');
    const manualForm = document.getElementById('manual-expense-form');
    const recentExpenses = document.getElementById('recent-expenses');
    if (uploadZone) uploadZone.style.display = 'none';
    if (manualForm) manualForm.style.display = 'none';
    if (recentExpenses) {
      recentExpenses.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-light);"><h3>Vista de Asesor</h3><p>No tienes acceso a carga de tickets.<br><a href="analysis.html">→ Ir a Análisis</a></p></div>';
    }
    return;
  }

  // Sidebar active
  setActiveSidebarLink('tickets.html');

  // Form manual
  setupManualForm(user.id);

  // Upload sim
  setupTicketUpload();

  // Lista recientes
  displayRecentExpenses(user.id);
}


function setupManualForm(userId) {
  const form = document.getElementById('manual-expense-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(form);
    const expense = {
      commerce: formData.get('commerce'),
      amount: formData.get('amount'),
      date: formData.get('date'),
      category: formData.get('category'),
      description: formData.get('description')
    };

    try {
      addExpense(userId, expense);
      showAlert('✅ Gasto agregado correctamente', 'success');
      form.reset();
      displayRecentExpenses(userId);
    } catch (error) {
      showAlert(`❌ Error: ${error.message}`, 'error');
    }
  });
}

function setupTicketUpload() {
  const uploadInput = document.getElementById('fileInput');
  const processBtn = document.getElementById('process-ticket-btn');
  const preview = document.getElementById('previewImg');
  const previewContainer = document.getElementById('preview');


  if (!uploadInput || !processBtn) return;

  uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  processBtn.addEventListener('click', function() {
    // Simulación IA OCR (datos fake random)
    const fakeOCR = generateFakeOCR();
    showAlert('🤖 Procesando con IA OCR...', 'info');

    setTimeout(() => {
      // Auto-fill form
      const commerceInput = document.getElementById('commerce');
      const amountInput = document.getElementById('amount');
      const dateInput = document.getElementById('date');
      const categorySelect = document.getElementById('category');
      
      if (commerceInput) commerceInput.value = fakeOCR.commerce;
      if (amountInput) amountInput.value = fakeOCR.amount;
      if (dateInput) dateInput.value = fakeOCR.date;
      if (categorySelect) categorySelect.value = fakeOCR.category;
      
      previewContainer.scrollIntoView({ behavior: 'smooth' });
      showAlert('✅ Datos extraídos! Revisa y guarda.', 'success');
    }, 1500);
  });

}

function generateFakeOCR() {
  const comercios = ['Coto', 'Carrefour', 'Dia', 'McDonalds', 'Burger King', 'Ypf', 'Netflix'];
  const montos = (Math.random() * 5000 + 100).toFixed(2);
  const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const cats = CATEGORIES.map(c => c.value)[Math.floor(Math.random() * CATEGORIES.length)];

  return {
    commerce: comercios[Math.floor(Math.random() * comercios.length)],
    amount: montos,
    date,
    category: cats
  };
}

function displayRecentExpenses(userId) {
  const container = document.getElementById('recent-expenses');
  if (!container) return;

  const expenses = getExpenses(userId);
  const recent = expenses.slice(-5).reverse();

  if (recent.length === 0) {
    container.innerHTML = '<p class=\"empty-state\">No hay gastos recientes</p>';
    return;
  }

  container.innerHTML = recent.map(exp => `
    <div class=\"expense-item\">
      <span>${formatDate(exp.date)}</span>
      <strong>$${parseFloat(exp.amount).toFixed(2)}</strong>
      <span>${exp.commerce}</span>
      <small>${getCategoryLabel(exp.category)}</small>
      <button onclick=\"deleteExpense('${userId}', '${exp.id}')\">🗑️</button>
    </div>
  `).join('');
}

// Utils compartidos (copiados de dashboard.js)

function getCurrentUser() {
  return parseLocalStorageJSON('mangometro_user', null);
}


function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES');
}

function getCategoryLabel(value) {
  return CATEGORIES.find(c => c.value === value)?.label || value;
}

function resetSessionTimer() {
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  clearTimeout(window.sessionTimer);
  window.sessionTimer = setTimeout(() => {
    logout();
  }, SESSION_TIMEOUT);
  window.resetSessionTimer = resetSessionTimer; // Global
}

function logout() {
  localStorage.removeItem('mangometro_user');
  localStorage.removeItem('mangometro_token');
  window.location.href = 'login.html';
}

function setActiveSidebarLink(activePath) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return; // No sidebar in simple pages
  const links = sidebar.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === activePath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  window.setActiveSidebarLink = setActiveSidebarLink;
}

function showAlert(msg, type = 'info') {
  // Simple toast
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = msg;
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), 3000);
}

// Global delete (para onclick inline)

window.deleteExpense = function(userId, expenseId) {
  if (confirm('¿Eliminar este gasto?')) {
    try {
      deleteExpense(userId, expenseId);
      showAlert('🗑️ Gasto eliminado', 'success');
      initTicketsPage(); // Refresh
    } catch (e) {
      console.error('Delete error:', e);
      showAlert('❌ Error al eliminar: ' + e.message, 'error');
    }
  }
};


/* Tickets.js cargado */

