# Kirana Connect - database

PostgreSQL schema for Kirana Connect, running on Supabase.

Kirana Connect is a **nearby product discovery and price comparison** platform. A
customer searches for a product, sees which nearby physical kirana stores stock
it, compares each store's own price and discount, and walks or drives to the one
they pick. There is no cart, no checkout, no payment and no delivery, so there
are no tables for any of those.

## Contents

```
supabase/
  README.md
  migrations/
    20260822102000_initial_schema.sql
```

The migration is a normal Supabase CLI migration and is also safe to paste into
the Supabase SQL Editor. It is written to be idempotent: types are created
inside exception guards, tables and indexes use `if not exists`, and every
policy and trigger is dropped before being recreated. Re-running it will not
destroy data.

## Entity relationships

Arrows point from the child (the table holding the foreign key) to its parent.

```
auth.users                          managed by Supabase Auth
    |
    | profiles.id -> auth.users.id            ON DELETE CASCADE   (1:1)
    v
profiles
    |
    | stores.owner_id -> profiles.id          ON DELETE CASCADE   (1:N)
    v
stores ------------------------------+
    |                                |
    |                                | store_hours.store_id -> stores.id
    |                                v        ON DELETE CASCADE   (1:N)
    |                            store_hours
    |
    | store_products.store_id -> stores.id    ON DELETE CASCADE   (1:N)
    v
store_products
    |
    | store_products.product_id -> products.id  ON DELETE RESTRICT  (N:1)
    v
products
    |
    +-- products.category_id -> categories.id   ON DELETE RESTRICT  (N:1, required)
    |
    +-- products.brand_id    -> brands.id       ON DELETE SET NULL  (N:1, optional)
```

`store_products` is the join between `stores` and `products`, carrying the
commercial data that belongs to that pairing. A single canonical product row is
referenced by every store that sells it.

### On-delete choices

| Relationship | Action | Why |
| --- | --- | --- |
| `profiles` -> `auth.users` | CASCADE | Deleting the account removes the profile. |
| `stores` -> `profiles` | CASCADE | A store cannot outlive its owner. RESTRICT here would make account deletion fail, since the profile delete is itself cascaded from `auth.users`. |
| `store_hours` -> `stores` | CASCADE | Opening hours are meaningless without the store. |
| `store_products` -> `stores` | CASCADE | Inventory belongs to the store. |
| `store_products` -> `products` | RESTRICT | A catalogue entry that stores are actively stocking must not vanish. Set `products.is_active = false` instead. |
| `products` -> `categories` | RESTRICT | Deleting a category must not silently orphan the catalogue. |
| `products` -> `brands` | SET NULL | A product survives losing its brand; `brand_id` is nullable. |

## Canonical product vs store product

`products` is the **canonical catalogue**. One row describes one item as it
exists in the world:

> "Amul Taaza Toned Milk 500 ml" - category Dairy, brand Amul, unit label
> `500 ml`, MRP 33.00, one barcode.

`store_products` is the **commercial record for one store selling that item**:

> Store A sells that product for 31.00 with 5% off, low stock.
> Store B sells the same product for 29.50, in stock.

### Why price lives in `store_products`

Price comparison is the entire point of the application. If a price lived on
`products` there would be exactly one price per item and nothing to compare.
Every store sets its own `selling_price` and `discount_percentage`, so those
columns belong to the (store, product) pair, not to the product.

`products.mrp` is different: it is the printed maximum retail price, a property
of the item itself, and it is what the customer's saving is measured against.

### Why availability lives in `store_products`

"Is it in stock" is only ever true or false *at a particular store*. The same
canonical product is in stock at one shop and sold out at the shop next door, so
`stock_status`, `quantity_available`, `is_available` and `last_stock_update` sit
on the pairing. A `unique (store_id, product_id)` constraint guarantees one row
per store per product, so there is never an ambiguous price.

Catalogue attributes are never copied into `store_products`. A store row carries
foreign keys and commercial figures, nothing else.

## Money and coordinates

- `mrp` and `selling_price` are `numeric(10, 2)`. `discount_percentage` is
  `numeric(5, 2)` constrained to 0-100. Floating point is never used for money.
- All money columns carry non-negative CHECK constraints.
- `latitude` / `longitude` are `numeric(9, 6)`, roughly 11 cm of resolution, with
  range checks and a constraint that both are set or both are NULL.
- All timestamps are `timestamptz` defaulting to `now()`.

`selling_price <= mrp` is **not** enforced, because a CHECK constraint cannot
reach across tables. Validate it in the seller-facing API when that is built.

## Proximity without PostGIS

PostGIS is deliberately not a dependency. Nearby search is intended to run as:

1. compute a latitude/longitude bounding box around the customer,
2. let `stores_public_coordinates_idx` range-scan it,
3. rank the small result set by true distance in the application.

If precise geographic operators or radius joins are needed later, PostGIS or
`earthdistance` can be added without changing these columns.

## Search

`pg_trgm` is installed into the `extensions` schema, with GIN trigram indexes on
`products.name` and `stores.name`. That makes `ILIKE '%term%'` index-assisted,
which a B-tree cannot do, and it tolerates the spelling variation common in
Indian brand names. No external search service is used; PostgreSQL is the search
platform. A `tsvector` column can be layered on later without a breaking change.

## Indexes

