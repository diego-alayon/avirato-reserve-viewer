# Agente: Last.app API Assistant

## 📋 Información General

- **Nombre:** `last-app-api`
- **Versión:** 1.0.0
- **Tipo:** Assistant (Asistente Interactivo)
- **API:** Last.app v2.0.0

## 🎯 Objetivo del Agente

Este agente es un asistente especializado en la integración con la API de Last.app v2.0.0. Su objetivo principal es proporcionar ayuda experta, documentación completa y ejemplos de código para desarrolladores que trabajan con la plataforma Last.app.

## 🔧 Para Qué Sirve

El agente `last-app-api` sirve para:

1. **Responder Preguntas Técnicas**
   - Explicar endpoints de la API
   - Clarificar parámetros y formatos de datos
   - Resolver dudas sobre autenticación y headers

2. **Proporcionar Ejemplos de Código**
   - Snippets de TypeScript listos para usar
   - Implementaciones completas de casos de uso comunes
   - Patrones de diseño específicos para Last.app

3. **Guiar Implementaciones**
   - Paso a paso para integrar funcionalidades
   - Mejores prácticas y optimizaciones
   - Estrategias de manejo de errores

4. **Debuggear Problemas**
   - Identificar errores comunes (400, 401, 429, 500)
   - Analizar payloads incorrectos
   - Solucionar problemas de rate limiting

## ⚡ Acciones que Realiza

### 1. Consulta de Documentación
El agente tiene acceso a documentación completa de Last.app API:

- **Autenticación** - Bearer tokens, headers, validación
- **Rate Limits** - Límites de peticiones, estrategias de throttling
- **Organizaciones** - Gestión de organizaciones y locales
- **Locaciones** - Configuración de restaurantes/tiendas
- **Catálogos y Productos** - Gestión de menús y artículos
- **Pedidos (Tabs)** - Ciclo completo de órdenes
- **Facturas y Pagos** - Procesamiento de transacciones
- **Reservas** - Sistema de reservaciones
- **Clientes** - CRUD de clientes y loyalty points
- **Promociones** - Descuentos y ofertas
- **Webhooks** - Notificaciones en tiempo real
- **Modelos y Schemas** - Tipos TypeScript completos

### 2. Generación de Código
Proporciona ejemplos de código TypeScript para:

```typescript
// Ejemplo: Crear un cliente
const customer = await lastAppService.createCustomer({
  organizationId: 'org_123',
  name: 'Juan',
  phoneNumber: '+34666777888',
  source: 'hotel'
});

// Ejemplo: Crear una reserva
const reservation = await lastAppService.createReservation({
  location_id: 'loc_456',
  date: '2026-01-15',
  time: '19:00',
  party_size: 4,
  customer_name: 'Juan Pérez'
});
```

### 3. Debugging Asistido
Ayuda a diagnosticar y resolver errores:

- **Error 400:** Parámetros incorrectos, payloads mal formateados
- **Error 401:** Problemas de autenticación, tokens inválidos
- **Error 429:** Rate limit excedido, necesidad de throttling
- **Error 500:** Errores del servidor, estrategias de retry

### 4. Arquitectura y Best Practices
Sugiere patrones de diseño y mejores prácticas:

- Implementación de RateLimiter
- Manejo de errores con retry logic
- Estructura de servicios (clase singleton)
- Validación de datos antes de enviar
- Logging y debugging efectivo

## 📚 Contenido del Agente

### Documentación (`docs/`)

| Archivo | Descripción |
|---------|-------------|
| `01-overview.md` | Visión general de la API |
| `02-authentication.md` | Autenticación con Bearer tokens |
| `03-rate-limits.md` | Límites y estrategias de throttling |
| `04-organizations.md` | Gestión de organizaciones |
| `05-locations.md` | Gestión de locales/restaurantes |
| `06-catalogs-products.md` | Menús y productos |
| `07-tabs-orders.md` | Sistema de pedidos |
| `08-bills-payments.md` | Facturación y pagos |
| `09-reservations.md` | Sistema de reservas |
| `10-customers.md` | Gestión de clientes |
| `11-promotions.md` | Descuentos y promociones |
| `12-webhooks.md` | Webhooks y eventos |
| `13-models-schemas.md` | Tipos TypeScript completos |

### Ejemplos (`examples/`)

| Archivo | Descripción |
|---------|-------------|
| `auth-setup.ts` | Configuración inicial de autenticación |
| `create-reservation.ts` | Flujo completo de creación de reserva |
| `manage-tab.ts` | Gestión de pedidos/órdenes |
| `process-payment.ts` | Procesamiento de pagos |

### Archivos de Configuración

- **`skill.json`** - Configuración del agente (triggers, capacidades)
- **`instructions.md`** - Instrucciones internas del comportamiento del agente

## 🚀 Cómo Usar Este Agente

### En Claude Code

Este agente se puede invocar en Claude Code usando:

```
@last-app
```

o

```
/last-app
```

### Casos de Uso Comunes

#### 1. Entender un Endpoint
```
@last-app ¿Cómo funciona el endpoint de crear clientes?
```

#### 2. Obtener Ejemplo de Código
```
@last-app Dame un ejemplo de cómo crear una reserva
```

#### 3. Debuggear un Error
```
@last-app Estoy recibiendo error 400 al crear un cliente,
el error dice "phoneNumber is required"
```

#### 4. Consultar Rate Limits
```
@last-app ¿Cuáles son los límites de rate limiting de Last.app?
```

#### 5. Entender Webhooks
```
@last-app ¿Qué eventos de webhook están disponibles?
```

## 🔑 Capacidades Principales

Según `skill.json`, el agente tiene estas capacidades:

1. **answer_questions** - Responde preguntas técnicas sobre la API
2. **provide_examples** - Genera ejemplos de código funcionales
3. **guide_implementation** - Guía paso a paso en implementaciones
4. **debug_errors** - Ayuda a diagnosticar y resolver errores

## 📊 Información de la API

### Versión
- **API Version:** 2.0.0
- **Base URL:** `https://api.last.shop`

### Rate Limits
- **Por 10 minutos:** 1,500 requests
- **Por segundo por entidad:** 15 requests

## 💡 Ejemplo de Uso en Proyecto

Este agente fue utilizado durante el desarrollo para:

1. **Entender la estructura correcta de CreateCustomerRequest**
   - Identificó que se requiere `phoneNumber` (no `phone`)
   - Confirmó campos obligatorios: `organizationId`, `name`, `phoneNumber`, `source`

2. **Diagnosticar errores de sincronización**
   - Error 400: "Unknown query parameter 'search'"
   - Error 500: Payloads con propiedades `undefined`

3. **Implementar estrategia correcta de sincronización**
   - Intentar crear directamente (sin búsqueda previa)
   - Manejar errores de duplicado como éxito

## 🔗 Referencias

- **Documentación Oficial:** https://developers.last.app/docs
- **Developer Portal:** https://developers.last.app
- **Ubicación Original:** `/Users/diegoandres/.claude/skills/last-app-api/`

## 📝 Notas

Este agente contiene **documentación completa y actualizada** de la API de Last.app v2.0.0, incluyendo todos los endpoints, parámetros, tipos TypeScript y ejemplos de uso.

Es una herramienta invaluable para cualquier desarrollo que integre con Last.app, ya que centraliza todo el conocimiento necesario en un solo lugar.

---

**Última actualización:** Enero 2026
**Mantenedor:** Claude Code
**Estado:** Activo y en uso
