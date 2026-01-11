# Tabs & Orders

## Overview

Tabs (also called Orders) represent customer orders in Last.app. A Tab can be for dine-in, delivery, or takeaway, and tracks products, payments, and order status through its lifecycle.

## Tab Lifecycle States

```
KITCHEN          Initial state when order is created
    ↓
READY_TO_PICKUP  Food is ready
    ↓
ON_DELIVERY      Out for delivery (delivery orders only)
    ↓
DELIVERED        Arrived at customer (delivery orders only)
    ↓
CLOSED           Order completed and paid
```

## Base Endpoint

```
/tabs
```

**Required Header**: `LocationID`

## Endpoints

### 1. Create Tab

**POST** `/tabs`

Create a new order/tab.

**Request Body:**
```typescript
interface CreateTabRequest {
  location_id: string;
  table_number?: number | string;  // For dine-in
  customer_id?: string;
  customer_name?: string;          // If no customer_id
  customer_phone?: string;
  order_type: 'dine_in' | 'delivery' | 'takeaway';
  delivery_address?: string;       // Required for delivery
  notes?: string;
}
```

**Example:**
```typescript
const tab = await lastAppService.createTab({
  location_id: 'loc_abc123',
  table_number: 5,
  customer_name: 'María García',
  customer_phone: '+34612345678',
  order_type: 'dine_in',
  notes: 'Sin cebolla'
});
```

**Response:**
```typescript
interface LastAppTab {
  id: string;
  location_id: string;
  table_number?: number | string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type: 'dine_in' | 'delivery' | 'takeaway';
  status: 'KITCHEN' | 'READY_TO_PICKUP' | 'ON_DELIVERY' | 'DELIVERED' | 'CLOSED';
  products: TabProduct[];
  subtotal: number;
  tax: number;
  total: number;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

---

### 2. Get Tabs (List)

**GET** `/tabs`

List tabs with pagination and filters.

**Query Parameters:**
```typescript
interface GetTabsParams {
  location_id?: string;
  start_date?: string;     // YYYY-MM-DD
  end_date?: string;       // YYYY-MM-DD (max 365 days from start)
  status?: TabStatus[];
  order_type?: 'dine_in' | 'delivery' | 'takeaway';
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
}
```

**Example:**
```typescript
const tabs = await lastAppService.getTabs({
  location_id: 'loc_abc123',
  start_date: '2026-01-01',
  end_date: '2026-01-31',
  status: ['KITCHEN', 'READY_TO_PICKUP'],
  limit: 50
});
```

**Response:**
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

// Returns PaginatedResponse<LastAppTab>
```

---

### 3. Get Single Tab

**GET** `/tabs/{id}`

Get detailed information about a specific tab.

**Example:**
```typescript
const tab = await lastAppService.getTab('tab_xyz789');
```

---

### 4. Add Products to Tab

**POST** `/tabs/{id}/products`

Add products to an existing tab.

**Request Body:**
```typescript
interface TabProduct {
  product_id: string;
  quantity: number;
  modifiers?: TabModifier[];
  notes?: string;
}

interface TabModifier {
  modifier_id: string;
  quantity?: number;
}
```

**Example:**
```typescript
await lastAppService.addProductsToTab('tab_xyz789', [
  {
    product_id: 'prod_burger01',
    quantity: 2,
    modifiers: [
      { modifier_id: 'mod_cheese', quantity: 2 },
      { modifier_id: 'mod_bacon', quantity: 1 }
    ],
    notes: 'Sin tomate'
  },
  {
    product_id: 'prod_fries01',
    quantity: 2
  }
]);
```

**Response:**
```typescript
{
  success: true,
  tab: LastAppTab  // Updated tab with new products
}
```

---

### 5. Get Pending Products

**GET** `/tabs/{id}/pending-products`

Get products that haven't been billed yet (allows partial billing).

**Example:**
```typescript
const pendingProducts = await lastAppService.getPendingProducts('tab_xyz789');
```

**Response:**
```typescript
{
  pending_products: [
    {
      product_id: 'prod_burger01',
      name: 'Burger',
      quantity: 2,
      unit_price: 12.50,
      modifiers: [...],
      subtotal: 25.00
    }
  ],
  pending_total: 25.00
}
```

---

### 6. Delete Tab (Cancel)

**DELETE** `/tabs/{id}`

Cancel/delete a tab.

**Example:**
```typescript
await lastAppService.deleteTab('tab_xyz789');
```

**Response:**
```typescript
{
  success: true,
  message: 'Tab cancelled successfully'
}
```

**Note**: Only tabs in certain states can be cancelled (check business rules).

---

## Order Status Management

**GET** `/orders/{tabId}/status`

Get current order status.

**Example:**
```typescript
const status = await lastAppService.getOrderStatus('tab_xyz789');
```

**Response:**
```typescript
{
  tab_id: 'tab_xyz789',
  status: 'KITCHEN',
  updated_at: '2026-01-15T14:30:00Z',
  estimated_ready_time?: '2026-01-15T14:45:00Z'
}
```

---

**PUT** `/orders/{tabId}/status`

