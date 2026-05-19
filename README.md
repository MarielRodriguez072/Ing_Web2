# 🥭 Mangómetro

**Plataforma Inteligente de Gestión de Gastos Personales**

Mangómetro es una aplicación web que permite a los usuarios registrar, visualizar y analizar sus gastos personales. Los usuarios pueden cargar gastos manualmente o mediante fotos de tickets comerciales (con extracción automática de datos vía OCR). Un asesor financiero puede analizar los patrones de consumo de los clientes y brindar recomendaciones.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| **Frontend** | HTML5, CSS3 (vanilla), JavaScript (vanilla) |
| **Backend** | Node.js, NestJS 11, TypeScript |
| **Autenticación** | JWT (Passport + bcryptjs) |
| **Persistencia** | Archivo JSON (`data.json`) |
| **OCR** | Tesseract.js, PDF.js |
| **Testing** | Jest, Supertest |

---

## Requisitos previos

- Node.js **>= 18.0.0**
- npm **>= 9.0.0**

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Ing_Web2

# 2. Instalar dependencias del backend
cd backend
npm install
```

> El frontend es HTML/CSS/JS puro, no requiere instalación de dependencias.

---

## Ejecución

### Backend (API)

```bash
cd backend

# Desarrollo con recarga automática
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El backend se levanta en `http://localhost:3000` por defecto (configurable con `PORT`).

### Frontend

Abrir cualquiera de los archivos HTML en el navegador. Recomendado:

- **Live Server** (VSCode): clic derecho sobre `Frontend/index.html` → "Open with Live Server"
- **Python**: `python3 -m http.server 5173` dentro de `Frontend/`
- **npx serve**: `npx serve Frontend -p 5173`

---

## Scripts disponibles

### Backend (`backend/`)

| Script | Descripción |
|---|---|
| `npm run start:dev` | Inicia el servidor en modo desarrollo con watch |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm run start:prod` | Inicia el servidor en modo producción |
| `npm test` | Ejecuta tests unitarios |
| `npm run test:watch` | Ejecuta tests en modo watch |
| `npm run test:cov` | Ejecuta tests con reporte de cobertura |
| `npm run lint` | Ejecuta ESLint sobre el código fuente |

---

## Estructura del proyecto

```
Ing_Web2/
├── README.md
├── backend/                          # API REST (NestJS)
│   ├── src/
│   │   ├── main.ts                   # Punto de entrada
│   │   ├── app.module.ts             # Módulo raíz
│   │   ├── app.controller.ts         # Health check
│   │   ├── auth/                     # Autenticación (JWT)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── dto/                  # DTOs de validación
│   │   ├── users/                    # Gestión de usuarios
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── expenses/                 # Gestión de gastos
│   │   │   ├── expenses.controller.ts
│   │   │   ├── expenses.service.ts
│   │   │   └── dto/
│   │   └── */*.spec.ts               # Tests unitarios
│   ├── test/                         # Tests e2e
│   ├── data.json                     # Base de datos (JSON)
│   ├── package.json
│   └── tsconfig.json
│
└── Frontend/                         # Aplicación web (SPA vanilla)
    ├── index.html                    # Landing page
    ├── login.html                    # Inicio de sesión
    ├── register.html                 # Registro de usuarios
    ├── recover-password.html         # Recuperación de contraseña
    ├── dashboard.html                # Dashboard del usuario
    ├── analysis.html                 # Análisis de gastos
    ├── tickets.html                  # Carga de tickets (OCR)
    ├── clients.html                  # Gestión de clientes (asesor)
    ├── css/
    │   ├── base/
    │   │   ├── variables.css         # Variables CSS, reset, utilidades
    │   │   └── components.css        # Componentes reutilizables
    │   ├── pages/
    │   │   ├── landing.css           # Estilos de la landing page
    │   │   ├── auth.css              # Estilos de autenticación
    │   │   ├── dashboard.css         # Dashboard, tablas, stats
    │   │   └── analysis.css          # KPIs, chart cards
    │   └── layout/
    │       └── sidebar.css           # Sidebar del dashboard
    ├── js/
    │   ├── core/
    │   │   ├── config.js             # Configuración (API_URL)
    │   │   ├── api.js                # Cliente HTTP, auth storage
    │   │   ├── auth.js               # Rate limiting, validación
    │   │   ├── shared.js             # Utilidades compartidas
    │   │   ├── roles.js              # Sistema de roles
    │   │   └── auth-events.js        # Eventos de logout
    │   └── pages/
    │       ├── index.js              # Landing page
    │       ├── dashboard.js          # Dashboard
    │       ├── analysis.js           # Análisis de gastos
    │       ├── tickets.js            # Carga de tickets
    │       └── clients.js            # Gestión de clientes
    ├── assets/                       # Recursos estáticos
    └── components/                   # Fragmentos HTML reutilizables
```

---

## API Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api` | No | Health check |
| POST | `/api/auth/register` | No | Registro de usuario |
| POST | `/api/auth/login` | No | Inicio de sesión |
| GET | `/api/auth/profile` | JWT | Perfil del usuario autenticado |
| GET | `/api/expenses` | JWT | Gastos (propios o de todos si es asesor) |
| GET | `/api/expenses?userId=xxx` | JWT | Gastos de un cliente específico (solo asesor) |
| POST | `/api/expenses` | JWT | Crear un gasto |
| DELETE | `/api/expenses/:id` | JWT | Eliminar un gasto |
| GET | `/api/users` | JWT | Listar clientes (solo asesor) |

---

## Roles de usuario

| Rol | Descripción |
|---|---|
| **cliente** | Registra gastos, carga tickets, visualiza estadísticas personales |
| **asesor** | Accede al panel de clientes, selecciona un cliente y visualiza su dashboard y análisis |

---

## Buenas prácticas implementadas

- **Arquitectura modular** — CSS separado por capas (base, componentes, layout, páginas)
- **DRY** — Utilidades compartidas en `shared.js`, componentes CSS reutilizables
- ** sin estilos inline** — Todos los estilos migrados a archivos CSS
- **Configuración centralizada** — `API_URL` en `config.js`
- **Separación de responsabilidades** — JS organizado en `core/` (lógica compartida) y `pages/` (lógica específica)
- **Validación** — DTOs con `class-validator` en backend, validación client-side
- **Autenticación segura** — JWT con bcryptjs, rate limiting en login
- **Testing** — Tests unitarios con Jest (67 tests), tests e2e con Supertest

---

## Evaluación y testing

```bash
# Tests unitarios del backend
cd backend && npm test

# Tests con cobertura
npm run test:cov

# Tests e2e (requiere base de datos de test)
npm run test:e2e
```

---

## Autores

- Mariel Valentina Rodriguez Luna
- Tomas Ignacio Disandro

---

## Licencia

UNLICENSED — Proyecto académico.
