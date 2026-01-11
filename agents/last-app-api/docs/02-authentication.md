# Authentication

## Overview

Last.app API v2.0.0 uses **Bearer Token authentication**. Each integrator receives a unique token that provides access to all their integrated organizations.

## Bearer Token

### Obtaining Your Token

1. Register at https://developers.last.app
2. Navigate to **Settings** → **Integrations**
3. Copy your Bearer token
4. **Keep it secret** - treat it like a password

### Token Characteristics

- **Scope**: One token covers ALL your organizations (V2 change)
- **Expiration**: No known expiration (verify with support)
- **Regeneration**: Can be regenerated from Developer Portal
- **Security**: Never expose in client-side code or public repositories

## Request Headers

### Required Headers

Every API request (except OPTIONS) requires the Authorization header:

```typescript
const headers = {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

### Entity Headers

Most endpoints require either `LocationID` or `OrganizationID`:

```typescript
// For location-specific operations
const headers = {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'LocationID': 'loc_abc123',
  'Content-Type': 'application/json'
};

// For organization-wide operations
const headers = {
  'Authorization': 'Bearer YOUR_TOKEN_HERE',
  'OrganizationID': 'org_xyz789',
  'Content-Type': 'application/json'
};
```

### Header Selection Guide

| Endpoint | Requires | Example |
|----------|----------|---------|
| `/organizations` | Only Authorization | N/A |
| `/organizations/{id}/*` | OrganizationID | GET courses |
| `/locations` | OrganizationID | List locations |
| `/locations/{id}` | LocationID | Get location details |
| `/tabs` | LocationID | Create/list tabs |
| `/reservations` | LocationID | Create reservation |
| `/customers` | OrganizationID | List customers |
| `/promotions` | LocationID or OrganizationID | Depends on scope |

Check each endpoint's AUTHORIZATIONS field in the docs for specific requirements.

## TypeScript Implementation

### Basic Service Class

```typescript
export interface LastAppCredentials {
  token: string;
  organizationId?: string;
  locationId?: string;
}

export class LastAppService {
  private token: string | null = null;
  private organizationId: string | null = null;
  private locationId: string | null = null;

  async authenticate(credentials: LastAppCredentials): Promise<void> {
    // Validate token by making a test request
    try {
      const response = await fetch('https://api.last.shop/organizations', {
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      // Store credentials
      this.token = credentials.token;
      this.organizationId = credentials.organizationId || null;
      this.locationId = credentials.locationId || null;

      // Persist to localStorage
      localStorage.setItem('lastapp_token', this.token);
      if (this.organizationId) {
        localStorage.setItem('lastapp_organization_id', this.organizationId);
      }
      if (this.locationId) {
        localStorage.setItem('lastapp_location_id', this.locationId);
      }
    } catch (error) {
      throw new Error('Autenticación fallida: ' + error.message);
    }
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  clearToken(): void {
    this.token = null;
    this.organizationId = null;
    this.locationId = null;
    localStorage.removeItem('lastapp_token');
    localStorage.removeItem('lastapp_organization_id');
    localStorage.removeItem('lastapp_location_id');
  }

  private getHeaders(requiresEntity: 'location' | 'organization' | 'none' = 'none'): HeadersInit {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (requiresEntity === 'location' && this.locationId) {
      headers['LocationID'] = this.locationId;
    } else if (requiresEntity === 'organization' && this.organizationId) {
      headers['OrganizationID'] = this.organizationId;
    }

    return headers;
  }

  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresEntity: 'location' | 'organization' | 'none' = 'none'
  ): Promise<T> {
    if (!this.isAuthenticated()) {
      throw new Error('No autenticado. Llama a authenticate() primero.');
    }

    const response = await fetch(`https://api.last.shop${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(requiresEntity),
        ...(options.headers || {})
      }
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Token expirado o inválido');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }
}

export const lastAppService = new LastAppService();
```

## Authentication Errors

### 401 Unauthorized

**Cause**: Invalid or expired token

**Solution**:
```typescript
if (response.status === 401) {
  // Clear stored token
  lastAppService.clearToken();

  // Redirect to login or show auth modal
  window.location.href = '/login';

  // Or show toast notification
  toast({
    title: "Sesión expirada",
    description: "Por favor inicia sesión nuevamente",
    variant: "destructive"
  });
}
```

### 403 Forbidden

**Cause**: Insufficient permissions for the resource

**Solution**:
- Verify you're using the correct LocationID/OrganizationID
- Check integration status (Test vs Production)
- Contact support if issue persists

## Storage Best Practices

### Development
```typescript
// Store in localStorage for development
localStorage.setItem('lastapp_token', token);
```

### Production
```typescript
// Use secure HTTP-only cookies
document.cookie = `lastapp_token=${token}; Secure; HttpOnly; SameSite=Strict`;

// Or encrypted storage
const encryptedToken = await encrypt(token, encryptionKey);
sessionStorage.setItem('lastapp_token', encryptedToken);
```

### Never:
- ❌ Hardcode tokens in source code
- ❌ Store tokens in public repositories
- ❌ Expose tokens in client-side JavaScript
- ❌ Log tokens in console or error messages
- ❌ Send tokens in URL parameters

## Token Rotation

### When to Rotate

- **Security breach**: Immediately regenerate
- **Regular schedule**: Every 90 days (recommended)
- **Team member leaves**: Regenerate if they had access
- **Moving to production**: Use separate production token

### How to Rotate

1. Generate new token in Developer Portal
2. Update stored token in your application
3. Test with new token
4. Revoke old token
5. Monitor for any failed requests

## Environment Variables

### Recommended Setup

```bash
# .env.local (Development)
VITE_LASTAPP_TOKEN=your_test_token_here
VITE_LASTAPP_ORGANIZATION_ID=org_test123
VITE_LASTAPP_LOCATION_ID=loc_test456

# .env.production
VITE_LASTAPP_TOKEN=your_production_token_here
VITE_LASTAPP_ORGANIZATION_ID=org_prod789
VITE_LASTAPP_LOCATION_ID=loc_prod012
```

### Usage in Code

```typescript
const token = import.meta.env.VITE_LASTAPP_TOKEN;
const organizationId = import.meta.env.VITE_LASTAPP_ORGANIZATION_ID;
const locationId = import.meta.env.VITE_LASTAPP_LOCATION_ID;

await lastAppService.authenticate({
  token,
  organizationId,
  locationId
});
```

## Testing Authentication

### Verify Token

```typescript
async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.last.shop/organizations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Usage
const isValid = await verifyToken('your_token');
console.log(`Token is ${isValid ? 'valid' : 'invalid'}`);
```

### Test Connection

```typescript
async function testConnection(): Promise<void> {
  await lastAppService.authenticate({
    token: process.env.VITE_LASTAPP_TOKEN!
  });

  const orgs = await lastAppService.makeRequest<{ data: any[] }>(
    '/organizations',
    {},
    'none'
  );

  console.log(`✅ Conectado. ${orgs.data.length} organizaciones encontradas.`);
}
```

## Webhook Authentication

Webhooks also use Bearer token authentication:

```typescript
// Last.app will send this header with webhook requests
const webhookToken = request.headers.get('Authorization');

// Verify it matches your token
if (webhookToken !== `Bearer ${process.env.LASTAPP_TOKEN}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Security Checklist

- ✅ Token stored securely (not in source code)
- ✅ HTTPS used for all requests
- ✅ Token rotation policy in place
- ✅ Error messages don't expose tokens
- ✅ Logs don't include tokens
- ✅ Separate tokens for dev/staging/production
- ✅ Webhook signature validation implemented
- ✅ Token access limited to authorized team members

## Troubleshooting

### "Token inválido" Error

1. Verify token hasn't been regenerated in Portal
2. Check for extra spaces or characters
3. Ensure using Bearer prefix: `Bearer ${token}`
4. Verify account status is active

### "No autenticado" Error

1. Call `authenticate()` before making requests
2. Check token is properly stored
3. Verify `isAuthenticated()` returns true

### Headers Not Working

1. Confirm header names match exactly: `LocationID`, not `location_id`
2. Check endpoint documentation for required headers
3. Verify entity IDs are valid

## Next Steps

- Review [Rate Limits](./03-rate-limits.md) to implement proper throttling
- Explore [Organizations](./04-organizations.md) to understand the hierarchy
- Check [Webhooks](./12-webhooks.md) for webhook authentication