Update order status (move through lifecycle).

**Request Body:**
```typescript
interface UpdateOrderStatusRequest {
  status: 'KITCHEN' | 'READY_TO_PICKUP' | 'ON_DELIVERY' | 'DELIVERED' | 'CLOSED';
  estimated_ready_time?: string;  // ISO 8601
  notes?: string;
}
```

**Example:**
```typescript
await lastAppService.updateOrderStatus('tab_xyz789', {
  status: 'READY_TO_PICKUP',
  estimated_ready_time: '2026-01-15T14:45:00Z'
});
```

---

**POST** `/orders/{tabId}/cancel`

Cancel order with reason.

**Request Body:**
```typescript
interface CancelOrderRequest {
  reason: string;
  refund_amount?: number;
}
```

**Example:**
```typescript
await lastAppService.cancelOrder('tab_xyz789', {
  reason: 'Customer requested cancellation',
  refund_amount: 25.50
});
```

---

## Complete Implementation

```typescript
export class LastAppService {
  async createTab(data: CreateTabRequest): Promise<LastAppTab> {
    return this.makeRequest<LastAppTab>(
      '/tabs',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      'location'
    );
  }

  async getTabs(params: GetTabsParams): Promise<PaginatedResponse<LastAppTab>> {
    const query = new URLSearchParams();

    if (params.location_id) query.append('location_id', params.location_id);
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    if (params.status) query.append('status', params.status.join(','));
    if (params.order_type) query.append('order_type', params.order_type);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return this.makeRequest<PaginatedResponse<LastAppTab>>(
      `/tabs?${query}`,
      {},
      'location'
    );
  }

  async getTab(id: string): Promise<LastAppTab> {
    return this.makeRequest<LastAppTab>(
      `/tabs/${id}`,
      {},
      'location'
    );
  }

  async addProductsToTab(tabId: string, products: TabProduct[]): Promise<LastAppTab> {
    const response = await this.makeRequest<{ tab: LastAppTab }>(
      `/tabs/${tabId}/products`,
      {
        method: 'POST',
        body: JSON.stringify({ products })
      },
      'location'
    );
    return response.tab;
  }

  async getPendingProducts(tabId: string): Promise<{
    pending_products: any[];
    pending_total: number;
  }> {
    return this.makeRequest(
      `/tabs/${tabId}/pending-products`,
      {},
      'location'
    );
  }

  async deleteTab(id: string): Promise<void> {
    await this.makeRequest(
      `/tabs/${id}`,
      { method: 'DELETE' },
      'location'
    );
  }

  async getOrderStatus(tabId: string): Promise<OrderStatus> {
    return this.makeRequest<OrderStatus>(
      `/orders/${tabId}/status`,
      {},
      'location'
    );
  }

  async updateOrderStatus(tabId: string, data: UpdateOrderStatusRequest): Promise<void> {
    await this.makeRequest(
      `/orders/${tabId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      },
      'location'
    );
  }

  async cancelOrder(tabId: string, data: CancelOrderRequest): Promise<void> {
    await this.makeRequest(
      `/orders/${tabId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      'location'
    );
  }
}
```

## UI Example: Tab Management

```typescript
function TabCard({ tab }: { tab: LastAppTab }) {
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: TabStatus) => {
    try {
      await lastAppService.updateOrderStatus(tab.id, { status: newStatus });
      toast({ title: 'Estado actualizado' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {tab.order_type === 'dine_in' ? `Mesa ${tab.table_number}` : `#${tab.id}`}
        </CardTitle>
        <Badge>{tab.status}</Badge>
      </CardHeader>
      <CardContent>
        <p>Cliente: {tab.customer_name}</p>
        <p>Total: €{tab.total.toFixed(2)}</p>
        <div>
          {tab.products.map(product => (
            <div key={product.product_id}>
              {product.quantity}x {product.name}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        {tab.status === 'KITCHEN' && (
          <Button onClick={() => handleStatusUpdate('READY_TO_PICKUP')}>
            Marcar Listo
          </Button>
        )}
        {tab.status === 'READY_TO_PICKUP' && tab.order_type === 'delivery' && (
          <Button onClick={() => handleStatusUpdate('ON_DELIVERY')}>
            En Camino
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

## Webhooks

```typescript
await lastAppService.registerWebhook(
  'https://your-app.com/webhooks/lastapp',
  ['tab:created', 'tab:updated', 'tab:closed']
);
```

## Best Practices

1. **Track status changes** in real-time with webhooks
2. **Use pending products** for partial billing
3. **Always validate** product IDs before adding
4. **Handle concurrent updates** (multiple waiters updating same tab)
5. **Show estimated times** to customers
6. **Allow cancellation** only in early states
7. **Log all changes** for audit trail
8. **Group similar products** in UI for clarity
9. **Support splitting** tabs for groups
10. **Archive old tabs** after 90 days

## Related Documentation

- [Bills & Payments](./08-bills-payments.md) - Create bills from tabs
- [Catalogs & Products](./06-catalogs-products.md) - Product catalog
- [Webhooks](./12-webhooks.md) - Real-time order updates
