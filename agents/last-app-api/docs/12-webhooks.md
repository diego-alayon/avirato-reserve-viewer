# Webhooks

## Overview

Webhooks provide real-time event notifications from Last.app to your application. Instead of polling for changes, Last.app sends HTTP POST requests to your server when events occur.

## Available Events

### Tab/Order Events
- `tab:created` - New tab/order created
- `tab:updated` - Tab status or products changed
- `tab:closed` - Tab completed and closed

### Bill & Payment Events
- `bill:created` - New bill generated
- `payment:created` - Payment recorded
- `payment_request:created` - Customer requested payment link

### Reservation Events
- `reservation:created` - New reservation made
- `reservation:updated` - Reservation modified
- `reservation:cancelled` - Reservation cancelled

### Catalog Events
- `catalog:updated` - Product catalog modified
- `product:updated` - Single product changed

### Customer Events
- `customer:created` - New customer profile
- `customer:updated` - Customer information changed

### Location Events
- `location:integrated` - New location added to integration
- `floorplan:updated` - Table layout changed

## Register Webhook

**POST** `/webhooks` (endpoint not explicitly documented but implied)

Or use the Developer Portal to configure webhooks.

**Request:**
```typescript
interface RegisterWebhookRequest {
  url: string;              // Your endpoint URL (must be HTTPS)
  events: string[];         // Array of event names
  secret?: string;          // Optional secret for signature validation
}
```

**Example:**
```typescript
await lastAppService.registerWebhook(
  'https://your-app.com/api/webhooks/lastapp',
  [
    'tab:created',
    'tab:updated',
    'bill:created',
    'payment:created',
    'reservation:created',
    'customer:created'
  ]
);
```

---

## Webhook Payload

All webhooks follow this structure:

```typescript
interface WebhookPayload {
  event: string;              // Event name (e.g., "tab:created")
  timestamp: string;          // ISO 8601 timestamp
  data: any;                  // Event-specific data
  organization_id: string;
  location_id?: string;
}
```

### Example Payloads

**tab:created:**
```json
{
  "event": "tab:created",
  "timestamp": "2026-01-15T14:30:00Z",
  "organization_id": "org_abc123",
  "location_id": "loc_xyz789",
  "data": {
    "id": "tab_new123",
    "table_number": 5,
    "customer_name": "John Doe",
    "order_type": "dine_in",
    "status": "KITCHEN",
    "products": [...]
  }
}
```

**payment:created:**
```json
{
  "event": "payment:created",
  "timestamp": "2026-01-15T15:00:00Z",
  "organization_id": "org_abc123",
  "location_id": "loc_xyz789",
  "data": {
    "id": "payment_456",
    "bill_id": "bill_789",
    "amount": 45.50,
    "method": "card",
    "status": "completed"
  }
}
```

**reservation:created:**
```json
{
  "event": "reservation:created",
  "timestamp": "2026-01-15T12:00:00Z",
  "organization_id": "org_abc123",
  "location_id": "loc_xyz789",
  "data": {
    "id": "res_abc",
    "date": "2026-01-20",
    "time": "19:00",
    "party_size": 4,
    "customer_name": "María García",
    "customer_phone": "+34612345678"
  }
}
```

---

## Server Implementation

