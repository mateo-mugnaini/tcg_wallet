# TCG Wallet frontend

Frontend base built with Vite, React and CSS Modules.

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
