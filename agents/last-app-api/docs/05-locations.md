# Locations

## Overview

Locations represent physical places (restaurants, hotels, venues) within an organization. Each location can have multiple brands and catalogs.

## Base Endpoint

```
/locations
```

## Endpoints

### 1. List Locations

**GET** `/locations`

Get all locations for an organization.

**Required Header**: `OrganizationID`

**Example:**
```typescript
const locations = await lastAppService.getLocations('org_abc123');
```

**Response** (Simplified schema):
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
}

{
  data: [
    {
      id: 'loc_abc123',
      name: 'Serra Nature Resort',
      address: 'Carretera de Sóller km 2',
      city: 'Mallorca',
      postal_code: '07100',
      country: 'España',
      phone: '+34971123456',
      email: 'info@serranature.com',
      timezone: 'Europe/Madrid',
      latitude: 39.6953,
      longitude: 2.8784
    }
  ]
}
```

---

### 2. Get Location Details

**GET** `/locations/{id}`

Get complete details for a location, including brands and catalogs.

**Required Header**: `LocationID`

**Example:**
```typescript
const location = await lastAppService.getLocation('loc_abc123');
```

**Response** (Complete schema):
```typescript
{
  id: 'loc_abc123',
  name: 'Serra Nature Resort',
  address: 'Carretera de Sóller km 2',
  city: 'Mallorca',
  postal_code: '07100',
  country: 'España',
  phone: '+34971123456',
  email: 'info@serranature.com',
  timezone: 'Europe/Madrid',
  latitude: 39.6953,
  longitude: 2.8784,
  brands: [
    {
      id: 'brand_restaurant',
      name: 'Main Restaurant',
      catalogs: [
        {
          id: 'catalog_default',
          name: 'Carta Principal',
          type: 'default',
          products_count: 45,
          active: true
        },
        {
          id: 'catalog_delivery',
          name: 'Delivery Menu',
          type: 'delivery',
          products_count: 30,
          active: true
        }
      ]
    },
    {
      id: 'brand_bar',
      name: 'Pool Bar',
      catalogs: [...]
    }
  ],
  settings: {
    accepts_reservations: true,
    accepts_delivery: true,
    accepts_takeaway: true,
    min_delivery_amount: 20.00,
    delivery_fee: 3.50,
    tax_rate: 21
  },
  hours: {
    monday: { open: '09:00', close: '23:00' },
    tuesday: { open: '09:00', close: '23:00' },
    // ... rest of week
  }
}
```

---

## Implementation

```typescript
export class LastAppService {
  async getLocations(organizationId: string): Promise<LastAppLocation[]> {
    // Temporarily set organization ID for this request
    const originalOrgId = this.organizationId;
    this.organizationId = organizationId;

    try {
      const response = await this.makeRequest<{ data: LastAppLocation[] }>(
        '/locations',
        {},
        'organization'
      );
      return response.data;
    } finally {
      this.organizationId = originalOrgId;
    }
  }

  async getLocation(id: string): Promise<LastAppLocation> {
    // Temporarily set location ID for this request
    const originalLocId = this.locationId;
    this.locationId = id;

    try {
      return await this.makeRequest<LastAppLocation>(
        `/locations/${id}`,
        {},
        'location'
      );
    } finally {
      this.locationId = originalLocId;
    }
  }
}
```

## Usage Example

```typescript
// 1. Get all locations for organization
const locations = await lastAppService.getLocations('org_abc123');
console.log(`Found ${locations.length} locations`);

// 2. Display locations in dropdown
<select onChange={(e) => setSelectedLocation(e.target.value)}>
  {locations.map(loc => (
    <option key={loc.id} value={loc.id}>
      {loc.name} - {loc.city}
    </option>
  ))}
</select>

// 3. Get full details when location selected
const locationDetails = await lastAppService.getLocation(selectedLocationId);
console.log('Brands:', locationDetails.brands.map(b => b.name));
console.log('Accepts reservations:', locationDetails.settings.accepts_reservations);

// 4. Check if delivery is available
if (locationDetails.settings.accepts_delivery) {
  console.log(`Min order: €${locationDetails.settings.min_delivery_amount}`);
  console.log(`Delivery fee: €${locationDetails.settings.delivery_fee}`);
}
```

## UI Component Example

```typescript
function LocationSelector() {
  const [locations, setLocations] = useState<LastAppLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LastAppLocation | null>(null);

  useEffect(() => {
    async function loadLocations() {
      const locs = await lastAppService.getLocations(currentOrgId);
      setLocations(locs);
      if (locs.length > 0) {
        const details = await lastAppService.getLocation(locs[0].id);
        setSelectedLocation(details);
      }
    }
    loadLocations();
  }, [currentOrgId]);

  return (
    <div>
      <select
        onChange={async (e) => {
          const details = await lastAppService.getLocation(e.target.value);
          setSelectedLocation(details);
        }}
      >
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>

      {selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedLocation.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{selectedLocation.address}</p>
            <p>{selectedLocation.city}, {selectedLocation.postal_code}</p>
            <p>📞 {selectedLocation.phone}</p>
            {selectedLocation.email && <p>✉️ {selectedLocation.email}</p>}

            <h3>Brands:</h3>
            <ul>
              {selectedLocation.brands.map(brand => (
                <li key={brand.id}>
                  {brand.name} ({brand.catalogs.length} catalogs)
                </li>
              ))}
            </ul>

            <h3>Services:</h3>
            <ul>
              {selectedLocation.settings.accepts_reservations && <li>✅ Reservations</li>}
              {selectedLocation.settings.accepts_delivery && <li>✅ Delivery</li>}
              {selectedLocation.settings.accepts_takeaway && <li>✅ Takeaway</li>}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Best Practices

1. **Store selected location** in app state/context
2. **Cache location details** (change infrequently)
3. **Use location timezone** for all operations
4. **Show map** using latitude/longitude
5. **Validate delivery address** against location settings
6. **Check business hours** before allowing orders
7. **Display multiple brands** clearly in UI
8. **Handle multi-location** organizations gracefully

## Related Documentation

- [Organizations](./04-organizations.md) - Parent organization
- [Catalogs](./06-catalogs-products.md) - Products per location
- [Reservations](./09-reservations.md) - Location-based reservations
