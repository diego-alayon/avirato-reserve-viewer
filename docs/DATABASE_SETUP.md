# Database Setup - Supabase Configuration

This document explains how to set up Supabase as the database for Avirato Reserve Viewer.

## Overview

The application uses **Supabase (PostgreSQL)** for:
- Caching reservations from Avirato API
- Storing customer synchronization data
- Persisting sync logs (replacing localStorage)
- Managing notification queues for future automated messaging
- Storing application settings

## Quick Start

### 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization and set:
   - **Project name**: `avirato-reserve-viewer`
   - **Database password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (~2 minutes)

### 2. Run the Migration

1. Go to your Supabase project → **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy the entire content
4. Paste it into the SQL Editor
5. Click **Run** to execute

This creates all necessary tables:
- `reservations_cache` - Cached Avirato reservations
- `customers` - Synced customers (Avirato → Last.app)
- `sync_logs` - Synchronization history
- `notification_queue` - Pending notifications
- `notification_history` - Sent notifications
- `app_settings` - Application configuration
- `operators` - Cached operators/channels

### 3. Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **anon/public key** (the first key, safe for frontend)

### 4. Configure Environment Variables

Create or update `.env.local`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For Vercel deployment, add these in the Vercel dashboard under **Environment Variables**.

### 5. Verify Connection

Start the development server:

```bash
npm run dev
```

Check the browser console for:
- `⚠️ Supabase environment variables not configured` - Variables missing
- No warnings - Connection successful

## Database Schema

### Tables Overview

| Table | Description | Key Fields |
|-------|-------------|------------|
| `reservations_cache` | Cached Avirato reservations | `avirato_id`, `check_in_date`, `is_fully_paid` |
| `customers` | Synced customers | `phone_normalized`, `sync_status` |
| `sync_logs` | Operation history | `operation`, `status`, `items_succeeded` |
| `notification_queue` | Pending notifications | `scheduled_for`, `status`, `notification_type` |
| `notification_history` | Sent messages | `sent_at`, `status`, `channel` |
| `app_settings` | Key-value config | `key`, `value` |
| `operators` | Channel cache | `id`, `name` |

### Real-time Subscriptions

These tables have real-time enabled:
- `reservations_cache` - Live updates for reservation changes
- `notification_queue` - Live updates for notification processing

## Features

### Automatic Fallback

The application gracefully falls back to localStorage when Supabase is not configured:
- Sync logs stored in localStorage
- Settings stored in localStorage
- No data loss if database unavailable

### Data Migration

When Supabase is first configured, the app automatically migrates:
- Existing sync logs from localStorage
- Application settings from localStorage

### Caching Strategy

1. **Write-through**: Data written to both Supabase and localStorage
2. **Read preference**: Supabase first, localStorage fallback
3. **Reservation cache**: Updated on each Avirato API fetch

## Security Considerations

### Row Level Security (RLS)

The migration creates tables without RLS enabled by default. For production:

1. Enable RLS on sensitive tables:
```sql
ALTER TABLE reservations_cache ENABLE ROW LEVEL SECURITY;
```

2. Create appropriate policies based on your auth needs

### API Key Security

- The `anon` key is safe for frontend use with RLS
- Never expose the `service_role` key in frontend code
- Configure CORS in Supabase settings if needed

## Troubleshooting

### "Supabase environment variables not configured"

- Check `.env.local` exists and has correct values
- Restart the dev server after changing env vars
- Verify no typos in variable names

### "Failed to fetch" errors

- Check Supabase project is running
- Verify the URL doesn't have trailing slashes
- Check network connectivity

### Tables not found (42P01 error)

- Run the migration script in SQL Editor
- Verify migration completed without errors

## Future Enhancements

1. **WhatsApp Integration**: Use `notification_queue` with Vercel Edge Functions
2. **Analytics Dashboard**: Query `sync_logs` for metrics
3. **Multi-tenant**: Add RLS policies for multiple hotels
4. **Webhooks**: Set up Supabase webhooks for external integrations
