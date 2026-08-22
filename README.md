# Kirana Connect

Kirana Connect helps a customer find which **nearby kirana stores currently stock a
product**, compare each store's own price, see any discount that store is offering,
see how far away it is, pick a store, and get directions to it.

**It is not a delivery or checkout application.** There is no cart, no online
ordering, no payment, no rider assignment, and no delivery tracking. The customer
discovers availability and price, then goes to the store.

## Stack

### Frontend (repository root, deployed to Vercel)

React - JavaScript only - Vite - Tailwind CSS - React Router - TanStack Query -
Zustand - React Hook Form - Zod - GSAP - Lucide React - Supabase JS client -
Leaflet / React Leaflet

### Backend (`server/`, deployed to Render)

Node.js - Express - JavaScript only (ES modules) - Supabase JS client

### Data, auth and storage

Supabase

### Typography and icons

Primary font is **Parkinsans** (Google Fonts), falling back to `system-ui, sans-serif`.
Icons come from `lucide-react` only - no emojis, no Font Awesome, no Material Icons,
no Bootstrap Icons, no other icon packs.

## Project structure

```
kirana-connect/
  index.html
  vite.config.js
  package.json          frontend package
  .env.example          frontend environment template
  public/
  src/                  frontend source
    animations/  assets/     components/  features/
    hooks/       layouts/    lib/         pages/
    routes/      services/   store/       utils/
    App.jsx      main.jsx    index.css
  server/               backend package
    package.json
    .env.example        backend environment template
    src/
      app.js            express app wiring
      server.js         process entrypoint
      config/           env.js, supabase.js
      routes/           index.js, health.routes.js
      controllers/      health.controller.js
      middleware/       notFound.js, errorHandler.js
      services/
      utils/
```

The frontend and the backend are separate npm packages with separate
`node_modules` and separate environment files.

## Development

### Frontend

```bash
npm install
npm run dev
```

Serves on http://localhost:5173.

Other frontend scripts: `npm run build`, `npm run preview`, `npm run lint`.

### Backend

```bash
npm install --prefix server
npm run dev --prefix server
```

Serves on http://localhost:5000 with nodemon reload. Use `npm start --prefix server`
for a plain, production-style start.

Run both in separate terminals during development.

## Environment files

Neither `.env` file is committed. Copy each template and fill it in locally.

### Frontend - `.env` at the repository root (from `.env.example`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Backend - `server/.env` (from `server/.env.example`)

```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Key separation

The browser only ever receives the Supabase **anon** key, through `VITE_` variables.
The Supabase **service role key** bypasses row level security and lives only in
`server/.env` and in the Render environment. It must never appear in a `VITE_`
variable, in the browser bundle, or in a committed file.

`CLIENT_URL` is the origin the API accepts cross-origin browser requests from. In
production set it to the deployed Vercel URL. Multiple origins may be given as a
comma-separated list.

## API

The backend currently exposes a single endpoint.

| Method | Path          | Purpose                              |
| ------ | ------------- | ------------------------------------ |
| GET    | `/api/health` | Service liveness check. Returns 200. |

```json
{
  "success": true,
  "service": "kirana-connect-api",
  "status": "healthy",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

No product, store, or authentication endpoints exist yet.

## Deployment targets

- Frontend: Vercel, building from the repository root.
- Backend: Render, with root directory `server`, build `npm install`, start `npm start`.
  Render supplies `PORT`; the remaining backend variables are set in the Render
  dashboard. No build step or TypeScript compilation is required.

## Branches

`main` is the stable branch. Feature work branches from `develop`.
