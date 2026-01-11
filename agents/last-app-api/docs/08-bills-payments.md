# Bills & Payments

## Overview

Bills are created from Tabs and represent invoices. Payments are recorded against bills and can be split across multiple payment methods.

## Bills

### Create Bill

**POST** `/bills`

Create a bill from a tab (invoice the order).

**Request Body:**
```typescript
interface CreateBillRequest {
  tab_id: string;
  products?: string[];  // Optional: specific product IDs (for partial billing)
  discount_amount?: number;
  discount_percentage?: number;
  notes?: string;
}
```

**Example:**
```typescript
// Bill entire tab
const bill = await lastAppService.createBill('tab_xyz789');

// Partial bill (specific products)
const partialBill = await lastAppService.createBill({
  tab_id: 'tab_xyz789',
  products: ['prod_1', 'prod_2'],
  discount_percentage: 10,
  notes: 'Descuento grupo'
});
```

**Response:**
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
```

---

### List Bills

**GET** `/bills`

Get paginated list of bills.

**Query Parameters:**
```typescript
interface GetBillsParams {
  location_id?: string;
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'partial' | 'paid';
  page?: number;
  limit?: number;
}
```

**Example:**
```typescript
const bills = await lastAppService.getBills({
  location_id: 'loc_abc123',
  start_date: '2026-01-01',
  end_date: '2026-01-31',
  status: 'pending',
  limit: 50
});
```

---

## Payments

### Create Payment

**POST** `/payments`

Record a payment against a bill.

**Request Body:**
```typescript
interface CreatePaymentRequest {
  bill_id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  reference?: string;  // Transaction reference
  notes?: string;
}
```

**Example:**
```typescript
// Full payment
const payment = await lastAppService.createPayment({
  bill_id: 'bill_abc123',
  amount: 45.50,
  method: 'card',
  reference: 'TXN_123456789'
});

// Split payment (cash + card)
await lastAppService.createPayment({
  bill_id: 'bill_abc123',
  amount: 20.00,
  method: 'cash'
});

await lastAppService.createPayment({
  bill_id: 'bill_abc123',
  amount: 25.50,
  method: 'card',
  reference: 'TXN_987654321'
});
```

**Response:**
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

### Resolve Payment Request

**PUT** `/payments/{id}/request`

Resolve a payment request (when customer requests payment link).

**Example:**
```typescript
await lastAppService.resolvePaymentRequest('payment_req_123');
```

---

## Complete Implementation

```typescript
export class LastAppService {
  async createBill(data: string | CreateBillRequest): Promise<LastAppBill> {
    const requestData = typeof data === 'string'
      ? { tab_id: data }
      : data;

    return this.makeRequest<LastAppBill>(
      '/bills',
      {
        method: 'POST',
        body: JSON.stringify(requestData)
      },
      'location'
    );
  }

  async getBills(params: GetBillsParams): Promise<PaginatedResponse<LastAppBill>> {
    const query = new URLSearchParams();

    if (params.location_id) query.append('location_id', params.location_id);
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return this.makeRequest<PaginatedResponse<LastAppBill>>(
      `/bills?${query}`,
      {},
      'location'
    );
  }

  async createPayment(data: CreatePaymentRequest): Promise<LastAppPayment> {
    return this.makeRequest<LastAppPayment>(
      '/payments',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      'location'
    );
  }

  async resolvePaymentRequest(paymentRequestId: string): Promise<void> {
    await this.makeRequest(
      `/payments/${paymentRequestId}/request`,
      { method: 'PUT' },
      'location'
    );
  }
}
```

## UI Example: Payment Modal

```typescript
function PaymentModal({ bill }: { bill: LastAppBill }) {
  const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('card');
  const [amount, setAmount] = useState(bill.total);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      await lastAppService.createPayment({
        bill_id: bill.id,
        amount,
        method
      });

      toast({
        title: 'Pago procesado',
        description: `€${amount.toFixed(2)} pagado con ${method}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
        </DialogHeader>

        <div>
          <label>Total a pagar: €{bill.total.toFixed(2)}</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            step="0.01"
            max={bill.total}
          />
        </div>

        <div>
          <label>Método de pago:</label>
          <select value={method} onChange={(e) => setMethod(e.target.value as any)}>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>

        <Button onClick={handlePayment}>
          Procesar Pago
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

## Webhooks

```typescript
await lastAppService.registerWebhook(
  'https://your-app.com/webhooks/lastapp',
  ['bill:created', 'payment:created', 'payment_request:created']
);
```

## Best Practices

1. **Validate amounts** before processing
2. **Support split payments** for group orders
3. **Store transaction references** for reconciliation
4. **Send receipts** via email automatically
5. **Handle failed payments** gracefully
6. **Track payment methods** for reporting
7. **Allow partial payments** when needed
8. **Reconcile daily** with POS records

## Related Documentation

- [Tabs & Orders](./07-tabs-orders.md) - Create tabs before billing
- [Webhooks](./12-webhooks.md) - Real-time payment notifications
