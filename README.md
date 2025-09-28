# EvergreenOS Selfhost Console

The EvergreenOS selfhost console delivers the full Next.js + Tailwind admin experience for self-hosted EvergreenOS
deployments. The application allows tenant owners and administrators to enrol devices, publish policies, audit events,
and manage reseller hierarchies while complying with the PRD requirements.

## ✨ Features
- **Next.js 14 + Tailwind UI shell** with shadcn-inspired primitives, responsive navigation, and React Query data
  fetching.
- **Authentication & RBAC** via HttpOnly cookies, automatic refresh, and route guards that enforce Owner/Admin/Auditor
  capabilities.
- **Device management** tables, detail views, sync/decommission controls, and health banners built on top of the
  existing domain helpers.
- **Policy catalogue & editor** featuring validation against the Evergreen policy schema, signature status, and app
  catalogue assignments.
- **Events & audit timeline** with keyword and severity filters plus CSV/JSON exports.
- **User & tenant administration** including role changes, invites, and reseller-aware hierarchy visualisation.
- **Generated API clients** for REST and gRPC-Web access to the `selfhost-backend`, alongside a regeneration script.
- **Full testing toolchain**: legacy `node:test` domain coverage, new Jest + React Testing Library suites, and
  Playwright smoke scenarios with ≥90% coverage enforcement.

## 🚀 Getting Started

1. **Install dependencies** (Node 20+):
   ```bash
   npm install
   ```
2. **Configure environment** variables (create `.env.local`):
   ```bash
   BACKEND_URL=http://localhost:4000
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   ```
3. **Generate API clients** from [`shared-specs`](https://github.com/evergreen-os/shared-specs) when specs change:
   ```bash
   npm run generate:clients
   ```
4. **Run the app in development**:
   ```bash
   npm run dev
   ```
5. **Execute the full test suite** (domain + Jest + coverage):
   ```bash
   npm test
   ```
6. **Launch Playwright smoke tests** once the dev server is running on `localhost:3000`:
   ```bash
   npm run test:e2e
   ```

## 🧱 Project Structure
```
selfhost-console/
├─ src/
│  ├─ app/                    # Next.js App Router (auth pages, dashboard, API routes)
│  ├─ components/             # shadcn-inspired UI primitives and layout shells
│  ├─ hooks/                  # React session store and utilities
│  ├─ features/               # Domain logic (auth, devices, policies, events, users)
│  ├─ lib/                    # Shared utilities, HTTP client helpers, server adapters
│  └─ tests/                  # Jest + Playwright suites
├─ gen/                       # Generated REST and gRPC clients
├─ docs/                      # Architecture, PRD, status tracking
├─ Dockerfile                 # Production build of the Next.js console
├─ docker-compose.yaml        # Console + backend development stack
└─ Makefile                   # Common workflows (install, dev, lint, test, docker)
```

## 🛡️ Security Practices
- Sessions are stored exclusively in **HttpOnly, SameSite=strict** cookies with automatic refresh.
- All backend requests go through centralized fetch wrappers with credential forwarding.
- RBAC checks hide privileged UI controls from Auditor accounts.
- Inputs are sanitized and validated prior to submission to the backend.

## 🧪 Testing Strategy
- **Domain**: existing `node:test` suites cover business logic for auth, devices, policies, events, and tenants.
- **Component/Integration**: Jest + React Testing Library verify login flows and session management.
- **E2E**: Playwright smoke scenario validates the login page rendering, ready for end-to-end expansion.
- **Coverage**: Jest enforces ≥90% coverage; CI runs lint, unit, coverage, and Playwright jobs.

## 🐳 Deployment
- Build the production image:
  ```bash
  make docker-build
  ```
- Run the console alongside the backend locally:
  ```bash
  docker compose up --build
  ```
- For Kubernetes or Helm deployments, publish the built image to your registry and provide the required environment
  variables (`BACKEND_URL`, `NEXT_PUBLIC_BACKEND_URL`).

## 📚 Further Reading
- [docs/prd.md](docs/prd.md) – Product requirements alignment
- [docs/architecture.md](docs/architecture.md) – Module and data flow overview
- [docs/status.md](docs/status.md) – Delivery status and next steps
