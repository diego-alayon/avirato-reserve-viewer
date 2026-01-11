# Last.app API v2.0.0 - Overview

## Introduction

Last.app API v2.0.0 provides comprehensive point-of-sale (POS) and reservation management for restaurants and hospitality businesses. The API follows REST principles and uses JSON for request and response payloads.

## Base URL

```
https://api.last.shop
```

## API Version

**Current Version**: v2.0.0

### Changes from V1 to V2

**Major Change - Token Scope:**
- **V1**: One token per organization (integrators needed multiple tokens)
- **V2**: One token covers ALL organizations for an integrator

This simplifies authentication but requires proper use of `OrganizationID` and `LocationID` headers.

## Architecture Hierarchy

Last.app uses a hierarchical structure:

```
Organization (Your business entity)
  │
  ├── Location 1 (Physical location - Restaurant, Hotel, etc.)
  │   ├── Brand A
  │   │   ├── Catalog: default
  │   │   ├── Catalog: justeat
  │   │   ├── Catalog: glovo
  │   │   └── Catalog: shop (delivery/takeaway/onsite)
  │   └── Brand B
  │       └── Catalogs...
  │
  └── Location 2
      └── Brands...
```

### Key Concepts

- **Organization**: The top-level entity representing your business
- **Location**: A physical place (restaurant, hotel, venue)
- **Brand**: A distinct brand or concept within a location
- **Catalog**: Product catalog (can vary by channel: delivery, onsite, third-party)
- **Tab**: An order or table session
- **Reservation**: A booking for a specific date/time

## API Features

### Core Functionality

1. **Order Management (Tabs)**
   - Create and manage orders
   - Add products with modifiers
   - Track order states (Kitchen → Delivery → Completed)
   - Support for dine-in, delivery, and takeaway

2. **Reservation System**
   - Check real-time availability
   - Create and manage reservations
   - Configure schedules and capacity
   - Customer notification support

3. **Billing & Payments**
   - Generate bills from tabs
   - Record payments (cash, card, transfer)
   - Payment request handling
   - Multi-payment support

4. **Catalog Management**
   - Products with pricing
   - Modifiers and combos
   - Multi-channel catalogs
   - Real-time availability updates

5. **Customer Management**
   - Customer profiles
   - Loyalty points system
   - Bulk customer creation
   - External customer integration

6. **Promotions**
   - Percentage/fixed discounts
   - 2x1 offers
   - Product bundles
   - Time-based and usage-limited promos

7. **Real-time Sync (Webhooks)**
   - Event-driven updates
   - Real-time inventory sync
   - Order status notifications
   - Payment confirmations

## Endpoint Categories

### Public Endpoints

These endpoints are available to all authenticated integrators:

- `/organizations` - List your organizations
- `/locations` - List and manage locations
- `/catalogs` - Product catalogs
- `/tabs` - Orders and tabs
- `/bills` - Invoicing
- `/payments` - Payment processing
- `/reservations` - Booking management
- `/customers` - Customer data
- `/promotions` - Promotional offers
- `/webhooks` - Event subscriptions
- `/terminals` - Payment terminals

### Response Formats

**List endpoints** return simplified schemas:
```json
{
  "data": [
    { "id": "123", "name": "Location 1" }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**Detail endpoints** return complete schemas:
```json
{
  "id": "123",
  "name": "Location 1",
  "brands": [...],
  "catalogs": [...],
  "settings": {...}
}
```

## Getting Started

### Prerequisites

1. **Register as integrator** at https://developers.last.app
2. **Get your Bearer token** from the Developer Portal
3. **Create a test organization** with dummy data
4. **Choose your LocationID** or OrganizationID for requests

### Quick Start

```typescript
// 1. Set up authentication
const headers = {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'LocationID': 'your_location_id',
  'Content-Type': 'application/json'
};

// 2. List your organizations
const orgsResponse = await fetch('https://api.last.shop/organizations', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
});
const organizations = await orgsResponse.json();

// 3. Get locations for an organization
const locsResponse = await fetch('https://api.last.shop/locations', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'OrganizationID': organizations.data[0].id
  }
});
const locations = await locsResponse.json();

// 4. Create a reservation
const reservation = await fetch('https://api.last.shop/reservations', {
  method: 'POST',
  headers: {
    ...headers,
    'LocationID': locations.data[0].id
  },
  body: JSON.stringify({
    date: '2026-01-15',
    time: '19:00',
    party_size: 4
  })
});
```

## Developer Resources

### Developer Portal
**URL**: https://developers.last.app

Features:
- Create test organizations
- Generate API tokens
- View API logs
- Test webhooks
- Access documentation

### Integration Status

Integrators can have three statuses:
1. **Test** - Development and testing phase
2. **Pending** - Submitted for review
3. **Production** - Approved for live use

### Support

- **API Support**: support@last.app
- **Integration Questions**: integrations@last.app
- **Documentation**: https://developers.last.app/docs

## Best Practices

1. **Always implement rate limiting** (1500 req/10min, 15 req/sec)
2. **Use webhooks for real-time sync** instead of polling
3. **Handle pagination properly** (max 365-day ranges)
4. **Store tokens securely** (never hardcode in client-side code)
5. **Implement proper error handling** for all HTTP status codes
6. **Use TypeScript** for type safety
7. **Test with dummy organization** before going to production
8. **Log all API interactions** for debugging

## Next Steps

1. Read [Authentication](./02-authentication.md) to set up secure API access
2. Understand [Rate Limits](./03-rate-limits.md) to avoid throttling
3. Explore [Reservations](./09-reservations.md) for booking functionality
4. Review [Tabs & Orders](./07-tabs-orders.md) for order management
5. Set up [Webhooks](./12-webhooks.md) for real-time updates

## Version History

### v2.0.0 (Current)
- Single token for all organizations
- Enhanced webhook events
- External customer support
- Improved pagination
- Better error responses

### v1.0.0 (Legacy)
- One token per organization
- Basic webhook support
- See https://developers.last.app/old-docs for V1 documentation
