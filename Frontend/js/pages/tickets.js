// tickets.js - Gestión Tickets + Gastos Manuales con OCR real (Tesseract.js)
document.addEventListener('DOMContentLoaded', function() {
  setupRoleUI();
  updateSidebarByRole();
  requireAuth();
  initTicketsPage();
});

function initTicketsPage() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  displayUserName(user);
  resetSessionTimer();
  
  if (isAsesor()) {
    const uploadZone = document.getElementById('uploadZone');
    const manualForm = document.getElementById('manual-expense-form');
    const recentExpenses = document.getElementById('recent-expenses');
    if (uploadZone) uploadZone.style.display = 'none';
    if (manualForm) manualForm.style.display = 'none';
    if (recentExpenses) {
      recentExpenses.innerHTML = '<div class="empty-state"><h3>Vista de Asesor</h3><p>No tienes acceso a carga de tickets.<br><a href="analysis.html">→ Ir a Análisis</a></p></div>';
    }
    return;
  }

  setActiveSidebarLink('tickets.html');
  populateCategories();
  setupManualForm();
  setupDragAndDrop();
  loadRecentExpenses();
}

function displayUserName(user) {
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = user.username || user.email;
  }
  setupRoleUI();
}

function populateCategories() {
  const select = document.getElementById('category');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar categoría</option>';
  CATEGORIES.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.value;
    option.textContent = cat.label;
    select.appendChild(option);
  });
}

function setupManualForm() {
  const form = document.getElementById('manual-expense-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(form);
    const expense = {
      commerce: formData.get('commerce'),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      category: formData.get('category'),
      description: formData.get('description')
    };

    try {
      await createExpense(expense);
      showAlert('✅ Gasto agregado correctamente', 'success');
      form.reset();
      loadRecentExpenses();
    } catch (error) {
      showAlert('❌ Error: ' + error.message, 'error');
    }
  });
}

