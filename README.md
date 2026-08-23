# Kirana Connect

Kirana Connect helps a customer find which **nearby kirana stores currently stock a
product**, compare each store's own price, see any discount that store is offering,
see how far away it is, pick a store, and get directions to it.

**It is not a delivery or checkout application.** There is no cart, no online
ordering, no payment, no rider assignment, and no delivery tracking. The customer
discovers availability and price, then goes to the store.

## Stack

### Consumer frontend (repository root, deployed to Vercel)

React - JavaScript only - Vite - Tailwind CSS - React Router - TanStack Query -
Zustand - React Hook Form - Zod - GSAP - Lucide React - Supabase JS client -
Leaflet / React Leaflet

### Admin frontend (`apps/admin`, deployed to Vercel)

React - JavaScript only - Vite - Tailwind CSS - React Router - TanStack Query -
React Hook Form - Zod - Lucide React - Supabase JS client

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
  apps/
    store/              Store Portal, a separate app deployed separately
      src/              auth/, components/, features/onboarding/, layouts/, pages/
      .env.example      Store Portal environment template
    admin/              Admin Panel, a separate app deployed separately
      src/              auth/, components/, features/admin/, layouts/, pages/
      .env.example      Admin Panel environment template
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

## Applications

Three separate frontends share one Express API and one Supabase project.

| App | Location | Dev port | Deploys to |
| --- | --- | --- | --- |
| Consumer | repository root | 5173 | kirana-connect.vercel.app |
| Store Portal | `apps/store` | 5174 | kirana-connect-store.vercel.app |
| Admin Panel | `apps/admin` | 5175 | kirana-connect-admin.vercel.app |
| Express API | `server` | 5000 | Render |

Each frontend is its own npm package with its own `node_modules`, `.env` and
Vite config. There is deliberately no monorepo tool: the prototype does not need
one.

The consumer site links to the Store Portal from one discreet footer entry,
"For businesses - Register your store". There is no admin link anywhere on the
public site, and no seller dashboard link in the consumer header.

The Admin Panel is reached directly by known admins. It is not linked from the
consumer UI.

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

### Store Portal

```bash
npm install --prefix apps/store
```

```bash
npm run dev --prefix apps/store
```

Serves on http://localhost:5174. Other scripts: `npm run build --prefix apps/store`,
`npm run lint --prefix apps/store`.

### Admin Panel

```bash
npm install --prefix apps/admin
npm run dev --prefix apps/admin
```

Serves on http://localhost:5175. Other scripts: `npm run build --prefix apps/admin`,
`npm run lint --prefix apps/admin`.

Run each app in its own terminal. The API must allow every frontend origin it
serves, so `CLIENT_URL` in `server/.env` is a comma-separated list.

## Environment files

No `.env` file is committed. Copy each template and fill it in locally.

### Frontend - `.env` at the repository root (from `.env.example`)

```
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STORE_PORTAL_URL=http://localhost:5174
```

`VITE_API_BASE_URL` points the customer app at the Express API. Discovery reads
go React -> Express -> Supabase; the frontend Supabase client is reserved for
authentication and other client-side Supabase work, so discovery components must
not query the database directly. In production set it to the deployed Render URL.

### Backend - `server/.env` (from `server/.env.example`)

```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Store Portal - `apps/store/.env` (from `apps/store/.env.example`)

```
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AUTH_REDIRECT_URL=http://localhost:5174/login
```

`VITE_AUTH_REDIRECT_URL` is where Supabase sends an owner after they confirm
their email, so the flow is not stuck on localhost in production. The Store
Portal uses the anon key only; the service-role key must never be exposed to a
Vite application.

### Admin Panel - `apps/admin/.env` (from `apps/admin/.env.example`)

```
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The Admin Panel uses the anon key only, and only for email/password login plus
persisted sessions. All privileged reads and writes go through `/api/admin/*` on
the Express backend with `Authorization: Bearer <supabase access token>`.

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
production set it to the deployed Vercel URLs. It is a comma-separated list
because one API serves the consumer site, the Store Portal and the Admin Panel.

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

## Customer screens

| Route | Purpose |
| --- | --- |
| `/` | Hero search, category browse, how it works |
| `/search?q=&category=&page=` | Catalogue results, paged, filterable by category |
| `/product/:slug` | Product detail and the price comparison across nearby shops |

The comparison is the point of the product: every verified shop stocking the
item, with that shop's own price, its saving against MRP, stock state, distance
and a "Go to store" link that opens walking directions. Location is optional
throughout; without it the list still works, simply without distances.

The customer's location lives in a small Zustand store because it is genuine
global client state that the header sets and several screens read, and it is
persisted so a returning visitor is not asked again. Server data stays in
TanStack Query.

### Product images

