# Plan de Implementación de Webhooks para Last.app

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [¿Qué son los Webhooks?](#qué-son-los-webhooks)
- [¿Cuándo Necesitas Webhooks?](#cuándo-necesitas-webhooks)
- [Arquitectura Propuesta](#arquitectura-propuesta)
- [Guía de Implementación](#guía-de-implementación)
- [Eventos Disponibles](#eventos-disponibles)
- [Seguridad y Validación](#seguridad-y-validación)
- [Despliegue y URLs Públicas](#despliegue-y-urls-públicas)
- [Testing y Debugging](#testing-y-debugging)
- [Referencias](#referencias)

---

## Introducción

Este documento describe cómo implementar webhooks para recibir notificaciones en tiempo real de Last.app. Los webhooks permiten sincronización bidireccional y actualizaciones automáticas.

**Estado Actual:** El proyecto solo sincroniza clientes de Avirato → Last.app de forma manual/programada.

**Con Webhooks:** Podrás recibir notificaciones cuando Last.app crea/actualiza clientes, reservas, pedidos, etc.

---

## ¿Qué son los Webhooks?

Los webhooks son notificaciones HTTP automáticas que Last.app envía a tu servidor cuando ocurren eventos importantes.

### Sin Webhooks (Implementación Actual)
```
┌─────────────┐       Consulta cada X minutos        ┌──────────┐
│   Tu App    │ ────────────────────────────────────> │ Last.app │
└─────────────┘       "¿Hay algo nuevo?"              └──────────┘
```

### Con Webhooks
```
┌─────────────┐       Notificación inmediata         ┌──────────┐
│   Tu App    │ <──────────────────────────────────── │ Last.app │
└─────────────┘       "¡Cliente creado!"              └──────────┘
```

---

## ¿Cuándo Necesitas Webhooks?

### ❌ NO NECESITAS webhooks SI:
- Solo sincronizas clientes de Avirato a Last.app
- La sincronización manual/programada es suficiente
- No necesitas notificaciones en tiempo real
- Solo lees datos de Last.app ocasionalmente

### ✅ SÍ NECESITAS webhooks SI:
- Quieres sincronización bidireccional (Last.app ← → Avirato)
- Necesitas actualizar datos en tiempo real
- Quieres recibir notificaciones de reservas/pagos de Last.app
- Necesitas mapear IDs externos después de crear clientes en bulk
- Quieres integrar con sistemas de cocina/POS en tiempo real

---

## Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                      Last.app API                           │
│  (Envía webhooks cuando ocurren eventos)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ POST /api/lastapp/webhooks
                       │ { type: "customer:created", data: {...} }
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Tu Servidor Node.js/Express                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Endpoint: POST /api/lastapp/webhooks                │   │
│  │  - Valida Authorization header                       │   │
│  │  - Procesa evento según tipo                         │   │
│  │  - Responde 200 OK                                   │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────────┐
        │             │             │                 │
        ▼             ▼             ▼                 ▼
   ┌────────┐   ┌──────────┐  ┌──────────┐   ┌────────────┐
   │  Base  │   │ Avirato  │  │  Email   │   │ Notifica-  │
   │  Datos │   │   Sync   │  │  Service │   │   ciones   │
   └────────┘   └──────────┘  └──────────┘   └────────────┘
```

---

## Guía de Implementación

### Paso 1: Crear Estructura de Backend

```bash
# Crear carpeta para el servidor
mkdir -p server/webhooks
mkdir -p server/handlers
```

#### `server/webhooks/lastapp.ts`

```typescript
import express from 'express';
import { validateWebhookAuth } from '../middleware/auth';
import {
  handleCustomerCreated,
  handleCustomerUpdated,
  handleReservationCreated,
  handleReservationUpdated,
  handleTabCreated,
  handlePaymentCreated
} from '../handlers/lastapp-events';

const router = express.Router();

/**
 * Endpoint principal para recibir webhooks de Last.app
 * POST /api/lastapp/webhooks
 */
router.post('/lastapp/webhooks', validateWebhookAuth, async (req, res) => {
  try {
    const event = req.body;

    console.log('📥 Webhook recibido:', {
      id: event.id,
      type: event.type,
      created: event.created,
      organizationId: req.headers.organizationid,
      locationId: req.headers.locationid
    });

    // Procesar evento según el tipo
    switch (event.type) {
      // Eventos de Clientes
      case 'customer:created':
        await handleCustomerCreated(event.data);
        break;

      case 'customer:updated':
        await handleCustomerUpdated(event.data);
        break;

      // Eventos de Reservas
      case 'reservation:created':
        await handleReservationCreated(event.data);
        break;

      case 'reservation:updated':
        await handleReservationUpdated(event.data);
        break;

      case 'reservation:deleted':
        console.log('🗑️ Reserva eliminada:', event.data.id);
        break;

      // Eventos de Pedidos (Tabs)
      case 'tab:created':
        await handleTabCreated(event.data);
        break;

      case 'tab:closed':
        console.log('✅ Pedido cerrado:', event.data.id);
        break;

      case 'tab:cancelled':
        console.log('❌ Pedido cancelado:', event.data.id);
        break;

      // Eventos de Pagos
      case 'payment:created':
        await handlePaymentCreated(event.data);
        break;

      // Eventos de Catálogo
      case 'catalog:updated':
        console.log('📋 Catálogo actualizado');
        break;

      default:
        console.log('ℹ️  Evento no manejado:', event.type);
    }

    // IMPORTANTE: Responder con 200 OK
    res.status(200).send();

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    // Aún así responder 200 para que Last.app no reintente
    res.status(200).send();
  }
});

export default router;
```

#### `server/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

/**
 * Valida que el webhook viene de Last.app
 */
export function validateWebhookAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.LASTAPP_WEBHOOK_SECRET || process.env.VITE_LASTAPP_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    console.error('❌ Webhook con token inválido');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
```

#### `server/handlers/lastapp-events.ts`

```typescript
import { LastAppCustomer, LastAppReservation, LastAppTab, LastAppPayment } from '@/types/lastapp.types';

/**
 * Maneja evento de cliente creado
 */
export async function handleCustomerCreated(customer: LastAppCustomer) {
  console.log('✅ Nuevo cliente creado:', {
    id: customer.id,
    name: customer.name,
    surname: customer.surname,
    phone: customer.phoneNumber,
    source: customer.source
  });

  // TODO: Implementar lógica
  // - Guardar en base de datos local
  // - Sincronizar con Avirato si es necesario
  // - Enviar notificación por email/Slack
  // - Actualizar caché
}

/**
 * Maneja evento de cliente actualizado
 */
export async function handleCustomerUpdated(customer: LastAppCustomer) {
  console.log('📝 Cliente actualizado:', customer.id);

  // TODO: Actualizar registros locales
}

/**
 * Maneja evento de reserva creada
 */
export async function handleReservationCreated(reservation: LastAppReservation) {
  console.log('🍽️ Nueva reserva:', {
    id: reservation.id,
    customerName: reservation.customer_name,
    date: reservation.date,
    time: reservation.time,
    partySize: reservation.party_size
  });

  // TODO: Implementar lógica
  // - Notificar al restaurante
  // - Enviar confirmación al cliente
  // - Actualizar sistema de mesas
}

/**
 * Maneja evento de reserva actualizada
 */
export async function handleReservationUpdated(reservation: LastAppReservation) {
  console.log('📝 Reserva actualizada:', reservation.id);

  // TODO: Actualizar registros
}

/**
 * Maneja evento de pedido creado
 */
export async function handleTabCreated(tab: LastAppTab) {
  console.log('🛒 Nuevo pedido:', {
    id: tab.id,
    customerName: tab.customer_name,
    orderType: tab.order_type,
    total: tab.total
  });

  // TODO: Implementar lógica
  // - Enviar a cocina
  // - Notificar cliente
}

/**
 * Maneja evento de pago creado
 */
export async function handlePaymentCreated(payment: LastAppPayment) {
  console.log('💰 Pago recibido:', {
    id: payment.id,
    amount: payment.amount,
    method: payment.method,
    status: payment.status
  });

  // TODO: Implementar lógica
  // - Registrar en contabilidad
  // - Enviar recibo
}
```

### Paso 2: Configurar Servidor Express

#### `server/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhooksRouter from './webhooks/lastapp';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Registrar rutas de webhooks
app.use('/api', webhooksRouter);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de webhooks escuchando en http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/lastapp/webhooks`);
});
```

### Paso 3: Actualizar package.json

```json
{
  "scripts": {
    "dev": "vite",
    "server": "tsx watch server/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run server\"",
    "build": "tsc && vite build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "tsx": "^4.7.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17"
  }
}
```

### Paso 4: Instalar Dependencias

```bash
npm install express cors dotenv
npm install -D @types/express @types/cors tsx concurrently
```

---

## Eventos Disponibles

### 👤 Clientes
| Evento | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `customer:created` | Cliente creado | Sincronizar con sistemas externos |
| `customer:updated` | Cliente actualizado | Actualizar registros locales |
| `customer_points:updated` | Puntos de fidelidad cambiados | Actualizar programa de lealtad |

### 🍽️ Reservas
| Evento | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `reservation:created` | Nueva reserva | Notificar restaurante, confirmar cliente |
| `reservation:updated` | Reserva modificada | Actualizar sistema de mesas |
| `reservation:deleted` | Reserva cancelada | Liberar mesa, notificar |

### 🛒 Pedidos (Tabs)
| Evento | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `tab:created` | Pedido creado | Enviar a cocina |
| `tab:closed` | Pedido cerrado | Actualizar inventario |
| `tab:cancelled` | Pedido cancelado | Notificar cocina |
| `tab_products:updated` | Productos modificados | Actualizar cocina |

### 💰 Pagos
| Evento | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `payment:created` | Pago recibido | Registrar contabilidad |
| `payment:deleted` | Pago eliminado | Revertir transacción |
| `payment_request:created` | Solicitud de pago | Enviar link al cliente |

### 📋 Catálogo
| Evento | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `catalog:updated` | Menú actualizado | Sincronizar carta |
| `floorplan:updated` | Plano de mesas actualizado | Actualizar sistema de reservas |

### 📍 Integración
| Evento | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `location:integrated` | Local activó tu integración | Inicializar configuración |
| `location:desintegrated` | Integración desactivada | Limpiar datos |

---

## Seguridad y Validación

### 1. Validar Token de Autenticación

```typescript
// Verificar que el webhook viene de Last.app
const authHeader = req.headers.authorization;
const expectedToken = process.env.LASTAPP_WEBHOOK_SECRET;

if (authHeader !== `Bearer ${expectedToken}`) {
  return res.status(401).send();
}
```

### 2. Validar Payload

```typescript
// Validar estructura del evento
if (!event.id || !event.type || !event.created || !event.data) {
  console.error('❌ Payload inválido');
  return res.status(400).send();
}
```

### 3. Idempotencia

```typescript
// Guardar IDs de eventos procesados para evitar duplicados
const processedEvents = new Set<string>();

if (processedEvents.has(event.id)) {
  console.log('⏭️  Evento ya procesado:', event.id);
  return res.status(200).send();
}

processedEvents.add(event.id);
```

### 4. Responder Rápidamente

```typescript
// Procesar en background para responder rápido
router.post('/lastapp/webhooks', async (req, res) => {
  // Responder inmediatamente
  res.status(200).send();

  // Procesar en background
  processWebhookInBackground(req.body);
});
```

---

## Despliegue y URLs Públicas

### Opción 1: ngrok (Desarrollo/Testing)

```bash
# 1. Instalar ngrok
npm install -g ngrok

# 2. Iniciar servidor local
npm run server

# 3. Exponer puerto
ngrok http 3001

# Salida:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3001
```

**URL del webhook:**
```
https://abc123.ngrok.io/api/lastapp/webhooks
```

**Ventajas:**
- ✅ Gratis
- ✅ Setup inmediato
- ✅ Perfecto para desarrollo

**Desventajas:**
- ❌ URL cambia cada vez que reinicias
- ❌ No para producción

### Opción 2: Vercel (Producción)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Configurar proyecto
vercel

# 3. Desplegar
vercel --prod
```

**`vercel.json`:**
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/server/index.ts" }
  ]
}
```

### Opción 3: Railway

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
railway up
```

### Opción 4: Render

1. Conecta tu repo de GitHub
2. Configura:
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
3. Despliega

---

## Testing y Debugging

### 1. Webhook.site (Sin código)

1. Ve a https://webhook.site
2. Copia la URL única
3. Regístrala en Last.app
4. Ve webhooks llegar en tiempo real

### 2. curl (Local)

```bash
# Test local
curl -X POST http://localhost:3001/api/lastapp/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token" \
  -d '{
    "id": "evt_test_123",
    "type": "customer:created",
    "created": "2026-01-10T20:00:00Z",
    "data": {
      "id": "cust_test_456",
      "name": "Juan",
      "surname": "Test",
      "phoneNumber": "+34666000111",
      "source": "test"
    }
  }'
```

### 3. Logs Estructurados

```typescript
// Logger mejorado
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'webhooks.log' }),
    new winston.transports.Console()
  ]
});

// Uso
logger.info('Webhook recibido', {
  eventId: event.id,
  eventType: event.type,
  customerId: event.data.id
});
```

### 4. Monitoring

```typescript
// Métricas básicas
let webhookCount = 0;
let errorCount = 0;

app.get('/api/metrics', (req, res) => {
  res.json({
    webhooksReceived: webhookCount,
    errors: errorCount,
    uptime: process.uptime()
  });
});
```

---

## Configuración en Last.app Developer Portal

### Paso 1: Acceder al Portal

1. Ve a https://developers.last.app
2. Inicia sesión con tus credenciales
3. Navega a la sección **"Webhooks"**

### Paso 2: Registrar Webhook

1. Haz clic en **"Añadir Webhook"**
2. Introduce tu URL: `https://tu-dominio.com/api/lastapp/webhooks`
3. Selecciona eventos:
   - ✅ `customer:created`
   - ✅ `customer:updated`
   - ✅ `reservation:created`
   - ✅ `reservation:updated`
   - ✅ `tab:created`
   - ✅ `payment:created`
4. Guarda

### Paso 3: Probar

Last.app enviará un webhook de prueba. Verifica que tu servidor lo recibe correctamente.

---

## Estructura de Proyecto Final

```
avirato-reserve-viewer/
├── server/
│   ├── index.ts                 # Servidor Express principal
│   ├── webhooks/
│   │   └── lastapp.ts          # Router de webhooks
│   ├── handlers/
│   │   └── lastapp-events.ts   # Manejadores de eventos
│   ├── middleware/
│   │   └── auth.ts             # Validación de autenticación
│   └── utils/
│       └── logger.ts           # Logger configurado
├── src/                         # Frontend (React/Vite)
├── docs/
│   └── WEBHOOKS_LASTAPP_PLAN.md # Este documento
├── .env.local                   # Variables de entorno
├── package.json
└── tsconfig.json
```

---

## Variables de Entorno

```env
# .env.local

# Last.app API
VITE_LASTAPP_TOKEN=tu_bearer_token
VITE_LASTAPP_ORGANIZATION_ID=tu_org_id
VITE_LASTAPP_LOCATION_ID=tu_loc_id

# Webhooks Server
WEBHOOK_PORT=3001
LASTAPP_WEBHOOK_SECRET=tu_token  # Mismo que VITE_LASTAPP_TOKEN
```

---

## Checklist de Implementación

### Fase 1: Setup Básico
- [ ] Crear carpeta `server/`
- [ ] Instalar dependencias (express, cors, etc.)
- [ ] Crear endpoint básico de webhooks
- [ ] Configurar middleware de autenticación
- [ ] Probar localmente con curl

### Fase 2: Manejadores de Eventos
- [ ] Implementar handler de `customer:created`
- [ ] Implementar handler de `customer:updated`
- [ ] Implementar handler de `reservation:created`
- [ ] Implementar handler de `reservation:updated`
- [ ] Implementar handlers adicionales según necesidad

### Fase 3: Testing
- [ ] Probar con ngrok
- [ ] Registrar webhook en Last.app Developer Portal
- [ ] Verificar recepción de webhooks de prueba
- [ ] Validar logging y error handling

### Fase 4: Producción
- [ ] Elegir plataforma de hosting (Vercel, Railway, Render)
- [ ] Configurar variables de entorno en producción
- [ ] Desplegar servidor
- [ ] Actualizar URL en Last.app Developer Portal
- [ ] Monitorear webhooks en producción

### Fase 5: Optimización
- [ ] Implementar cola de procesamiento (Bull/BullMQ)
- [ ] Añadir retry logic para fallos
- [ ] Implementar idempotencia
- [ ] Configurar alertas de errores (Sentry)
- [ ] Añadir métricas y monitoring

---

## Mejores Prácticas

### 1. Responder Rápidamente
```typescript
// ❌ MALO: Procesar todo antes de responder
router.post('/webhooks', async (req, res) => {
  await processEvent(req.body);  // Puede tardar mucho
  res.status(200).send();
});

// ✅ BUENO: Responder inmediatamente
router.post('/webhooks', async (req, res) => {
  res.status(200).send();
  processEventInBackground(req.body);
});
```

### 2. Idempotencia
```typescript
// Guardar eventos procesados
const processedEvents = new Map<string, Date>();

if (processedEvents.has(event.id)) {
  return; // Ya procesado
}

processedEvents.set(event.id, new Date());
```

### 3. Retry Logic
```typescript
async function processEventWithRetry(event: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processEvent(event);
      return;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
}
```

### 4. Dead Letter Queue
```typescript
// Guardar eventos que fallan para revisión manual
async function handleFailedEvent(event: any, error: Error) {
  await db.failedWebhooks.create({
    eventId: event.id,
    eventType: event.type,
    payload: event,
    error: error.message,
    timestamp: new Date()
  });
}
```

---

## Troubleshooting

### Webhook no llega

**Causas comunes:**
1. URL incorrecta en Last.app
2. Servidor caído
3. Firewall bloqueando
4. ngrok expiró (en desarrollo)

**Solución:**
```bash
# Verificar que el servidor está corriendo
curl http://localhost:3001/health

# Verificar ngrok (si usas)
ngrok http 3001

# Ver logs del servidor
npm run server
```

### Error 401 en webhook

**Causa:** Token de autenticación incorrecto

**Solución:**
```typescript
// Verificar que el token coincide
console.log('Expected:', process.env.LASTAPP_WEBHOOK_SECRET);
console.log('Received:', req.headers.authorization);
```

### Eventos duplicados

**Causa:** Last.app puede reintentar si no respondes 200

**Solución:** Implementar idempotencia (ver arriba)

### Servidor lento

**Causa:** Procesas todo en el request

**Solución:** Usa una cola (Bull/BullMQ)

```bash
npm install bull
```

```typescript
import Queue from 'bull';

const webhookQueue = new Queue('webhooks', {
  redis: { host: 'localhost', port: 6379 }
});

// Añadir a cola
router.post('/webhooks', async (req, res) => {
  await webhookQueue.add(req.body);
  res.status(200).send();
});

// Procesar desde cola
webhookQueue.process(async (job) => {
  await processEvent(job.data);
});
```

---

## Referencias

### Documentación Oficial
- **Last.app API Docs:** https://developers.last.app/docs
- **Webhooks Guide:** https://developers.last.app/docs/index.html#tag/Webhooks
- **Developer Portal:** https://developers.last.app

### Herramientas
- **ngrok:** https://ngrok.com
- **webhook.site:** https://webhook.site
- **Vercel:** https://vercel.com
- **Railway:** https://railway.app

### Librerías Recomendadas
- **Express:** https://expressjs.com
- **Bull (Colas):** https://github.com/OptimalBits/bull
- **Winston (Logs):** https://github.com/winstonjs/winston
- **Sentry (Monitoring):** https://sentry.io

---

## Notas Finales

**Fecha de creación:** Enero 2026
**Última actualización:** Enero 2026
**Estado:** Planificado (No implementado)
**Prioridad:** Media (Implementar cuando se necesite sincronización bidireccional)

---

¿Dudas o necesitas ayuda implementando? Consulta este documento y la documentación oficial de Last.app.
