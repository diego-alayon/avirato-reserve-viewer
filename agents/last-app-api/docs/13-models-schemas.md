# Models & Schemas

## Overview

Complete TypeScript interfaces for all Last.app API v2.0.0 data models.

---

## Core Types

### Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

---

## Organization & Location

### Organization

```typescript
interface LastAppOrganization {
  id: string;
  name: string;
  logo_url?: string;
  timezone: string;          // e.g., "Europe/Madrid"
  currency: string;           // e.g., "EUR"
  locale: string;             // e.g., "es_ES"
  settings?: {
    tax_rate: number;
    default_payment_methods: string[];
    loyalty_enabled: boolean;
    notifications_enabled: boolean;
  };
  created_at: string;
  updated_at?: string;
}
```

### Location

```typescript
interface LastAppLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email?: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  brands?: LastAppBrand[];
  settings?: {
    accepts_reservations: boolean;
    accepts_delivery: boolean;
    accepts_takeaway: boolean;
    min_delivery_amount?: number;
    delivery_fee?: number;
    tax_rate: number;
  };
  hours?: {
    [day: string]: {
      open: string;   // HH:MM
      close: string;  // HH:MM
    };
  };
}
```

### Brand

```typescript
interface LastAppBrand {
  id: string;
  name: string;
  catalogs: LastAppCatalog[];
}
```

---

## Catalog & Products

### Catalog

```typescript
interface LastAppCatalog {
  id: string;
  name: string;
  type: 'default' | 'delivery' | 'takeaway' | 'justeat' | 'glovo' | 'shop';
  brand_id: string;
  brand_name?: string;
  active: boolean;
  products_count?: number;  // In simplified schema
  products?: LastAppProduct[];  // In complete schema
  combos?: LastAppCombo[];      // In complete schema
}
```

### Product

```typescript
interface LastAppProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
  modifiers?: LastAppModifier[];
  modifier_groups?: LastAppModifierGroup[];
  tax_rate?: number;
  calories?: number;
  allergens?: string[];
}
```

### Modifier

```typescript
interface LastAppModifier {
  id: string;
  name: string;
  price: number;  // Additional cost (can be 0)
}
```

### Modifier Group

```typescript
interface LastAppModifierGroup {
  id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  modifiers: LastAppModifier[];
}
```

### Combo

```typescript
interface LastAppCombo {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available: boolean;
  categories: LastAppComboCategory[];
}

interface LastAppComboCategory {
  name: string;
  min_selections: number;
  max_selections: number;
  products: string[];  // Product IDs
}
```

---

## Tabs & Orders

### Tab

```typescript
type TabStatus = 'KITCHEN' | 'READY_TO_PICKUP' | 'ON_DELIVERY' | 'DELIVERED' | 'CLOSED';

interface LastAppTab {
  id: string;
  location_id: string;
  table_number?: number | string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: 'dine_in' | 'delivery' | 'takeaway';
  status: TabStatus;
  products: TabProduct[];
  subtotal: number;
  tax: number;
  discount_amount?: number;
  total: number;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_ready_time?: string;
}
```

### Tab Product

```typescript
interface TabProduct {
  product_id: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  modifiers?: TabModifier[];
  notes?: string;
  subtotal?: number;
}

interface TabModifier {
  modifier_id: string;
  name?: string;
  quantity?: number;
  price?: number;
}
```

---

## Bills & Payments

### Bill

```typescript
interface LastAppBill {
  id: string;
  tab_id: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  status: 'pending' | 'partial' | 'paid';
  products: BillProduct[];
  created_at: string;
  due_date?: string;
}

interface BillProduct {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
```

### Payment

```typescript
interface LastAppPayment {
  id: string;
  bill_id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  reference?: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}
```

---

## Reservations

### Reservation

```typescript
interface LastAppReservation {
  id: string;
  location_id: string;
  date: string;              // YYYY-MM-DD
  time: string;              // HH:MM
  party_size: number;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  table_number?: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}
```

### Availability Slot

```typescript
interface AvailabilitySlot {
  time: string;              // HH:MM
  available: boolean;
  available_tables: number;
  max_party_size: number;
}

interface AvailableDay {
  date: string;              // YYYY-MM-DD
  has_availability: boolean;
  available_slots: number;
}
```

### Reservation Schedule

```typescript
interface ReservationSchedule {
  id: string;
  location_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday
  open_time: string;         // HH:MM
  close_time: string;        // HH:MM
  slot_duration: number;     // Minutes
  max_capacity: number;
  enabled: boolean;
}
```

---

## Customers

### Customer

```typescript
interface LastAppCustomer {
  id: string;
  name: string;
  phone: string;             // Unique identifier
  email?: string;
  birthdate?: string;        // YYYY-MM-DD
  address?: string;
  city?: string;
  postal_code?: string;
  loyalty_points: number;
  total_spent: number;
  visit_count: number;
  tags?: string[];
  notes?: string;
  created_at: string;
  last_visit?: string;
}
```

