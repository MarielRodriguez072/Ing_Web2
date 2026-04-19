// Mangómetro - Página Principal JS
// Funcionalidades: navbar responsive, hamburger menu, scroll suave, navegación, animaciones

document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const demoBtn = document.getElementById('demo-btn');
    const cards = document.querySelectorAll('.card');

    // ========== HAMBURGER MENU ==========
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Cerrar menú al hacer click en un botón
    document.querySelectorAll('.nav-buttons button, .nav-buttons a').forEach(item => {
        item.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navbar.contains(event.target);
        if (!isClickInsideNav && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // ========== NAVBAR SCROLL EFFECT ==========
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ========== SMOOTH SCROLL PARA ENLACES CON # ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ========== NAVEGACIÓN EN CARDS ==========
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            
            // Mapeo de páginas
            const pageMap = {
                'dashboard': 'dashboard.html',
                'tickets': 'tickets.html',
                'analisis': 'analysis.html'
            };
            
            const targetPage = pageMap[page];
            
            if (targetPage) {
                // Animación de transición
                this.style.transform = 'scale(0.97)';
                setTimeout(() => {
                    window.location.href = targetPage;
                }, 150);
            } else {
                console.warn(`Página no encontrada: ${page}`);
            }
        });

        // Efecto visual al hacer hover
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
    });

    // ========== BOTONES DEL NAVBAR ==========
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            window.location.href = 'register.html';
        });
    }

    // ========== BOTÓN DEMO ==========
    if (demoBtn) {
        demoBtn.addEventListener('click', function() {
            const message = '🎉 Mangómetro Demo\\n\\n' +
                          'Esta es la página de bienvenida de la aplicación.\\n' +
                          'Las funcionalidades principales están en:\\n' +
                          '- Dashboard: resumen de tus finanzas\\n' +
                          '- Carga de Tickets: agrega gastos con IA\\n' +
                          '- Análisis: visualiza patrones de consumo\\n\\n' +
                          '¡Haz clic en "Comenzar" para explorar!';
            alert(message);
        });
    }

    // ========== ANIMACIONES DE ENTRADA PARA CARDS ==========
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Aplicar animaciones iniciales a cards y observar
    cards.forEach((card) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        card.style.transition = 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        observer.observe(card);
    });

    // ========== LOGGING ==========
    console.log('🥭 Mangómetro - Landing Page Cargada Correctamente');
    console.log('Versión: 1.0.0 Beta');
});