| Index | Purpose |
| --- | --- |
| `stores_owner_id_idx` | Seller dashboard, and every RLS ownership check. |
| `stores_city_locality_idx` | Area browsing. Partial on active+verified. Leading column `city` also serves city-only filters, so no separate city index exists. |
| `stores_public_coordinates_idx` | Bounding-box prefilter for nearby search. Partial on active+verified rows that actually have coordinates. |
| `stores_name_trgm_idx` | Store name substring search. |
| `products_category_id_idx` | Category browsing. Partial on active. |
| `products_brand_id_idx` | Brand filtering. Partial, since `brand_id` is nullable. |
| `products_name_trgm_idx` | Product name substring search - the main customer entry point. |
| `store_products_store_product_unique` | Uniqueness, and it also serves `store_id` lookups, so no separate `store_id` index exists. |
| `store_products_product_price_idx` | The price-comparison query: stores stocking product X, cheapest first. Ordering is satisfied by the index. |
| `store_products_store_stock_idx` | Store inventory listing filtered by stock state. |

Standalone indexes on `is_active`, `is_verified` and `is_available` are
deliberately absent. Two- and three-valued columns are poor B-tree candidates;
they appear as partial-index predicates instead, which is smaller and more
selective.

## Timestamps

One reusable function, `public.set_updated_at()`, is attached as a `BEFORE
UPDATE` trigger to all seven tables rather than duplicating the logic per table.

`store_products.last_stock_update` has a second trigger,
`public.set_stock_timestamp()`, which advances it only when `stock_status`,
`quantity_available` or `is_available` actually changes. A price edit therefore
does not falsely claim the stock was just checked.

## Row Level Security

RLS is enabled on all seven application tables and is never switched off for
convenience. Two mechanisms work together:

- **RLS policies decide which rows** a role may see or touch.
- **Column privileges decide which columns** a role may write.

Both are necessary. An `UPDATE` policy alone cannot stop a user from writing
`profiles.role`, because the policy only tests rows. So privileged columns are
simply never granted to end users.

### Who can read what

| Table | anon / customer sees |
| --- | --- |
| `categories` | rows where `is_active` |
| `brands` | all rows |
| `products` | rows where `is_active` |
| `stores` | rows where `is_active AND is_verified` |
| `store_hours` | rows whose store is active and verified |
| `store_products` | rows where `is_available`, **and** the store is active and verified, **and** the product is active |
| `profiles` | nothing - `anon` holds no grant at all; an authenticated user sees only their own row |

Public visibility of `store_products` is transitive on purpose. Without the
store check, the inventory and pricing of an unverified store would leak even
though the store itself is hidden. Un-verifying a store immediately hides its
inventory, and deactivating a product immediately hides it across every store.

### Profiles and role escalation

`profiles.role` is privileged. A customer must never be able to make themselves
a seller or an admin. Three independent defences:

1. **Column privileges.** `authenticated` is granted
   `UPDATE (full_name, phone, avatar_url)` only. `role` is not grantable, so an
   update touching it fails with `permission denied` before any policy runs.
2. **A guard trigger.** `public.guard_profile_privileged_columns()` raises if
   `role` or `id` changes. It is deliberately `SECURITY INVOKER`, so
   `current_user` resolves to the caller's PostgREST role and the trusted
   `service_role` / `postgres` path is still allowed through.
3. **No INSERT policy.** Profiles are created only by the signup trigger, so a
   user cannot insert a fresh row for themselves with an elevated role.

There is also no DELETE policy; a profile disappears with its `auth.users` row.

### Seller ownership

Ownership is always resolved **from the database**, never from a client-supplied
id. `public.owns_store(uuid)` is a `SECURITY DEFINER` function that checks
`stores.owner_id = auth.uid()`, and every seller policy on `store_products` and
`store_hours` calls it. Being `SECURITY DEFINER` also avoids recursing through
the `stores` policies, and it returns only a boolean, so no row data leaks. Each
such function pins `search_path` to `''` and fully qualifies every reference.

Sellers may select, insert and update their own stores. Two columns are withheld
from them:

- `stores.is_verified` - not in any grant, so a seller cannot self-verify into
  public search results. Verification is an admin/backend action.
- `store_products.store_id` and `product_id` - granted on INSERT but not on
  UPDATE, so a seller cannot re-point an owned inventory row at another store.

Creating a store additionally requires `public.is_seller()`, that is, a profile
already carrying `role = 'seller'`. Since role changes are backend-only, seller
onboarding is necessarily an approved action rather than self-service.

### Admin access

There is **no admin RLS policy, on purpose.** A policy that reads a role out of
the request JWT or out of user metadata is only as trustworthy as the client
that supplied it, and Supabase user metadata is user-editable. Until there is a
vetted claim source, all administrative work runs through the Express backend
with the Supabase **service role**:

- verifying and unverifying stores
- curating categories, brands and products
- promoting a profile to `seller` or `admin`

The service role bypasses RLS entirely. It lives only in `server/.env` and in
the Render environment, is never exposed as a `VITE_` variable, and must never
reach the browser. The frontend uses the anon key and is fully governed by the
policies above.

## Applying the migration

The migration in this directory has **not** been applied to any hosted Supabase
project by this repository. Apply it yourself, once.

### Option A - Supabase SQL Editor

1. Open your project, then SQL Editor, then New query.
2. Paste the full contents of `migrations/20260822102000_initial_schema.sql`.
3. Run it. It should complete with no errors.

### Option B - Supabase CLI

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### After applying

Check in the dashboard that:

- Database, Tables lists all seven tables with RLS enabled.
- Authentication, Policies shows the policies for each table.
- Creating a test user through Authentication produces a matching `profiles` row
  with `role = 'customer'`.

Categories, brands and products are intentionally **not** seeded. Seed data
belongs in its own file or in an admin tool, not in the schema migration.
