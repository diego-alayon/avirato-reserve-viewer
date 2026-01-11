# Customers

## Overview

Manage customer profiles, loyalty points, and bulk customer imports.

## Endpoints

### Create Customer

**POST** `/customers`

Create a single customer.

**Request Body:**
```typescript
interface CreateCustomerRequest {
  name: string;
  phone: string;          // Required, unique
  email?: string;
  birthdate?: string;     // YYYY-MM-DD
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  tags?: string[];
}
```

**Example:**
```typescript
const customer = await lastAppService.createCustomer({
  name: 'John Doe',
  phone: '+34612345678',
  email: 'john@example.com',
  birthdate: '1990-05-15',
  tags: ['vip', 'allergies:nuts']
});
```

**Response:**
```typescript
interface LastAppCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthdate?: string;
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

---

### Create Bulk Customers

**POST** `/customers/bulk`

Create multiple customers at once.

**Important**: Response only validates data format, doesn't return IDs. Use webhooks to map external IDs to Last.app IDs.

**Request Body:**
```typescript
{
  customers: CreateCustomerRequest[]
}
```

**Example:**
```typescript
await lastAppService.createCustomersBulk([
  {
    name: 'Customer 1',
    phone: '+34611111111',
    email: 'customer1@example.com'
  },
  {
    name: 'Customer 2',
    phone: '+34622222222',
    email: 'customer2@example.com'
  }
]);
```

**Response:**
```typescript
{
  success: true,
  validated: 2,  // Number of valid entries
  errors: []     // Validation errors if any
}
```

---

### List Customers

**GET** `/customers`

Get paginated customer list with filters.

**Query Parameters:**
```typescript
interface GetCustomersParams {
  organization_id?: string;
  search?: string;         // Search by name, phone, email
  tags?: string[];
  min_points?: number;
  max_points?: number;
  min_spent?: number;
  max_spent?: number;
  page?: number;
  limit?: number;
}
```

**Example:**
```typescript
// Search customers
const customers = await lastAppService.getCustomers({
  organization_id: 'org_abc123',
  search: 'john',
  limit: 50
});

// VIP customers (high spenders)
const vips = await lastAppService.getCustomers({
  organization_id: 'org_abc123',
  min_spent: 1000,
  tags: ['vip']
});
```

---

### Get Customer Points

**GET** `/customers/points`

Get loyalty points for customers.

**Query Parameters:**
- `customer_id` or `phone`

**Example:**
```typescript
const points = await lastAppService.getCustomerPoints('cust_123');
```

**Response:**
```typescript
{
  customer_id: 'cust_123',
  points: 450,
  points_pending: 50,  // Points not yet confirmed
  points_history: [
    {
      date: '2026-01-15',
      points: 25,
      reason: 'Purchase €50.00',
      transaction_id: 'bill_abc'
    }
  ]
}
```

---

### Update Customer Points

**PUT** `/customers/{id}/update-points`

Manually adjust loyalty points (add or subtract).

**Request Body:**
```typescript
{
  points: number  // Positive to add, negative to subtract
}
```

**Example:**
```typescript
// Add 100 bonus points
await lastAppService.updateCustomerPoints('cust_123', 100);

// Deduct 50 points (redemption)
await lastAppService.updateCustomerPoints('cust_123', -50);
```

---

## Implementation

```typescript
export class LastAppService {
  async createCustomer(data: CreateCustomerRequest): Promise<LastAppCustomer> {
    return this.makeRequest<LastAppCustomer>(
      '/customers',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      'organization'
    );
  }

  async createCustomersBulk(customers: CreateCustomerRequest[]): Promise<void> {
    await this.makeRequest(
      '/customers/bulk',
      {
        method: 'POST',
        body: JSON.stringify({ customers })
      },
      'organization'
    );
  }

  async getCustomers(params: GetCustomersParams): Promise<PaginatedResponse<LastAppCustomer>> {
    const query = new URLSearchParams();

    if (params.organization_id) query.append('organization_id', params.organization_id);
    if (params.search) query.append('search', params.search);
    if (params.tags) query.append('tags', params.tags.join(','));
    if (params.min_points) query.append('min_points', params.min_points.toString());
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return this.makeRequest<PaginatedResponse<LastAppCustomer>>(
      `/customers?${query}`,
      {},
      'organization'
    );
  }

  async getCustomerPoints(customerId: string): Promise<CustomerPoints> {
    return this.makeRequest<CustomerPoints>(
      `/customers/points?customer_id=${customerId}`,
      {},
      'organization'
    );
  }

  async updateCustomerPoints(customerId: string, points: number): Promise<void> {
    await this.makeRequest(
      `/customers/${customerId}/update-points`,
      {
        method: 'PUT',
        body: JSON.stringify({ points })
      },
      'organization'
    );
  }
}
```

## UI Example: Customer Search

```typescript
function CustomerSearch() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<LastAppCustomer[]>([]);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length >= 3) {
      const results = await lastAppService.getCustomers({
        organization_id: currentOrgId,
        search: query,
        limit: 20
      });
      setCustomers(results.data);
    } else {
      setCustomers([]);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar cliente..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div className="results">
        {customers.map(customer => (
          <Card key={customer.id}>
            <h3>{customer.name}</h3>
            <p>📞 {customer.phone}</p>
            {customer.email && <p>✉️ {customer.email}</p>}
            <p>💎 {customer.loyalty_points} puntos</p>
            <p>💰 €{customer.total_spent.toFixed(2)} gastado</p>
            <p>🔄 {customer.visit_count} visitas</p>
            {customer.tags && (
              <div className="tags">
                {customer.tags.map(tag => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Webhooks

```typescript
await lastAppService.registerWebhook(
  'https://your-app.com/webhooks/lastapp',
  ['customer:created', 'customer:updated']
);

// Map bulk customer IDs
app.post('/webhooks/lastapp', (req, res) => {
  const { event, data } = req.body;

  if (event === 'customer:created') {
    // Map external ID to Last.app ID
    mapCustomerId(data.phone, data.id);
  }

  res.sendStatus(200);
});
```

## Best Practices

1. **Unique phone numbers** - Primary identifier
2. **Use bulk import** for initial data migration
3. **Sync with external CRM** via webhooks
4. **Tag customers** for segmentation (VIP, allergies, preferences)
5. **Track loyalty points** accurately
6. **Send birthday offers** using birthdate field
7. **Respect privacy** - handle data according to GDPR
8. **Allow customers** to view/edit their own data

## Related Documentation

- [Reservations](./09-reservations.md) - Link customers to reservations
- [Tabs & Orders](./07-tabs-orders.md) - Link customers to orders
- [Promotions](./11-promotions.md) - Customer-specific promotions