### Customer Points

```typescript
interface CustomerPoints {
  customer_id: string;
  points: number;
  points_pending: number;
  points_history: PointsHistoryEntry[];
}

interface PointsHistoryEntry {
  date: string;
  points: number;
  reason: string;
  transaction_id?: string;
}
```

---

## Promotions

### Promotion

```typescript
interface LastAppPromotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'currency' | '2x1' | 'products';
  value?: number;
  product_ids?: string[];
  code?: string;
  min_expense?: number;
  max_redemptions?: number;
  current_redemptions?: number;
  start_date?: string;       // YYYY-MM-DD
  end_date?: string;         // YYYY-MM-DD
  applies_to: 'all' | 'specific';
  entity_ids?: string[];
  active: boolean;
  created_at: string;
}
```

---

## Webhooks

### Webhook Event

```typescript
type WebhookEvent =
  | 'tab:created'
  | 'tab:updated'
  | 'tab:closed'
  | 'bill:created'
  | 'payment:created'
  | 'payment_request:created'
  | 'reservation:created'
  | 'reservation:updated'
  | 'reservation:cancelled'
  | 'customer:created'
  | 'customer:updated'
  | 'catalog:updated'
  | 'product:updated'
  | 'location:integrated'
  | 'floorplan:updated';
```

### Webhook Payload

```typescript
interface WebhookPayload<T = any> {
  event: WebhookEvent;
  timestamp: string;         // ISO 8601
  data: T;
  organization_id: string;
  location_id?: string;
}
```

---

## Request Types

### Create Requests

```typescript
interface CreateTabRequest {
  location_id: string;
  table_number?: number | string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: 'dine_in' | 'delivery' | 'takeaway';
  delivery_address?: string;
  notes?: string;
}

interface CreateReservationRequest {
  location_id: string;
  date: string;              // YYYY-MM-DD
  time: string;              // HH:MM
  party_size: number;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  duration_minutes?: number;
}

interface CreateBillRequest {
  tab_id: string;
  products?: string[];
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
}

interface CreatePaymentRequest {
  bill_id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  reference?: string;
  notes?: string;
}

interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  birthdate?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  tags?: string[];
}

interface CreatePromotionRequest {
  name: string;
  description?: string;
  type: 'percentage' | 'currency' | '2x1' | 'products';
  value?: number;
  product_ids?: string[];
  code?: string;
  min_expense?: number;
  max_redemptions?: number;
  start_date?: string;
  end_date?: string;
  applies_to: 'all' | 'specific';
  entity_ids?: string[];
  active: boolean;
}
```

### Query Params

```typescript
interface GetTabsParams {
  location_id?: string;
  start_date?: string;
  end_date?: string;
  status?: TabStatus[];
  order_type?: 'dine_in' | 'delivery' | 'takeaway';
  page?: number;
  limit?: number;
}

interface GetBillsParams {
  location_id?: string;
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'partial' | 'paid';
  page?: number;
  limit?: number;
}

interface GetCustomersParams {
  organization_id?: string;
  search?: string;
  tags?: string[];
  min_points?: number;
  max_points?: number;
  min_spent?: number;
  max_spent?: number;
  page?: number;
  limit?: number;
}

interface DayAvailabilityParams {
  location_id: string;
  date: string;
  party_size: number;
}

interface MonthAvailabilityParams {
  location_id: string;
  year: number;
  month: number;
  party_size?: number;
}
```

---

## Error Response

```typescript
interface ApiError {
  error: string;
  message: string;
  status_code: number;
  details?: any;
}
```

---

## Usage

Import these types in your project:

```typescript
import type {
  LastAppOrganization,
  LastAppLocation,
  LastAppTab,
  LastAppReservation,
  LastAppCustomer,
  LastAppPromotion,
  PaginatedResponse,
  WebhookPayload
} from './types/lastapp.types';

// Use in service
async getOrganizations(): Promise<LastAppOrganization[]> {
  const response = await this.makeRequest<{ data: LastAppOrganization[] }>(
    '/organizations'
  );
  return response.data;
}

// Use in components
function TabsList({ tabs }: { tabs: LastAppTab[] }) {
  // ...
}
```

---

## Related Documentation

All interfaces correspond to endpoints documented in their respective sections:
- [Organizations](./04-organizations.md)
- [Locations](./05-locations.md)
- [Catalogs & Products](./06-catalogs-products.md)
- [Tabs & Orders](./07-tabs-orders.md)
- [Bills & Payments](./08-bills-payments.md)
- [Reservations](./09-reservations.md)
- [Customers](./10-customers.md)
- [Promotions](./11-promotions.md)
- [Webhooks](./12-webhooks.md)