`products.image_url` is filled from the Open Food Facts family of open
databases by `server/scripts/fetchProductImages.mjs`. Category decides which
one is queried: food goes to Open Food Facts, personal care to Open Beauty
Facts, household to Open Products Facts.

```bash
node server/scripts/fetchProductImages.mjs --dry-run
```

Matching is deliberately cautious, since a wrong photo is worse than none on a
comparison page. Products with no confident match keep `image_url` null and
render as an initials tile. The photos are CC BY-SA and credited in the footer.

## Authentication and store onboarding

Supabase Auth owns identity for every app. The Store Portal signs owners in with
email and password, and Supabase persists and refreshes the session. The app
never copies the access token into its own state, and never logs it.

Authenticated API calls send `Authorization: Bearer <supabase access token>`.
The Express middleware verifies that token by asking Supabase Auth who it
belongs to rather than decoding the JWT locally, then attaches the verified
identity to the request. A missing, malformed or invalid token returns 401.

### Lifecycle

```
new auth account
      |  database trigger creates the profile
      v
profiles.role = customer            <- always, never set from the browser
      |  owner submits the onboarding wizard
      v
store created, is_verified = false  <- forced by the server, invisible publicly
      |  admin approval, a later milestone
      v
is_verified = true  +  profiles.role = seller
```

Two rules hold this together:

- **Role never travels from the browser.** Signup sends no metadata, and the
  registration endpoint writes only `full_name` and `phone`. Promotion to
  `seller` is an admin action performed with the service role.
- **`owner_id` and `is_verified` are server-owned.** They come from the verified
  token and are pinned in trusted code, so a crafted request body cannot claim
  another owner or self-approve a store.

An unverified store stays `is_active = true` but is invisible to customers,
because the public policy requires active **and** verified. Approval alone makes
it discoverable.

### Store onboarding endpoints

Both require a valid Bearer token and are scoped to the authenticated owner.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/store-onboarding/status` | The caller's own application: `no_application`, `pending` or `approved` |
| POST | `/api/store-onboarding` | Submit a store, its address and its weekly opening hours |

The slug is generated on the server from the store name, with collisions
resolved against the live table. A second submission from an owner who already
has a store returns 409 with their existing status rather than creating a
duplicate.

The Admin Panel now owns routine approval. Approving a store through
`/api/admin/stores/:id/approve` reads the trusted `stores.owner_id`, sets
`stores.is_verified = true`, and promotes only that owner profile to `seller`.
Rejecting an application deletes an unverified store submission; verified stores
must be unverified or deactivated instead.

### First admin bootstrap

There is no public admin signup. To create the first admin:

1. Create a normal Supabase Auth user.
2. Locate the matching `public.profiles` row.
3. Through trusted Supabase administration, set `profiles.role = 'admin'`.

After that, the Admin Panel can be used from http://localhost:5175.

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

### Admin endpoints

All `/api/admin/*` endpoints require a valid Supabase access token and a trusted
`profiles.role = 'admin'` resolved by the backend. Missing or invalid tokens
return 401. Authenticated non-admin users return 403. The frontend never sends a
service-role key and never performs privileged table mutations directly.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/me` | Current admin identity |
| GET | `/api/admin/dashboard` | Live counts and latest pending stores |
| GET | `/api/admin/stores/pending` | Pending store applications |
| GET | `/api/admin/stores` | Search/filter stores |
| GET | `/api/admin/stores/:id` | Store review detail with owner and hours |
| POST | `/api/admin/stores/:id/approve` | Verify store and promote its owner to seller |
| POST | `/api/admin/stores/:id/reject` | Delete an unverified application |
| PATCH | `/api/admin/stores/:id` | Toggle verified/active state |
| GET | `/api/admin/sellers` | Seller profile/store read view |
| GET/POST | `/api/admin/products` | List and create canonical products |
| GET/PATCH | `/api/admin/products/:id` | Read and edit a canonical product |
| GET/POST | `/api/admin/categories` | List and create categories |
| PATCH | `/api/admin/categories/:id` | Edit or activate/deactivate a category |
| GET/POST | `/api/admin/brands` | List and create brands |
| PATCH | `/api/admin/brands/:id` | Edit a brand |

## Deployment targets

- Consumer frontend: Vercel, building from the repository root.
- Store Portal: Vercel as a **separate project**, root directory `apps/store`.
  Its own environment variables, its own domain.
- Admin Panel: Vercel as a **separate project**, root directory `apps/admin`.
  Its own environment variables, its own domain.
- Backend: Render, with root directory `server`, build `npm install`, start `npm start`.
  Render supplies `PORT`; the remaining backend variables are set in the Render
  dashboard. No build step or TypeScript compilation is required.

## Branches

`main` is the stable branch. Feature work branches from `develop`.
