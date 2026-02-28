# Hotel System — AI Agent Instructions

## Architecture

Monorepo with two apps:

- `apps/frontend/` — React 19 + TypeScript CRA SPA, port **3000**
- `apps/backend/` — Express 4 + TypeScript + Prisma 6 + PostgreSQL, port **3001**
- `packages/shared-types/` — stub, not yet wired up

All frontend data is currently **in-memory mock state**. No real API routes exist yet beyond `GET /health`. Adding a feature means: (1) implement the Express router in `apps/backend/src/modules/<resource>/`, mount it in `server.ts`; (2) replace the `useState(INITIAL_DATA)` with a `useEffect` + `api.<method>()` call in the relevant component.

## Build and Test

```bash
# Start both servers
bash start-dev.sh

# Backend (apps/backend/)
npm run dev          # ts-node-dev hot-reload
npm run prisma:migrate   # apply DB schema
npm run prisma:studio    # GUI DB browser

# Frontend (apps/frontend/)
npm start            # localhost:3000
npm test             # Jest + Testing Library

# Type-check only
cd apps/backend  && npx tsc --noEmit
cd apps/frontend && npx tsc --noEmit
```

## Code Style

- **Section banners** delimit each file region: `// ─── Types ───`, `// ─── Constants ───`, `// ─── Main Component ───`
- **Status/type values** are Chinese string literals (`"可用" | "已入住" | "清洁中"`), never TypeScript enums
- **Constants** in `SCREAMING_SNAKE_CASE`: `INITIAL_ROOMS`, `STATUS_COLORS`, `DEFAULT_FORM`
- **IDs**: `string` — `cuid()` in Prisma; `Date.now().toString()` in mock data
- `React.FC` on every component; `useCallback` wraps CSV export and other expensive callbacks

## Project Conventions

**Page component layout** (see [RoomManagement.tsx](apps/frontend/src/components/RoomManagement.tsx)):

1. Types → Constants → `React.FC` with state → handlers → JSX

**Form validation** — always a `validate(): boolean` function that populates `formErrors` state; `handleSave()` returns early if `!validate()`. Inline error messages rendered below each field.

**CSV export** — every list page exports via `useCallback`; prepend `"\uFEFF"` BOM for Excel/Chinese compatibility.

**Toast**: `{ msg, type: "success"|"error" } | null` state, auto-clears after 3 s, rendered `fixed top-6 right-6 z-50`.

**All pages use `<Layout>`** from [Layout.tsx](apps/frontend/src/components/Layout.tsx) — do not add standalone headers or nav.

## Integration Points

- Frontend API calls go through [api/client.ts](apps/frontend/src/api/client.ts) — use `api.<resource>.<method>()`, never raw axios
- `REACT_APP_API_URL` (frontend) and `PORT` / `FRONTEND_URL` (backend) control connection; both fall back to localhost defaults
- Backend CORS allows only `FRONTEND_URL` origin; update env rather than widening `cors()` options
- Planned REST shape: `/api/rooms`, `/api/bookings`, `/api/guests`, `/api/dashboard`, `/api/stats?range=30d`
- Prisma models: `Room`, `Booking`, `Guest`, `User`, `Order`, `Service`, `ServiceOrder` — see [schema.prisma](apps/backend/prisma/schema.prisma)
