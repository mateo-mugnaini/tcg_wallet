# TCG Wallet frontend

Frontend base built with Vite, React, React Redux and CSS Modules.

## Architecture

The application is organized as pages, reusable components and backend domains under `src/redux/actions`:

- `auth`: login, refresh and logout.
- `users`: profile and administrative user operations.
- `catalog`: TCGs, sets and cards.
- `prices`: normal and graded card prices.
- `collection`: collection items, stats and estimated value.
- `grading`: grading companies.
- `sync`: background jobs and synchronization triggers.
- `health`: liveness and readiness checks.
- `platform`: OpenAPI and operational metrics endpoints.

Each domain exposes Redux Toolkit async actions under `src/redux/actions/<domain>/<http-method>/`. Reducers live in `src/redux/slices/`, and the shared HTTP client in `src/lib/http` handles query parameters, JSON, cookies, access-token refresh and normalized API errors.

The access token stays in memory. Only the current user is persisted locally; refresh remains delegated to the backend `httpOnly` cookie.

## Development

```bash
pnpm install
pnpm dev
```

The development server runs at `http://localhost:5173`.

## Validation

```bash
pnpm lint
pnpm build
```

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` when the API is ready to be connected. Do not commit `.env.local` or secrets.

Component-scoped styles use the `*.module.css` convention. Global resets and design tokens belong in `src/index.css`.
