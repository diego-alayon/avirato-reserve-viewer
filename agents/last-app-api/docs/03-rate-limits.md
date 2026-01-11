# Rate Limits

## Overview

Last.app API v2.0.0 enforces rate limits to ensure fair usage and system stability. Exceeding these limits results in `429 Too Many Requests` errors.

## Limit Specifications

### Per 10 Minutes
**Limit**: 1500 requests per 10 minutes (600 seconds)
**Scope**: Per integrator token

### Per Second
**Limit**: 15 requests per second
**Scope**: Per entity (LocationID or OrganizationID)

### Summary Table

| Time Window | Limit | Scope |
|-------------|-------|-------|
| 10 minutes  | 1500 requests | Per token |
| 1 second    | 15 requests | Per entity |

## HTTP Headers

### Response Headers

Last.app may include these headers in responses:

```
X-RateLimit-Limit: 1500
X-RateLimit-Remaining: 1247
X-RateLimit-Reset: 1704585600
```

(Note: Check actual API responses as header names may vary)

### 429 Response

When rate limit is exceeded:

```typescript
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please retry after 60 seconds.",
  "retry_after": 60
}
```

## Implementation Strategies

### 1. Rate Limiter Class (Recommended)

```typescript
export interface RateLimiterConfig {
  maxRequestsPer10Min: number;  // 1500
  maxRequestsPerSecond: number; // 15
}

export class RateLimiter {
  private requestTimestamps: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig = {
    maxRequestsPer10Min: 1500,
    maxRequestsPerSecond: 15
  }) {
    this.config = config;
  }

  /**
   * Wait until a request slot is available
   * Returns a promise that resolves when safe to make request
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove timestamps older than 10 minutes (600,000 ms)
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 600000
    );

    // Check 10-minute limit
    if (this.requestTimestamps.length >= this.config.maxRequestsPer10Min) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = 600000 - (now - oldestTimestamp);

      console.warn(`Rate limit: Esperando ${Math.ceil(waitTime / 1000)}s`);
      await this.sleep(waitTime);
    }

    // Check per-second limit
    const lastSecondRequests = this.requestTimestamps.filter(
      timestamp => now - timestamp < 1000
    );

    if (lastSecondRequests.length >= this.config.maxRequestsPerSecond) {
      console.warn('Rate limit per segundo alcanzado. Esperando 1s...');
      await this.sleep(1000);
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Reset all tracked timestamps
   */
  reset(): void {
    this.requestTimestamps = [];
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    requestsLast10Min: number;
    requestsLastSecond: number;
    available10Min: number;
    availablePerSecond: number;
  } {
    const now = Date.now();
    const last10Min = this.requestTimestamps.filter(ts => now - ts < 600000);
    const lastSecond = this.requestTimestamps.filter(ts => now - ts < 1000);

    return {
      requestsLast10Min: last10Min.length,
      requestsLastSecond: lastSecond.length,
      available10Min: this.config.maxRequestsPer10Min - last10Min.length,
      availablePerSecond: this.config.maxRequestsPerSecond - lastSecond.length
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Integration with Service

```typescript
export class LastAppService {
  private rateLimiter: RateLimiter;

  constructor() {
    this.rateLimiter = new RateLimiter({
      maxRequestsPer10Min: 1500,
      maxRequestsPerSecond: 15
    });
  }

  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Wait for available slot
    await this.rateLimiter.waitForSlot();

    try {
      const response = await fetch(`https://api.last.shop${endpoint}`, options);

      if (response.status === 429) {
        // Rate limit hit despite our throttling
        const retryAfter = response.headers.get('Retry-After') || '60';
        console.error(`429 error. Retry after ${retryAfter}s`);

        // Wait and retry
        await this.sleep(parseInt(retryAfter) * 1000);
        return this.makeRequest(endpoint, options);
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. Exponential Backoff

For retries after 429 errors:

```typescript
async function fetchWithBackoff<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  let retries = 0;
  let delay = 1000; // Start with 1 second

  while (retries < maxRetries) {
    try {
      return await fetchFn();
    } catch (error) {
      if (error.status === 429 && retries < maxRetries - 1) {
        console.warn(`Retry ${retries + 1}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
        delay *= 2; // Exponential: 1s, 2s, 4s, 8s, 16s
        retries++;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries reached');
}

// Usage
const data = await fetchWithBackoff(() =>
  lastAppService.getTabs({ limit: 50 })
);
```

## Batch Processing

### Chunking Large Operations

```typescript
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 15 // Match per-second limit
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );

    results.push(...batchResults);

    // Wait 1 second before next batch (to respect per-second limit)
    if (i + batchSize < items.length) {
      await sleep(1000);
    }
  }

  return results;
}

