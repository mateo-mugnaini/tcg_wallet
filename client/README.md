# TCG Wallet frontend

Frontend base built with Vite, React, React Redux and CSS Modules.

## Architecture

The application is organized as routes, pages, reusable components and backend domains under `src/redux/actions`:

- `/auth`: public authentication page with login and registration.
- `/dashboard`: protected initial application page.
- `/catalog`: TCGs, sets, cards and card prices.
- `/collection`: collection items, stats and estimated value.
- `/grading`: grading companies.
- `/profile`: authenticated user profile.
- `/admin/sync` and `/admin/users`: protected operational/admin views.

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

New pages follow the `<domain>/<domain>Pages.jsx` and `<domain>Pages.module.css` convention. Components used only by one page live under that page's `components/<ComponentName>/` folder with its JSX and CSS Module; shared components stay under `src/components`.

The access token stays in memory. Only the current user is persisted locally; refresh remains delegated to the backend `httpOnly` cookie. On startup the app calls `/auth/refresh`, and while the app is open it renews the access token one minute before expiration. A new login is required only after explicit logout, refresh-token expiration/revocation, or an unrecoverable session error.

## Development

```bash
pnpm install
pnpm dev
```

The development server runs at `http://localhost:5173`.

## Validation

```bash
pnpm lint
pnpm test
pnpm build
pnpm check:build
```

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` when the API is ready to be connected. Do not commit `.env.local` or secrets.

Component-scoped styles use the `*.module.css` convention. Global resets and design tokens belong in `src/styles/global.css`.

## Release

The frontend is a static Vite application. Configure the public backend URL at build time:

```bash
VITE_API_BASE_URL=https://api.example.com/api pnpm build
```

The production build stops at startup with a visible configuration error when this variable is missing or does not use `http://` or `https://`. Only public configuration belongs in `VITE_*` variables; never put passwords, refresh tokens or private API keys in the frontend.

Deploy the contents of `dist/` with SPA fallback enabled so unknown paths serve `index.html`. The backend must allow the frontend origin through its CORS configuration and support credentials for the refresh cookie.
