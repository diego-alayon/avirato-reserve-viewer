# Organizations

## Overview

Organizations represent the top-level business entity in Last.app. An integrator can manage multiple organizations, and each organization can have multiple locations.

## Base Endpoint

```
/organizations
```

**Required Header**: Only `Authorization` (no LocationID/OrganizationID needed)

## Endpoints

### 1. List Organizations

**GET** `/organizations`

Get all organizations integrated with your token.

**Example:**
```typescript
const orgs = await lastAppService.getOrganizations();
```

**Response:**
```typescript
interface LastAppOrganization {
  id: string;
  name: string;
  logo_url?: string;
  timezone: string;
  currency: string;
  locale: string;
  created_at: string;
}

{
  data: [
    {
      id: 'org_abc123',
      name: 'Serra Nature',
      logo_url: 'https://cdn.last.app/logos/org_abc123.png',
      timezone: 'Europe/Madrid',
      currency: 'EUR',
      locale: 'es_ES',
      created_at: '2025-06-01T10:00:00Z'
    }
  ]
}
```

---

### 2. Get Organization Details

**GET** `/organizations/{id}`

Get detailed information about a specific organization.

**Required Header**: `OrganizationID`

**Example:**
```typescript
const org = await lastAppService.getOrganization('org_abc123');
```

**Response** (Complete schema with full details):
```typescript
{
  id: 'org_abc123',
  name: 'Serra Nature',
  logo_url: 'https://cdn.last.app/logos/org_abc123.png',
  timezone: 'Europe/Madrid',
  currency: 'EUR',
  locale: 'es_ES',
  settings: {
    tax_rate: 21,  // 21% IVA
    default_payment_methods: ['cash', 'card', 'transfer'],
    loyalty_enabled: true,
    notifications_enabled: true
  },
  created_at: '2025-06-01T10:00:00Z',
  updated_at: '2026-01-01T12:00:00Z'
}
```

---

### 3. Get Organization Courses

**GET** `/organizations/{id}/courses`

Get defined courses (menu sections) for the organization.

**Required Header**: `OrganizationID`

**Example:**
```typescript
const courses = await lastAppService.getOrganizationCourses('org_abc123');
```

**Response:**
```typescript
interface LastAppCourse {
  id: string;
  name: string;
  order: number;  // Display order
}

{
  courses: [
    { id: 'course_1', name: 'Entrantes', order: 1 },
    { id: 'course_2', name: 'Principales', order: 2 },
    { id: 'course_3', name: 'Postres', order: 3 },
    { id: 'course_4', name: 'Bebidas', order: 4 }
  ]
}
```

---

### 4. Get Full Organization Catalog

**GET** `/organizations/{id}/catalog`

Get the complete catalog for the organization (all products across all locations).

**Required Header**: `OrganizationID`

**Example:**
```typescript
const catalog = await lastAppService.getOrganizationCatalog('org_abc123');
```

**Response:**
```typescript
{
  organization_id: 'org_abc123',
  catalogs: [
    {
      location_id: 'loc_1',
      location_name: 'Serra Nature Resort',
      brands: [
        {
          brand_id: 'brand_1',
          brand_name: 'Main Restaurant',
          catalog_types: ['default', 'delivery', 'takeaway'],
          products: [...],
          combos: [...]
        }
      ]
    }
  ]
}
```

---

## Implementation

```typescript
export class LastAppService {
  async getOrganizations(): Promise<LastAppOrganization[]> {
    const response = await this.makeRequest<{ data: LastAppOrganization[] }>(
      '/organizations',
      {},
      'none'  // No entity header needed
    );
    return response.data;
  }

  async getOrganization(id: string): Promise<LastAppOrganization> {
    return this.makeRequest<LastAppOrganization>(
      `/organizations/${id}`,
      {},
      'organization'
    );
  }

  async getOrganizationCourses(id: string): Promise<LastAppCourse[]> {
    const response = await this.makeRequest<{ courses: LastAppCourse[] }>(
      `/organizations/${id}/courses`,
      {},
      'organization'
    );
    return response.courses;
  }

  async getOrganizationCatalog(id: string): Promise<any> {
    return this.makeRequest(
      `/organizations/${id}/catalog`,
      {},
      'organization'
    );
  }
}
```

## Usage Example

```typescript
// 1. List all organizations
const organizations = await lastAppService.getOrganizations();
console.log(`Found ${organizations.length} organizations`);

// 2. Select first organization
const orgId = organizations[0].id;

// 3. Get full details
const orgDetails = await lastAppService.getOrganization(orgId);
console.log(`Organization: ${orgDetails.name}`);
console.log(`Currency: ${orgDetails.currency}`);
console.log(`Tax Rate: ${orgDetails.settings.tax_rate}%`);

// 4. Get courses
const courses = await lastAppService.getOrganizationCourses(orgId);
console.log('Menu sections:', courses.map(c => c.name));

// 5. Get full catalog
const fullCatalog = await lastAppService.getOrganizationCatalog(orgId);
console.log('Total locations:', fullCatalog.catalogs.length);
```

## Best Practices

1. **Cache organization data** - Changes rarely, safe to cache for hours
2. **Store selected organization** in app state for easy access
3. **Use organization timezone** for all date/time operations
4. **Respect organization currency** in pricing displays
5. **Check settings** before enabling features (e.g., loyalty program)

## Related Documentation

- [Locations](./05-locations.md) - Locations within organization
- [Catalogs](./06-catalogs-products.md) - Product catalogs