// Usage: Sync 100 reservations
const reservations = await getAviratoReservations();
await processBatch(
  reservations,
  async (reservation) => {
    return lastAppService.createReservation(reservation);
  },
  15 // 15 requests per second
);
```

### Pagination with Rate Limiting

```typescript
async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; total: number }>,
  itemsPerPage: number = 50
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchPage(page);
    allItems.push(...response.data);

    hasMore = allItems.length < response.total;
    page++;

    // Rate limiter handles the timing
    console.log(`Fetched ${allItems.length}/${response.total} items`);
  }

  return allItems;
}

// Usage
const allTabs = await fetchAllPages(
  (page) => lastAppService.getTabs({ page, limit: 50 }),
  50
);
```

## Monitoring and Logging

### Track Rate Limit Status

```typescript
// Log rate limit status periodically
setInterval(() => {
  const status = rateLimiter.getStatus();
  console.log('Rate Limit Status:', {
    used10Min: `${status.requestsLast10Min}/1500`,
    usedPerSec: `${status.requestsLastSecond}/15`,
    available: status.available10Min
  });
}, 60000); // Every minute
```

### Dashboard Component

```typescript
function RateLimitIndicator() {
  const [status, setStatus] = useState({
    requestsLast10Min: 0,
    available10Min: 1500
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const current = rateLimiter.getStatus();
      setStatus(current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const percentage = (status.requestsLast10Min / 1500) * 100;

  return (
    <div className="rate-limit-indicator">
      <div className="progress-bar" style={{ width: `${percentage}%` }} />
      <span>{status.requestsLast10Min}/1500 requests</span>
      <span>{status.available10Min} available</span>
    </div>
  );
}
```

## Best Practices

### 1. Implement Rate Limiting Proactively
Don't wait for 429 errors - implement rate limiting from the start.

### 2. Use Webhooks Instead of Polling
```typescript
// ❌ BAD: Polling every 5 seconds
setInterval(async () => {
  await lastAppService.getTabs();
}, 5000); // 720 requests per hour!

// ✅ GOOD: Use webhooks
await lastAppService.registerWebhook(
  'https://your-app.com/webhooks/lastapp',
  ['tab:created', 'tab:updated']
);
```

### 3. Cache Frequently Accessed Data
```typescript
// Cache catalogs (they change rarely)
const CACHE_DURATION = 3600000; // 1 hour

let cachedCatalog: any = null;
let cacheTime: number = 0;

async function getCatalog(): Promise<any> {
  const now = Date.now();

  if (cachedCatalog && now - cacheTime < CACHE_DURATION) {
    return cachedCatalog;
  }

  cachedCatalog = await lastAppService.getCatalog('catalog_id');
  cacheTime = now;
  return cachedCatalog;
}
```

### 4. Batch Operations
Group multiple operations together instead of making individual requests.

### 5. Prioritize Requests
```typescript
// High priority: User-initiated actions
// Low priority: Background sync

const highPriorityQueue: (() => Promise<any>)[] = [];
const lowPriorityQueue: (() => Promise<any>)[] = [];

async function processQueues() {
  // Process high priority first
  while (highPriorityQueue.length > 0) {
    const task = highPriorityQueue.shift()!;
    await task();
  }

  // Then low priority
  if (lowPriorityQueue.length > 0) {
    const task = lowPriorityQueue.shift()!;
    await task();
  }
}
```

## Troubleshooting

### Issue: Still Getting 429 Errors

**Possible Causes:**
1. Multiple instances of app running
2. Rate limiter not properly initialized
3. Concurrent requests bypassing rate limiter
4. Other integrations using same token

**Solutions:**
- Ensure single RateLimiter instance (singleton)
- Add mutex locks for concurrent operations
- Monitor all request sources
- Use separate tokens for different environments

### Issue: Requests Too Slow

**Possible Causes:**
1. Over-conservative rate limiting
2. Sequential processing when parallel is possible

**Solutions:**
- Use batch processing (up to 15 parallel requests)
- Optimize wait times
- Cache static data

## Testing Rate Limits

### Stress Test

```typescript
async function stressTest() {
  const startTime = Date.now();
  const requests = 100;

  for (let i = 0; i < requests; i++) {
    await lastAppService.getOrganizations();
    console.log(`Request ${i + 1}/${requests}`);
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`Completed ${requests} requests in ${duration}s`);
  console.log(`Rate: ${requests / duration} req/s`);
}
```

## Summary

- **Implement RateLimiter class** before going to production
- **Use webhooks** instead of polling
- **Cache static data** to reduce requests
- **Batch operations** when possible
- **Monitor usage** with dashboards
- **Handle 429 errors** gracefully with exponential backoff

## Related Documentation

- [Authentication](./02-authentication.md) - Set up API access
- [Webhooks](./12-webhooks.md) - Real-time updates instead of polling
- [Best Practices](./01-overview.md#best-practices) - General guidelines
