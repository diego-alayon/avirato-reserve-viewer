# Architecture

## Overview

Avirato Reserve Viewer is a Vue/React dashboard for hotel reservation management integrated with Avirato PMS and Last.app.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **State**: React hooks (custom hooks pattern)
- **APIs**: Avirato PMS API, Last.app API
- **Deployment**: Vercel

## Directory Structure

```
src/
├── components/    # UI components (shadcn/ui + custom)
├── hooks/         # Custom React hooks (data fetching, state)
├── pages/         # Route-level page components
├── services/      # API integration layer (Avirato, Last.app, sync)
├── types/         # TypeScript type definitions
├── utils/         # Shared utilities (date helpers, logger, rate limiter)
└── lib/           # Library configuration (shadcn utils)
```

## Data Flow

1. **Pages** consume **hooks** for data and state
2. **Hooks** call **services** for API communication
3. **Services** handle HTTP requests to Avirato PMS and Last.app APIs
4. **Types** define shared interfaces across layers

## Key Integrations

- **Avirato PMS**: Reservation data, property management
- **Last.app**: Messaging, guest communication
- **Calendar sync**: Booking calendar coordination