function setupDragAndDrop() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('previewImg');
  const previewContainer = document.getElementById('preview');
  const processBtn = document.getElementById('process-ticket-btn');

  if (!uploadZone || !fileInput || !processBtn) {
    console.error('No se encontraron elementos del upload zone');
    return;
  }

  let currentFile = null;

  uploadZone.addEventListener('click', function() {
    fileInput.click();
  });

  uploadZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      currentFile = files[0];
      handleFile(currentFile);
    }
  });

  fileInput.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
      currentFile = e.target.files[0];
      handleFile(currentFile);
    }
  });

  function handleFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      showAlert('❌ Formato no soportado. Usá una imagen (JPG, PNG, WebP) o PDF', 'error');
      return;
    }

    console.log('Archivo recibido:', file.name, file.type, file.size);
    showAlert('📄 Archivo: ' + file.name, 'info');

    previewContainer.querySelector('.pdf-icon')?.remove();

    if (file.type === 'application/pdf') {
      preview.style.display = 'none';
      const pdfIcon = document.createElement('div');
      pdfIcon.className = 'pdf-icon';
      pdfIcon.innerHTML = '<div style="font-size:4rem;text-align:center;padding:2rem;">📄</div><p style="text-align:center;color:#666;">PDF: ' + file.name + '</p>';
      previewContainer.insertBefore(pdfIcon, processBtn);
      processBtn.style.display = 'inline-block';
    } else {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }

    previewContainer.classList.remove('hidden');
    previewContainer.style.display = 'block';
    processBtn.style.display = 'inline-block';
    console.log('Preview visible, botón listo');
  }

  processBtn.addEventListener('click', async function() {
    console.log('=== BOTÓN PROCESAR CLICKEADO ===');
    console.log('currentFile:', currentFile ? currentFile.name : 'null');
    
    if (!currentFile) {
      showAlert('❌ Primero subí una imagen del ticket', 'error');
      return;
    }

    showAlert('🤖 Leyendo archivo...', 'info');
    processBtn.disabled = true;
    processBtn.textContent = '⏳ Procesando...';

    try {
      let text = '';

      if (currentFile.type === 'application/pdf') {
        console.log('Convirtiendo PDF a imagen para OCR...');
        if (typeof pdfjsLib === 'undefined') {
          console.error('pdfjsLib no está definido');
          showAlert('❌ Error cargando PDF.js. Recargá la página.', 'error');
          return;
        }
        if (typeof Tesseract === 'undefined') {
          console.error('Tesseract no está definido');
          showAlert('❌ Error cargando Tesseract.js. Recargá la página.', 'error');
          return;
        }
        console.log('pdfjsLib disponible:', !!pdfjsLib);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const imageBlob = await pdfToImage(currentFile);
        console.log('PDF convertido a imagen, aplicando OCR...');
        
        const result = await Tesseract.recognize(imageBlob, 'spa', {
          logger: m => {
            if (m.status === 'recognizing text') {
              const pct = (m.progress * 100).toFixed(0);
              console.log(`OCR: ${pct}%`);
              processBtn.textContent = `⏳ ${pct}%`;
            }
          }
        });
        text = result.data.text;
        console.log('Texto OCR del PDF:', text);
      } else {
        if (typeof Tesseract === 'undefined') {
          console.error('Tesseract no está definido');
          showAlert('❌ Error cargando Tesseract.js. Recargá la página.', 'error');
          return;
        }
        console.log('Iniciando OCR con Tesseract...');
        const result = await Tesseract.recognize(currentFile, 'spa', {
          logger: m => {
            if (m.status === 'recognizing text') {
              const pct = (m.progress * 100).toFixed(0);
              console.log(`OCR: ${pct}%`);
              processBtn.textContent = `⏳ ${pct}%`;
            }
          }
        });
        text = result.data.text;
        console.log('Texto OCR:', text);
      }

      console.log('=== TEXTO EXTRAÍDO ===');
      console.log(text);
      console.log('======================');

      if (!text || text.trim().length < 5) {
        showAlert('⚠️ No se pudo leer texto. Intentá con otra imagen más clara o completá manualmente.', 'warning');
        return;
      }

      const extractedData = parseTicketText(text);
      console.log('Datos extraídos:', extractedData);
      
      const commerceInput = document.getElementById('commerce');
      const amountInput = document.getElementById('amount');
      const dateInput = document.getElementById('date');
      const categorySelect = document.getElementById('category');
      
      if (commerceInput) commerceInput.value = extractedData.commerce;
      if (amountInput) amountInput.value = extractedData.amount;
      if (dateInput) dateInput.value = extractedData.date;
      if (categorySelect) categorySelect.value = extractedData.category;

      showAlert('✅ Datos extraídos. Revisá y guardá.', 'success');
      previewContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error procesando archivo:', error);
      showAlert('❌ Error al leer el archivo: ' + error.message, 'error');
    }

    processBtn.disabled = false;
    processBtn.textContent = '🤖 Procesar con IA OCR';
  });
}

async function pdfToImage(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  
  const scale = 2;
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  
  await page.render({ canvasContext: ctx, viewport }).promise;
  
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

async function extractPDFText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

function parseTicketText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Extraer monto
  let amount = '0.00';
  const amountPatterns = [
    /total[:\s]*\$?\s*([\d.,]+)/i,
    /subtotal[:\s]*\$?\s*([\d.,]+)/i,
    /importe[:\s]*\$?\s*([\d.,]+)/i,
    /\$\s*([\d.,]+)/,
    /([\d.,]+)\s*\$/,
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      let raw = match[1].replace(/\./g, '').replace(',', '.');
      const num = parseFloat(raw);
      if (num > 0 && num < 999999) {
        amount = num.toFixed(2);
        console.log('Monto encontrado:', amount, 'desde:', match[0]);
        break;
      }
    }
  }
  
  // Si no encontró monto con patrones, buscar cualquier número grande
  if (amount === '0.00') {
    const allNumbers = text.match(/[\d.,]+/g);
    if (allNumbers) {
      for (const numStr of allNumbers) {
        let raw = numStr.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(raw);
        if (num > 100 && num < 999999) {
          amount = num.toFixed(2);
          console.log('Monto encontrado (fallback):', amount);
          break;
        }
      }
    }
  }
  
  // Extraer fecha
  let date = new Date().toISOString().split('T')[0];
  const datePatterns = [
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/,
    /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})/,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let day = match[1];
      let month = match[2];
      let year = match[3];
      if (year.length === 2) year = '20' + year;
      if (parseInt(month) > 12) {
        const temp = day;
        day = month;
        month = temp;
      }
      date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('Fecha encontrada:', date);
      break;
    }
  }
  
  // Extraer comercio
  const comercios = [
    'Supermami', 'Coto', 'Carrefour', 'Día', 'Jumbo', 'Disco', 'Walmart', 'Chango Más',
    'Vea', 'Ahorra Más', 'Maxiconsumo', 'La Anónima', 'Coto Digital',
    'McDonalds', 'Burger King', 'Wendys', 'KFC', 'Subway', 'Pizza Hut',
    'YPF', 'Axion', 'Shell', 'Puma', 'EG', 'Petrolera',
    'Netflix', 'Spotify', 'Amazon', 'Mercado Libre',
    'Farmacity', 'Farmacia', 'Droguería',
    'Supermercado', 'Almacén', 'Minimercado', 'Kiosco',
    'Super', 'Mercado', 'Tienda', 'Restaurante'
  ];
  
  let commerce = '';
  for (const line of lines) {
    for (const nombre of comercios) {
      if (line.toLowerCase().includes(nombre.toLowerCase())) {
        commerce = nombre;
        console.log('Comercio encontrado:', commerce, 'en línea:', line);
        break;
      }
    }
    if (commerce) break;
  }
  
  if (!commerce && lines.length > 0) {
    commerce = lines[0].substring(0, 40);
    console.log('Comercio (primera línea):', commerce);
  }
  
  const category = inferCategory(commerce);
  
  return { commerce, amount, date, category };
}

