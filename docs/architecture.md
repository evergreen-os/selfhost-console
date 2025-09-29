# EvergreenOS Selfhost Console – Architecture Overview

## Runtime stack
- **Next.js 14 App Router** with React 18 powers the UI and API routes.
- **TailwindCSS + shadcn-inspired primitives** provide styling and reusable components.
- **React Query** coordinates data fetching, caching, and optimistic updates.
- **Buf-generated REST + gRPC-Web clients** wrap backend integrations (placed in `gen/`).
- **Node test runner** continues to cover domain helpers, while **Jest + Playwright** validate UI behaviour.

## Directory layout
```
src/
├─ app/
│  ├─ (auth)/login          # Auth entry point
│  ├─ (dashboard)/dashboard # Guarded dashboard routes (devices, policies, events, users, tenants)
│  ├─ api/auth/*            # Next.js route handlers for login/refresh/logout/session
│  └─ layout.tsx            # Root layout and providers
├─ components/
│  ├─ layout/               # Dashboard shell, guards, providers
│  └─ ui/                   # Button, card, table, badge, etc.
├─ hooks/
│  └─ useSessionStore.tsx   # Client-side session context + guards
├─ lib/
│  ├─ api/                  # HTTP helpers used by generated clients
│  ├─ server/               # Session manager bridge to backend
│  └─ utils.ts              # Shared formatting helpers
├─ features/                # Existing domain logic (auth, devices, policies, events, users)
└─ tests/                   # Jest unit/integration + Playwright suites
```

## Data flow
1. **Login** – The login form posts to `/api/auth/login`, which uses the domain `sessionManager` to call the backend,
   sets HttpOnly cookies, and returns session metadata.
2. **Session provider** – `useSessionStore` consumes the API routes to load, refresh, and revoke sessions while
   exposing RBAC helpers to the UI.
3. **Dashboard routes** – Each route (`/dashboard/devices`, `/dashboard/policies`, etc.) uses React Query to call the
   Buf-generated clients (REST with JSON parsing and Connect for device commands) and transform data through the existing feature
   helpers (`filterDevices`, `detailView`, `validatePolicyBundle`, etc.).
4. **Mutations** – Actions such as device sync, policy publish, user role updates, and tenant edits call the generated
   clients and invalidate relevant queries to keep the UI consistent.
5. **Event exports** – The events page calls the REST export endpoint and streams a Blob for CSV/JSON downloads, while
   still using the `filterEvents` helper for client-side filtering.

## Testing strategy
- **Domain**: Legacy `node:test` suites remain unchanged to guarantee business logic correctness.
- **React**: Jest + RTL tests cover login submission and session context behaviours.
- **E2E**: Playwright smoke spec ensures the login page renders; more end-to-end flows can be layered on top.
- **Coverage**: Jest enforces ≥90% coverage thresholds in CI.

## Deployment
- Dockerfile performs a multi-stage Next.js build and serves the production bundle with `next start`.
- docker-compose runs the console next to the `selfhost-backend`, wiring environment variables required for REST/gRPC
  access.
- The Makefile wraps installs, builds, tests, linting, and container workflows to simplify automation pipelines.
