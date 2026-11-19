# Tickets Lambda

Sistema integral para la gestión de eventos, diseño de mapas de mesas y asientos, generación de boletos con código QR, control de acceso mediante escáner y administración de personal.

## Características Principales

- **Gestión de Eventos:** Creación, edición y eliminación de eventos con fecha, categoría, capacidad máxima y reglas de acceso.
- **Creador de Mapa de Mesas y Asientos:** Lienzo interactivo basado en Fabric.js para diseñar mesas cuadradas, mesas redondas y sillas etiquetadas con ejes de simetría opcionales.
- **Generador de Tickets QR:**
  - Emisión de boletos individuales, grupales (1 QR para múltiples personas) o asignados a un asiento específico del mapa.
  - Prevención de doble asignación de asientos.
  - Vista previa y exportación en formato **Tira Desktop (800x220)** y **Móvil 9:16 (450x800)** en JPG y lotes `.zip`.
  - Respaldo automático de imágenes generadas en el servidor.
- **Monitor de Asientos en Vivo:** Visualización en tiempo real del estado de cada asiento (disponible, vendido, ingresado) y métricas de asistencia.
- **Escáner de Boletos:** Validación y quema de códigos QR mediante motor propio en JavaScript puro (`qrDecoder.js` sobre cámara web e imagen) e ingreso manual de folio.
- **Gestión de Personal (Staff) y Usuarios:** Asignación de staff por evento, registro de entradas/salidas (`clock-in`) y visor de base de datos para administradores.

## Stack Tecnológico

### Frontend (`client/`)
- React 19 + Vite 7
- Tailwind CSS v4
- React Router DOM v7
- Fabric.js v7 (editor y monitor de mapas)
- Motor QR propio sin dependencias (`src/utils/qrEngine.js` y `src/utils/qrDecoder.js`)
- `html-to-image`, `jszip`, `file-saver`
- Axios & Lucide React

### Backend (`server/`)
- Node.js + Express 5
- Sequelize + SQLite (`server/database.sqlite`)
- JSON Web Tokens (`jsonwebtoken`) para autenticación
- `qrcode`, `cors`, `dotenv`

## Estructura del Proyecto

```text
Tickets Lambda/
├── client/                 # Aplicación frontend en React + Vite
│   ├── src/
│   │   ├── api/            # Instancia de Axios con interceptor JWT
│   │   ├── components/     # LayoutEditor, TicketPreviewModal, Sidebar, etc.
│   │   ├── context/        # AuthContext
│   │   └── pages/          # Dashboard, EventEditor, TicketGenerator, SeatMonitor, Scanner, etc.
│   └── package.json
├── server/                 # API REST en Express + Sequelize
│   ├── models/             # User, Event, Ticket, Staff, EventStaff, TimeLog
│   ├── routes/             # auth.js, events.js, tickets.js, staff.js
│   ├── index.js            # Punto de entrada del servidor
│   └── package.json
├── ventanas/               # Prototipos y variables de diseño
├── LICENSE                 # Licencia GPL-3.0
└── README.md
```

## Instalación y Ejecución

### Requisitos previos
- Node.js 18 o superior
- npm

### 1. Instalar dependencias

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configurar variables de entorno (opcional)

En `server/.env` puedes definir:

```env
PORT=3001
JWT_SECRET=tu_clave_secreta
```

### 3. Iniciar el servidor backend

```bash
cd server
npm run dev
```

El servidor se ejecutará en `http://localhost:3001`.

### 4. Iniciar el frontend

```bash
cd client
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 5. Build de producción (Frontend)

```bash
cd client
npm run build
```

## Licencia

Este proyecto se distribuye bajo la licencia incluida en el archivo [LICENSE](LICENSE).