function inferCategory(commerce) {
  const c = commerce.toLowerCase();
  if (c.includes('coto') || c.includes('carrefour') || c.includes('día') || c.includes('jumbo') ||
      c.includes('disco') || c.includes('walmart') || c.includes('super') || c.includes('mercado') ||
      c.includes('chango') || c.includes('vea') || c.includes('ahorra') || c.includes('maxiconsumo') ||
      c.includes('anónima') || c.includes('almacén') || c.includes('minimercado') || c.includes('mami')) {
    return 'supermercado';
  }
  if (c.includes('mcdonald') || c.includes('burger') || c.includes('wendy') ||
      c.includes('kfc') || c.includes('subway') || c.includes('pizza') ||
      c.includes('restaurante') || c.includes('bar') || c.includes('café')) {
    return 'comida';
  }
  if (c.includes('ypf') || c.includes('axion') || c.includes('shell') ||
      c.includes('puma') || c.includes('petrolera') || c.includes('transporte') ||
      c.includes('subte') || c.includes('colectivo') || c.includes('tren')) {
    return 'transporte';
  }
  if (c.includes('netflix') || c.includes('spotify') || c.includes('amazon') ||
      c.includes('cine') || c.includes('teatro')) {
    return 'entretenimiento';
  }
  if (c.includes('farmacia') || c.includes('farmacity') || c.includes('droguería') ||
      c.includes('luz') || c.includes('gas') || c.includes('agua') || c.includes('edesa') ||
      c.includes('edenor') || c.includes('metro gas')) {
    return 'servicios';
  }
  return 'otro';
}

async function loadRecentExpenses() {
  const container = document.getElementById('recent-expenses');
  if (!container) return;

  try {
    let expenses = await getExpenses();
    if (!Array.isArray(expenses)) expenses = [];
    const recent = expenses.slice(-5).reverse();
    
    const countEl = document.getElementById('recent-count');
    if (countEl) countEl.textContent = expenses.length;

    if (recent.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No hay gastos recientes</p></div>';
      return;
    }

    container.innerHTML = recent.map(exp => `
      <div class="expense-item">
        <span>${formatDate(exp.date)}</span>
        <strong>$${parseFloat(exp.amount).toFixed(2)}</strong>
        <span>${exp.commerce}</span>
        <small>${getCategoryLabel(exp.category)}</small>
        <button onclick="handleDeleteExpense('${exp.id}')" title="Eliminar">🗑️</button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error cargando gastos:', error);
  }
}

async function handleDeleteExpense(expenseId) {
  if (confirm('¿Eliminar este gasto?')) {
    try {
      await deleteExpense(expenseId);
      showAlert('🗑️ Gasto eliminado', 'success');
      loadRecentExpenses();
    } catch (e) {
      showAlert('❌ Error al eliminar: ' + e.message, 'error');
    }
  }
}

function setActiveSidebarLink(activePath) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  const links = sidebar.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === activePath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
