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
    animations/         GSAP helpers, all motion-preference aware
    components/common/  Button, IconButton, SearchBar, Badge, PriceDisplay, ...
    features/home/      home page sections
    layouts/            CustomerLayout, SiteHeader, SiteFooter
    lib/                api.js, queryClient.js, supabase.js, cn.js
    hooks/  pages/  routes/  services/  store/  utils/  assets/
    App.jsx      main.jsx    index.css   design tokens live in index.css
  supabase/             database
    README.md           schema architecture and RLS notes
    migrations/         SQL migrations
    seed/               optional sample catalogue and demo stores
  server/               backend package
    package.json
    .env.example        backend environment template
    src/
      app.js            express app wiring
      server.js         process entrypoint
      config/           env.js, supabase.js
      routes/           index.js and one module per area
      controllers/      request parsing and responses
      services/         Supabase queries and business rules
      middleware/       notFound.js, errorHandler.js
      utils/            geo.js, queryParams.js, httpError.js
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
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`VITE_API_BASE_URL` points the customer app at the Express API. Discovery reads
go React -> Express -> Supabase; the frontend Supabase client is reserved for
authentication and other client-side Supabase work, so discovery components must
not query the database directly. In production set it to the deployed Render URL.

### Backend - `server/.env` (from `server/.env.example`)

```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Key separation

The browser only ever receives the Supabase **anon** key, through `VITE_` variables.
The Supabase **service role key** bypasses row level security and lives only in
`server/.env` and in the Render environment. It must never appear in a `VITE_`
variable, in the browser bundle, or in a committed file.

The backend holds **both** keys and uses them for different jobs. Public discovery
endpoints go through an anon-key client, so row level security still filters every
result: if a condition is ever forgotten in application code, the database remains
the backstop. The service-role client is reserved for privileged work such as
verifying a store or promoting a profile to seller.

`CLIENT_URL` is the origin the API accepts cross-origin browser requests from. In
production set it to the deployed Vercel URL. Multiple origins may be given as a
comma-separated list.

## Database

The PostgreSQL schema lives in `supabase/migrations/` and is documented in
[supabase/README.md](supabase/README.md).

Seven tables: `profiles`, `stores`, `store_hours`, `categories`, `brands`,
`products`, `store_products`.

The model that matters: `products` is the canonical catalogue - one row per real
item, store independent. `store_products` joins a store to a product and holds
that store's own `selling_price`, `discount_percentage` and stock state. That is
what makes price comparison across nearby stores possible.

Row Level Security is enabled on every table. Customers read only active,
verified data; sellers manage only what they own; role changes and store
verification are service-role operations performed by the backend.

The migration is not applied automatically. See
[supabase/README.md](supabase/README.md) for how to run it against your project.

### Seed data

`supabase/seed/` holds optional sample content, kept out of the migration because
a migration describes structure and a seed describes content. Both files are safe
to re-run.

- `01_catalogue.sql` - categories, brands and canonical products. No dependencies.
- `02_demo_stores.sql` - three verified Mumbai stores with overlapping inventory at
  different prices, so price comparison has something real to compare. Requires a
  `profiles.id` to be pasted in first; it refuses to run with the placeholder.

## API

All responses are JSON and share the shape `{ "success": true, "data": ... }`, or
`{ "success": false, "error": { "message": ... } }` on failure. List endpoints add
a `meta` object with paging information.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service liveness check |
| GET | `/api/categories` | Active categories |
| GET | `/api/brands` | All brands |
| GET | `/api/products` | Browse and search the catalogue |
| GET | `/api/products/:slug` | One canonical product |
| GET | `/api/products/:slug/stores` | **Price comparison.** Nearby stores stocking the product |
| GET | `/api/stores/nearby` | Stores near a coordinate |
| GET | `/api/stores/:slug` | One store, with opening hours |

### Query parameters

`/api/products` accepts `q` (name search), `category` and `brand` (slugs), plus
`limit` (1-50, default 20) and `offset`.

`/api/stores/nearby` requires `lat` and `lng`, and accepts `radius` in kilometres
(0.1-50, default 5) plus `limit` and `offset`.

`/api/products/:slug/stores` accepts optional `lat`, `lng` and `radius`, and
`sort` of either `price` (default) or `distance`. Without coordinates it returns
every store stocking the product, cheapest first; `sort=distance` requires them.

### Price comparison response

Each offer carries the store, that store's own price, and how it compares:

- `selling_price` - what this store charges
- `discount_percentage` - the store's own advertised offer
- `savings` and `savings_percentage` - computed against the product's printed MRP
- `is_cheapest` - true on the lowest-priced offer
- `distance_km` - present when coordinates were supplied

Nearby search uses a bounding box in the database followed by true great-circle
distances in the application, which is why the project needs no PostGIS.

There are no authentication, seller or admin endpoints yet.

## Deployment targets

- Frontend: Vercel, building from the repository root.
- Backend: Render, with root directory `server`, build `npm install`, start `npm start`.
  Render supplies `PORT`; the remaining backend variables are set in the Render
  dashboard. No build step or TypeScript compilation is required.

## Branches

`main` is the stable branch. Feature work branches from `develop`.
