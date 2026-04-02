# Services (API Layer)

This directory contains all external API integrations.

## Files

- `avirato.ts` - Avirato PMS API client
- `lastapp.ts` - Last.app messaging API client
- `calendar.service.ts` - Calendar/booking sync service
- `sync.ts` - Data synchronization between systems

## Conventions

- All API calls must handle errors gracefully
- Use rate limiting for external API calls (see `utils/rateLimiter.ts`)
- Never expose API keys in client code — use `.env.local`
- Return typed responses using interfaces from `types/`