### Express.js Example

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/api/webhooks/lastapp', async (req, res) => {
  try {
    // 1. Validate webhook signature (if using secret)
    const signature = req.headers['x-lastapp-signature'];
    if (!validateSignature(req.body, signature, process.env.WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Extract event data
    const { event, data, organization_id, location_id } = req.body;

    console.log(`Received webhook: ${event}`);

    // 3. Handle event
    switch (event) {
      case 'tab:created':
        await handleTabCreated(data);
        break;

      case 'tab:updated':
        await handleTabUpdated(data);
        break;

      case 'bill:created':
        await handleBillCreated(data);
        break;

      case 'payment:created':
        await handlePaymentCreated(data);
        break;

      case 'reservation:created':
        await handleReservationCreated(data);
        break;

      case 'customer:created':
        await handleCustomerCreated(data);
        break;

      case 'catalog:updated':
        await handleCatalogUpdated(data);
        break;

      default:
        console.warn(`Unknown event: ${event}`);
    }

    // 4. Respond quickly (under 5 seconds)
    res.sendStatus(200);

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signature validation
function validateSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Event handlers
async function handleTabCreated(tab: any) {
  console.log('New tab created:', tab.id);

  // Send notification to kitchen display
  await notifyKitchen(tab);

  // Update real-time dashboard
  await updateDashboard('new_order', tab);
}

async function handlePaymentCreated(payment: any) {
  console.log('Payment received:', payment.id);

  // Send receipt via email
  const bill = await lastAppService.getBill(payment.bill_id);
  await sendReceipt(bill, payment);

  // Update accounting system
  await syncToAccounting(payment);
}

async function handleReservationCreated(reservation: any) {
  console.log('New reservation:', reservation.id);

  // Send confirmation email
  await sendConfirmationEmail(reservation);

  // Send SMS reminder (schedule for 24h before)
  await scheduleReminder(reservation);

  // Sync to external calendar
  await syncToCalendar(reservation);
}

async function handleCustomerCreated(customer: any) {
  console.log('New customer:', customer.id);

  // Sync to CRM
  await syncToCRM(customer);

  // Send welcome email with promo code
  await sendWelcomeEmail(customer);
}

async function handleCatalogUpdated(catalog: any) {
  console.log('Catalog updated:', catalog.id);

  // Invalidate cache
  await clearCatalogCache(catalog.id);

  // Notify frontends to refresh
  await notifyClients('catalog_update', catalog);
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

---

## Best Practices

### 1. Respond Quickly
Webhooks must respond within 5 seconds. Process heavy tasks asynchronously:

```typescript
app.post('/webhooks/lastapp', async (req, res) => {
  // Acknowledge immediately
  res.sendStatus(200);

  // Process asynchronously
  processWebhookAsync(req.body).catch(console.error);
});

async function processWebhookAsync(payload: WebhookPayload) {
  // Heavy processing here
  await updateDatabase(payload);
  await sendNotifications(payload);
}
```

### 2. Validate Signatures
Always validate webhook signatures to ensure authenticity:

```typescript
const isValid = validateSignature(
  req.body,
  req.headers['x-lastapp-signature'],
  process.env.WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).send('Invalid signature');
}
```

### 3. Handle Idempotency
Same event might be sent multiple times. Use idempotency keys:

```typescript
const processedEvents = new Set();

async function handleEvent(event: WebhookPayload) {
  const eventId = `${event.event}-${event.data.id}-${event.timestamp}`;

  if (processedEvents.has(eventId)) {
    console.log('Duplicate event, skipping');
    return;
  }

  processedEvents.add(eventId);

  // Process event
  await processEvent(event);

  // Cleanup old entries (after 24h)
  setTimeout(() => processedEvents.delete(eventId), 86400000);
}
```

### 4. Log Everything
Log all webhook events for debugging and auditing:

```typescript
await db.webhookLogs.create({
  event: payload.event,
  received_at: new Date(),
  payload: payload,
  processed: true
});
```

### 5. Error Handling
Implement proper error handling and retries:

```typescript
try {
  await handleEvent(payload);
} catch (error) {
  console.error('Error processing webhook:', error);

  // Log error
  await logWebhookError(payload, error);

  // Retry with exponential backoff
  await retryWithBackoff(() => handleEvent(payload), 3);
}
```

### 6. Use HTTPS
Webhook URLs must use HTTPS in production:

```
✅ https://your-app.com/webhooks/lastapp
❌ http://your-app.com/webhooks/lastapp
```

### 7. Monitor Webhook Health
Track webhook delivery success/failure rates:

```typescript
const webhookMetrics = {
  received: 0,
  processed: 0,
  failed: 0
};

// Monitor in dashboard
console.log('Webhook health:', {
  success_rate: (webhookMetrics.processed / webhookMetrics.received) * 100,
  failure_rate: (webhookMetrics.failed / webhookMetrics.received) * 100
});
```

---

## Testing Webhooks

### Development with ngrok

```bash
# Start ngrok tunnel
ngrok http 3000

# Use ngrok URL in Developer Portal
https://abc123.ngrok.io/api/webhooks/lastapp
```

### Manual Testing

```bash
# Send test webhook
curl -X POST https://your-app.com/webhooks/lastapp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "event": "tab:created",
    "timestamp": "2026-01-15T14:30:00Z",
    "organization_id": "org_abc123",
    "location_id": "loc_xyz789",
    "data": {
      "id": "tab_test123",
      "status": "KITCHEN"
    }
  }'
```

---

## Real-time UI Updates

### Using Server-Sent Events (SSE)

```typescript
// Server
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Store connection
  clients.add({ res, sendEvent });

  req.on('close', () => {
    clients.delete({ res, sendEvent });
  });
});

// When webhook received
app.post('/webhooks/lastapp', (req, res) => {
  res.sendStatus(200);

  // Broadcast to all connected clients
  clients.forEach(client => {
    client.sendEvent(req.body.event, req.body.data);
  });
});

// Client
const eventSource = new EventSource('/events');

eventSource.addEventListener('tab:created', (e) => {
  const tab = JSON.parse(e.data);
  addTabToUI(tab);
});

eventSource.addEventListener('payment:created', (e) => {
  const payment = JSON.parse(e.data);
  updatePaymentStatus(payment);
});
```

---

## Unregister Webhook

**DELETE** `/webhooks/{id}`

Remove webhook subscription.

---

## Troubleshooting

### Webhook Not Received

1. Check URL is accessible (public HTTPS)
2. Verify webhook is registered in Developer Portal
3. Check server logs for errors
4. Test with manual curl request
5. Ensure firewall allows Last.app IPs

### Signature Validation Failing

1. Verify secret matches Developer Portal
2. Check payload isn't being modified
3. Ensure using correct hashing algorithm (SHA-256)
4. Log both expected and received signatures

### Timeouts

1. Respond within 5 seconds
2. Process heavy tasks asynchronously
3. Optimize database queries
4. Use queue system for long operations

---

## Security Checklist

- ✅ HTTPS only (no HTTP)
- ✅ Signature validation enabled
- ✅ Secret stored securely (environment variable)
- ✅ Input validation on all webhook data
- ✅ Rate limiting on webhook endpoint
- ✅ Logging enabled for audit trail
- ✅ Error handling prevents information leakage
- ✅ Idempotency handling implemented

## Related Documentation

- [Authentication](./02-authentication.md) - Webhook authentication
- [All Endpoints](./01-overview.md) - Events correspond to API actions
