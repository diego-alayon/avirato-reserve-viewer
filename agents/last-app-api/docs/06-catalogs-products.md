# Catalogs & Products

## Overview

Catalogs contain products and combos. Each location can have multiple brands, and each brand can have multiple catalog types (default, delivery, justeat, glovo, shop).

## Endpoints

### Get Catalogs

**GET** `/catalogs`

List all catalogs (simplified schema).

**Required Header**: `LocationID`

**Example:**
```typescript
const catalogs = await lastAppService.getCatalogs();
```

**Response:**
```typescript
{
  data: [
    {
      id: 'catalog_default',
      name: 'Carta Principal',
      type: 'default',
      brand_id: 'brand_restaurant',
      active: true
    },
    {
      id: 'catalog_delivery',
      name: 'Delivery Menu',
      type: 'delivery',
      brand_id: 'brand_restaurant',
      active: true
    }
  ]
}
```

---

### Get Catalog Details

**GET** `/catalogs/{id}`

Get full catalog with all products and modifiers (complete schema).

**Required Header**: `LocationID`

**Example:**
```typescript
const catalog = await lastAppService.getCatalog('catalog_default');
```

**Response:**
```typescript
{
  id: 'catalog_default',
  name: 'Carta Principal',
  type: 'default',
  brand_id: 'brand_restaurant',
  brand_name: 'Main Restaurant',
  active: true,
  products: [
    {
      id: 'prod_burger01',
      name: 'Classic Burger',
      description: 'Angus beef, lettuce, tomato, onion',
      price: 12.50,
      category: 'Principales',
      image_url: 'https://cdn.last.app/products/burger.jpg',
      available: true,
      modifiers: [
        {
          id: 'mod_cheese',
          name: 'Extra Cheese',
          price: 1.50
        },
        {
          id: 'mod_bacon',
          name: 'Bacon',
          price: 2.00
        }
      ],
      modifier_groups: [
        {
          id: 'group_sides',
          name: 'Elige acompañamiento',
          min_selections: 1,
          max_selections: 1,
          modifiers: [
            { id: 'mod_fries', name: 'Papas fritas', price: 0 },
            { id: 'mod_salad', name: 'Ensalada', price: 0 }
          ]
        }
      ]
    }
  ],
  combos: [
    {
      id: 'combo_lunch',
      name: 'Menú del Día',
      description: 'Plato + bebida + postre',
      price: 15.00,
      categories: [
        {
          name: 'Primer Plato',
          min_selections: 1,
          max_selections: 1,
          products: ['prod_soup', 'prod_salad']
        },
        {
          name: 'Segundo Plato',
          min_selections: 1,
          max_selections: 1,
          products: ['prod_chicken', 'prod_fish']
        },
        {
          name: 'Postre',
          min_selections: 1,
          max_selections: 1,
          products: ['prod_icecream', 'prod_fruit']
        }
      ]
    }
  ]
}
```

---

### Update Product Availability

**PUT** `/catalogs/{catalogId}/products/{productId}`

Enable or disable a product.

**Request Body:**
```typescript
{
  available: boolean
}
```

**Example:**
```typescript
// Disable product (out of stock)
await lastAppService.updateProductAvailability(
  'catalog_default',
  'prod_burger01',
  false
);

// Re-enable product
await lastAppService.updateProductAvailability(
  'catalog_default',
  'prod_burger01',
  true
);
```

---

## Floorplans

**GET** `/floorplans`

List floor plans (table layouts).

**Example:**
```typescript
const floorplans = await lastAppService.getFloorplans();
```

**GET** `/floorplans/{id}`

Get detailed floorplan with table configuration.

---

## Implementation

```typescript
export class LastAppService {
  async getCatalogs(): Promise<LastAppCatalog[]> {
    const response = await this.makeRequest<{ data: LastAppCatalog[] }>(
      '/catalogs',
      {},
      'location'
    );
    return response.data;
  }

  async getCatalog(id: string): Promise<LastAppCatalog> {
    return this.makeRequest<LastAppCatalog>(
      `/catalogs/${id}`,
      {},
      'location'
    );
  }

  async updateProductAvailability(
    catalogId: string,
    productId: string,
    available: boolean
  ): Promise<void> {
    await this.makeRequest(
      `/catalogs/${catalogId}/products/${productId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ available })
      },
      'location'
    );
  }

  async getFloorplans(): Promise<LastAppFloorplan[]> {
    const response = await this.makeRequest<{ data: LastAppFloorplan[] }>(
      '/floorplans',
      {},
      'location'
    );
    return response.data;
  }

  async getFloorplan(id: string): Promise<LastAppFloorplan> {
    return this.makeRequest<LastAppFloorplan>(
      `/floorplans/${id}`,
      {},
      'location'
    );
  }
}
```

## UI Example: Product Catalog

```typescript
function ProductCatalog() {
  const [catalog, setCatalog] = useState<LastAppCatalog | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function loadCatalog() {
      const cat = await lastAppService.getCatalog('catalog_default');
      setCatalog(cat);
    }
    loadCatalog();
  }, []);

  const categories = [...new Set(catalog?.products.map(p => p.category))];
  const filteredProducts = filter === 'all'
    ? catalog?.products
    : catalog?.products.filter(p => p.category === filter);

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    await lastAppService.updateProductAvailability(
      catalog!.id,
      productId,
      !currentStatus
    );
    // Reload catalog
    const updated = await lastAppService.getCatalog(catalog!.id);
    setCatalog(updated);
  };

  return (
    <div>
      <div className="filters">
        <button onClick={() => setFilter('all')}>Todos</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}>
            {cat}
          </button>
        ))}
      </div>

      <div className="products">
        {filteredProducts?.map(product => (
          <Card key={product.id}>
            <img src={product.image_url} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="price">€{product.price.toFixed(2)}</p>
            <Switch
              checked={product.available}
              onCheckedChange={() => toggleAvailability(product.id, product.available)}
            />
            <span>{product.available ? 'Disponible' : 'Agotado'}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

1. **Cache catalog data** (changes infrequently)
2. **Show product images** for better UX
3. **Highlight unavailable items** clearly
4. **Group by category** for easy navigation
5. **Support search** in large catalogs
6. **Show modifiers** with clear pricing
7. **Handle combos** with clear selection UI
8. **Sync availability** with inventory system

## Webhooks

```typescript
await lastAppService.registerWebhook(
  'https://your-app.com/webhooks/lastapp',
  ['catalog:updated', 'product:updated']
);
```

## Related Documentation

- [Tabs & Orders](./07-tabs-orders.md) - Add products to orders
- [Locations](./05-locations.md) - Location-based catalogs
