# EvergreenOS Selfhost Console – Delivery Status

## ✅ Completed
- Next.js App Router shell with login and RBAC-guarded dashboard routes.
- Devices, policies, events, users, and tenants screens wired to Buf-generated REST and gRPC clients and domain helpers.
- Session management with HttpOnly cookies, auto-refresh, and route guards.
- Policy editor with schema validation, signature toggles, and app catalogue support.
- Event timeline filters and CSV/JSON exports.
- User invites, role changes, and tenant hierarchy management for reseller scenarios.
- Dockerfile, docker-compose, and Makefile for local/CI deployment.
- Jest + React Testing Library suites plus Playwright smoke scenario and 90% coverage gate.

## 🚧 In progress / Next steps
- Expand Playwright coverage to exercise login → policy publish → device update end-to-end flows.
- Harden error handling and toast notifications across all forms.
- Add accessibility audits (axe) and visual regression tests.

## 📊 Metrics
- Jest coverage threshold: 90% (enforced).
- Playwright smoke test executed via `npm run test:e2e`.
- Docker image builds via `make docker-build`.
