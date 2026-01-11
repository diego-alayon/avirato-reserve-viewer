# Promotions

## Overview

Create and manage promotional offers with various discount types and restrictions.

## Endpoints

### Create Promotion

**POST** `/promotions`

**Request Body:**
```typescript
interface CreatePromotionRequest {
  name: string;
  description?: string;
  type: 'percentage' | 'currency' | '2x1' | 'products';
  value?: number;              // For percentage (0-100) or currency
  product_ids?: string[];      // For '2x1' or 'products' type
  code?: string;               // Optional promo code
  min_expense?: number;        // Minimum purchase required
  max_redemptions?: number;    // Usage limit
  start_date?: string;         // YYYY-MM-DD
  end_date?: string;           // YYYY-MM-DD
  applies_to: 'all' | 'specific';
  entity_ids?: string[];       // Location/Organization IDs if specific
  active: boolean;
}
```

**Discount Types:**
- **percentage**: Discount percentage (e.g., 10 = 10% off)
- **currency**: Fixed amount off (e.g., 5 = €5 off)
- **2x1**: Buy one get one free on specific products
- **products**: Free specific products

**Example:**
```typescript
// 20% off all orders
const promo1 = await lastAppService.createPromotion({
  name: '20% de descuento',
  type: 'percentage',
  value: 20,
  min_expense: 30,
  applies_to: 'all',
  active: true
});

// €5 off with code
const promo2 = await lastAppService.createPromotion({
  name: 'Descuento Bienvenida',
  type: 'currency',
  value: 5,
  code: 'WELCOME5',
  max_redemptions: 100,
  start_date: '2026-01-01',
  end_date: '2026-01-31',
  applies_to: 'all',
  active: true
});

// 2x1 on burgers
const promo3 = await lastAppService.createPromotion({
  name: '2x1 Burgers',
  type: '2x1',
  product_ids: ['prod_burger01', 'prod_burger02'],
  applies_to: 'specific',
  entity_ids: ['loc_abc123'],
  active: true
});
```

---

### List Promotions

**GET** `/promotions`

**Query Parameters:**
- `location_id` or `organization_id`
- `active` (boolean)
- `type`

**Example:**
```typescript
const promotions = await lastAppService.getPromotions();
```

---

### Update Promotion

**PUT** `/promotions/{id}`

Update existing promotion.

**Example:**
```typescript
await lastAppService.updatePromotion('promo_123', {
  active: false  // Disable promotion
});
```

---

### Patch Promotion Entities

**PATCH** `/promotions/{id}`

Add or remove specific entities from promotion.

**Request Body:**
```typescript
{
  add_entities?: string[];     // Entity IDs to add
  remove_entities?: string[];  // Entity IDs to remove
}
```

**Example:**
```typescript
// Add more locations to promotion
await lastAppService.patchPromotionEntities('promo_123', {
  add_entities: ['loc_xyz789', 'loc_def456']
});

// Remove a location
await lastAppService.patchPromotionEntities('promo_123', {
  remove_entities: ['loc_old999']
});
```

---

### Delete Promotion

**DELETE** `/promotions/{id}`

**Example:**
```typescript
await lastAppService.deletePromotion('promo_123');
```

---

## Implementation

```typescript
export class LastAppService {
  async createPromotion(data: CreatePromotionRequest): Promise<LastAppPromotion> {
    return this.makeRequest<LastAppPromotion>(
      '/promotions',
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      data.applies_to === 'all' ? 'organization' : 'location'
    );
  }

  async getPromotions(): Promise<LastAppPromotion[]> {
    const response = await this.makeRequest<{ data: LastAppPromotion[] }>(
      '/promotions',
      {},
      'organization'
    );
    return response.data;
  }

  async updatePromotion(id: string, data: Partial<CreatePromotionRequest>): Promise<void> {
    await this.makeRequest(
      `/promotions/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      },
      'organization'
    );
  }

  async patchPromotionEntities(id: string, data: {
    add_entities?: string[];
    remove_entities?: string[];
  }): Promise<void> {
    await this.makeRequest(
      `/promotions/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      },
      'organization'
    );
  }

  async deletePromotion(id: string): Promise<void> {
    await this.makeRequest(
      `/promotions/${id}`,
      { method: 'DELETE' },
      'organization'
    );
  }
}
```

## UI Example: Apply Promo Code

```typescript
function PromoCodeInput({ billTotal, onApply }: {
  billTotal: number;
  onApply: (discount: number) => void;
}) {
  const [code, setCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<LastAppPromotion | null>(null);

  const handleApply = async () => {
    try {
      const promotions = await lastAppService.getPromotions();
      const promo = promotions.find(p =>
        p.code === code.toUpperCase() &&
        p.active &&
        (!p.min_expense || billTotal >= p.min_expense)
      );

      if (!promo) {
        toast({ title: 'Código inválido', variant: 'destructive' });
        return;
      }

      let discount = 0;
      if (promo.type === 'percentage') {
        discount = billTotal * (promo.value! / 100);
      } else if (promo.type === 'currency') {
        discount = promo.value!;
      }

      setAppliedPromo(promo);
      onApply(discount);

      toast({
        title: 'Código aplicado',
        description: `Descuento: €${discount.toFixed(2)}`
      });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Código promocional"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <Button onClick={handleApply}>Aplicar</Button>

      {appliedPromo && (
        <div className="applied-promo">
          ✓ {appliedPromo.name} aplicado
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Limit redemptions** to prevent abuse
2. **Set expiration dates** for time-limited offers
3. **Track usage** for reporting
4. **Test promotions** before going live
5. **Clear terms** in description
6. **Stack rules** - decide if promotions can combine
7. **Notify customers** of available promotions
8. **A/B test** different promotion types

## Related Documentation

- [Tabs & Orders](./07-tabs-orders.md) - Apply promotions to orders
- [Customers](./10-customers.md) - Customer-specific promotions
