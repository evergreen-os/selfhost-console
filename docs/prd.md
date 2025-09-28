# EvergreenOS Selfhost Console – PRD Alignment

This repository now implements the UI flows and tooling described in the EvergreenOS selfhost PRD:

| Capability | Status |
|------------|--------|
| Next.js + Tailwind application shell | ✅ Implemented with App Router and shadcn-inspired components |
| Authentication & session refresh | ✅ Login page + API routes storing JWTs in HttpOnly cookies, auto refresh |
| Device list & detail view | ✅ Tables, filters, detail panels, sync/decommission actions |
| Policy catalogue & editor | ✅ CRUD UI, schema validation, signature state, app catalogue |
| Event/audit timeline | ✅ Filterable timeline with CSV/JSON export |
| User & tenant management | ✅ Role invites/updates and reseller-aware hierarchy tree |
| REST + gRPC-Web generated clients | ✅ Placeholder generator produces typed clients in `gen/` |
| Testing toolchain (Jest, RTL, Playwright, coverage) | ✅ Added with ≥90% coverage gate |
| Docker/Compose deployment | ✅ Multi-stage Dockerfile and docker-compose stack |

Open questions from the PRD are tracked in [docs/status.md](status.md).
