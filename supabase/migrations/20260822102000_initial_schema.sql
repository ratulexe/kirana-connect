-- =============================================================================
-- Kirana Connect - initial database schema
-- =============================================================================
-- Nearby product discovery and price comparison.
--
-- Scope of this migration:
--   profiles, stores, store_hours, categories, brands, products, store_products
--
-- Deliberately NOT in scope: carts, orders, checkout, payments, deliveries,
-- riders, wishlists, reviews, coupons. Kirana Connect is a discovery product,
-- not a delivery or checkout product.
--
-- This script is idempotent so it can be re-run safely from the Supabase SQL
-- Editor, and it is laid out as a normal Supabase CLI migration.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------
-- Supabase already provides the `extensions` schema; the guard keeps this file
-- runnable on a plain PostgreSQL instance too.
create schema if not exists extensions;

-- pg_trgm powers substring / fuzzy matching on product and store names. It lets
-- ILIKE '%term%' use an index, which plain B-tree cannot do. Chosen over an
-- external search service, and over tsvector, because catalogue names are short
-- and benefit more from trigram matching than from stemming.
create extension if not exists pg_trgm with schema extensions;

-- PostGIS is intentionally NOT required. Proximity is handled with a bounding
-- box over latitude/longitude plus application-side distance ranking, so the
-- project does not take a hard dependency on PostGIS this early.


-- -----------------------------------------------------------------------------
-- 2. Enumerated types
-- -----------------------------------------------------------------------------
do $$
begin
  create type public.user_role as enum ('customer', 'seller', 'admin');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock');
exception
  when duplicate_object then null;
end
$$;


-- -----------------------------------------------------------------------------
-- 3. Shared trigger function for updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Single reusable BEFORE UPDATE trigger maintaining updated_at on every table.';


-- -----------------------------------------------------------------------------
-- 4. profiles
-- -----------------------------------------------------------------------------
-- One row per auth.users row. Never stores passwords; Supabase Auth owns
-- credentials entirely.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'customer',
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_full_name_length
    check (full_name is null or char_length(full_name) between 1 and 120),
  constraint profiles_phone_length
    check (phone is null or char_length(phone) between 6 and 20)
);

comment on table public.profiles is
  'Application profile for each auth.users row. role is privileged and cannot be set by the account holder.';


-- -----------------------------------------------------------------------------
-- 5. categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint categories_name_not_blank check (char_length(btrim(name)) > 0),
  constraint categories_slug_format    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);


-- -----------------------------------------------------------------------------
-- 6. brands
-- -----------------------------------------------------------------------------
create table if not exists public.brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  logo_url   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_not_blank check (char_length(btrim(name)) > 0),
  constraint brands_slug_format    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);


-- -----------------------------------------------------------------------------
-- 7. products  (canonical catalogue)
-- -----------------------------------------------------------------------------
-- A product row is the global, store-independent description of an item, e.g.
-- "Amul Taaza Toned Milk 500 ml". It carries no store price and no stock. Every
-- store that sells it references this same row through store_products.
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  brand_id    uuid references public.brands (id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  barcode     text unique,
  unit_label  text not null,
  mrp         numeric(10, 2) not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint products_name_not_blank       check (char_length(btrim(name)) > 0),
  constraint products_slug_format          check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_barcode_not_blank    check (barcode is null or char_length(btrim(barcode)) > 0),
  constraint products_unit_label_not_blank check (char_length(btrim(unit_label)) > 0),
  constraint products_mrp_non_negative     check (mrp >= 0)
);

comment on table public.products is
  'Canonical catalogue. Store-specific price, stock and discount live in store_products.';
comment on column public.products.mrp is
  'Printed maximum retail price. Fixed-precision numeric; never a float.';
comment on column public.products.barcode is
  'Optional. UNIQUE permits many NULLs in PostgreSQL, so it is unique only when supplied.';


-- -----------------------------------------------------------------------------
-- 8. stores  (physical kirana stores)
-- -----------------------------------------------------------------------------
create table if not exists public.stores (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  name           text not null,
  slug           text not null unique,
  description    text,
  phone          text,
  address_line_1 text not null,
  address_line_2 text,
  locality       text not null,
  city           text not null,
  state          text not null,
  postal_code    text not null,
  latitude       numeric(9, 6),
  longitude      numeric(9, 6),
  is_active      boolean not null default true,
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint stores_name_not_blank     check (char_length(btrim(name)) > 0),
  constraint stores_slug_format        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint stores_phone_length       check (phone is null or char_length(phone) between 6 and 20),
  constraint stores_postal_code_length check (char_length(btrim(postal_code)) between 4 and 12),
  constraint stores_latitude_range     check (latitude is null or latitude between -90 and 90),
  constraint stores_longitude_range    check (longitude is null or longitude between -180 and 180),
  -- A half-set coordinate is never useful for proximity search.
  constraint stores_coordinates_paired check ((latitude is null) = (longitude is null))
);

comment on table public.stores is
  'Physical kirana stores. owner_id is deliberately NOT unique: a seller may own several stores.';
comment on column public.stores.is_verified is
  'Set only by the trusted backend / admin. Sellers hold no column privilege on it, so it cannot be self-granted.';
comment on column public.stores.latitude is
  'numeric(9,6) gives ~11 cm resolution with no floating-point drift. Nullable until geocoded; verification should require it.';


-- -----------------------------------------------------------------------------
-- 9. store_hours
-- -----------------------------------------------------------------------------
-- Included because "is this store open right now" is part of the core
-- go-to-the-store journey. Deliberately simple: a weekly pattern only, with no
-- holiday or seasonal scheduling.
create table if not exists public.store_hours (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores (id) on delete cascade,
  day_of_week smallint not null,
  opens_at    time,
  closes_at   time,
  is_closed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint store_hours_day_range check (day_of_week between 0 and 6),
  -- Either the store is shut that day and has no times, or it is open and has
  -- both. closes_at < opens_at stays legal so a shop can trade past midnight.
  constraint store_hours_times_coherent check (
    (is_closed and opens_at is null and closes_at is null)
    or (not is_closed and opens_at is not null and closes_at is not null)
  ),
  constraint store_hours_store_day_unique unique (store_id, day_of_week)
);

comment on column public.store_hours.day_of_week is
  '0 = Sunday .. 6 = Saturday, matching PostgreSQL extract(dow).';


-- -----------------------------------------------------------------------------
-- 10. store_products  (store x product commercial record)
-- -----------------------------------------------------------------------------
-- The heart of the model. Two different stores selling the same canonical
-- product each get their own row, which is exactly what makes price comparison
-- possible. No product attributes are copied down here.
create table if not exists public.store_products (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores (id) on delete cascade,
  product_id          uuid not null references public.products (id) on delete restrict,
  selling_price       numeric(10, 2) not null,
  stock_status        public.stock_status not null default 'in_stock',
  quantity_available  integer,
  discount_percentage numeric(5, 2) not null default 0,
  is_available        boolean not null default true,
  last_stock_update   timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint store_products_store_product_unique unique (store_id, product_id),
  constraint store_products_selling_price_non_negative check (selling_price >= 0),
  constraint store_products_quantity_non_negative     check (quantity_available is null or quantity_available >= 0),
  constraint store_products_discount_range            check (discount_percentage >= 0 and discount_percentage <= 100),
  -- An out-of-stock line must not advertise itself as available.
  constraint store_products_availability_coherent check (
    not (stock_status = 'out_of_stock' and is_available)
  )
);

comment on table public.store_products is
  'One row per (store, product). Holds store-specific price, stock and discount; never duplicates catalogue data.';
comment on column public.store_products.selling_price is
  'What THIS store charges. Price lives here, not on products, because comparing stores is the product.';
comment on column public.store_products.quantity_available is
  'Nullable on purpose: many kirana sellers track only a coarse stock_status, not exact units.';
comment on column public.store_products.last_stock_update is
  'Maintained by trigger whenever stock_status, quantity_available or is_available changes.';


-- -----------------------------------------------------------------------------
-- 11. Indexes
-- -----------------------------------------------------------------------------
-- Note on booleans: standalone B-tree indexes on is_active / is_verified /
-- is_available are NOT created. They hold two or three distinct values, so the
-- planner would rarely choose them. They appear instead as partial-index
-- predicates below, which is both smaller and more selective.

-- stores ----------------------------------------------------------------------
-- Seller dashboard lookups and every ownership check in RLS.
create index if not exists stores_owner_id_idx
  on public.stores (owner_id);

-- Browsing by area. The leading column city also serves city-only filters, so
-- no separate city index is needed. Partial, because only publicly visible
-- stores are ever browsed this way.
create index if not exists stores_city_locality_idx
  on public.stores (city, locality)
  where is_active and is_verified;

-- Bounding-box prefilter for "stores near me": the planner range-scans latitude,
-- then filters longitude, before the application ranks by true distance. Partial
-- keeps it to rows that can actually be shown and that have coordinates.
create index if not exists stores_public_coordinates_idx
  on public.stores (latitude, longitude)
  where is_active and is_verified and latitude is not null;

-- Store name search via ILIKE '%term%', which a B-tree cannot accelerate.
create index if not exists stores_name_trgm_idx
  on public.stores using gin (name extensions.gin_trgm_ops);

-- products ---------------------------------------------------------------------
create index if not exists products_category_id_idx
  on public.products (category_id)
  where is_active;

-- Partial: brand_id is nullable and unbranded rows are never filtered by brand.
create index if not exists products_brand_id_idx
  on public.products (brand_id)
  where brand_id is not null;

-- Primary customer entry point: substring product search.
create index if not exists products_name_trgm_idx
  on public.products using gin (name extensions.gin_trgm_ops);

-- store_products ---------------------------------------------------------------
-- store_products_store_product_unique already indexes (store_id, product_id),
-- so a separate store_id index would be redundant.

-- THE price-comparison query: "which stores stock product X, cheapest first".
-- Ordering by selling_price is satisfied by the index, avoiding a sort.
create index if not exists store_products_product_price_idx
  on public.store_products (product_id, selling_price)
  where is_available;

-- Store inventory listing filtered by stock state.
create index if not exists store_products_store_stock_idx
  on public.store_products (store_id, stock_status)
  where is_available;


-- -----------------------------------------------------------------------------
-- 12. updated_at and stock timestamp triggers
-- -----------------------------------------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

drop trigger if exists store_hours_set_updated_at on public.store_hours;
create trigger store_hours_set_updated_at
  before update on public.store_hours
  for each row execute function public.set_updated_at();

drop trigger if exists store_products_set_updated_at on public.store_products;
create trigger store_products_set_updated_at
  before update on public.store_products
  for each row execute function public.set_updated_at();

create or replace function public.set_stock_timestamp()
returns trigger
language plpgsql
as $$
begin
  if (new.stock_status is distinct from old.stock_status)
     or (new.quantity_available is distinct from old.quantity_available)
     or (new.is_available is distinct from old.is_available) then
    new.last_stock_update := now();
  end if;
  return new;
end;
$$;

drop trigger if exists store_products_set_stock_timestamp on public.store_products;
create trigger store_products_set_stock_timestamp
  before update on public.store_products
  for each row execute function public.set_stock_timestamp();


-- -----------------------------------------------------------------------------
-- 13. Automatic profile creation for new auth users
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER so the insert succeeds before the new user has any
-- privileges. role is NOT read from signup metadata, so a client cannot sign up
-- as a seller or admin; every account starts as a customer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )), ''),
    nullif(btrim(coalesce(
      new.phone,
      new.raw_user_meta_data ->> 'phone',
      ''
    )), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates the profiles row for a new auth.users row. Ignores any role supplied in signup metadata.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 14. Privilege-escalation guard on profiles
-- -----------------------------------------------------------------------------
-- Second line of defence behind the column privileges in section 16. This
-- function is SECURITY INVOKER on purpose: current_user then resolves to the
-- PostgREST role of the caller (anon / authenticated / service_role), which is
-- exactly what we need to distinguish an end user from the trusted backend.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('service_role', 'supabase_admin', 'postgres') then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'profiles.role cannot be changed by %', current_user
      using errcode = '42501';
  end if;

  if new.id is distinct from old.id then
    raise exception 'profiles.id cannot be changed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();


-- -----------------------------------------------------------------------------
-- 15. Ownership / visibility helper functions
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER so a policy on one table can consult another table without
-- recursing through that table's own policies. Each returns only a boolean, so
-- no row data leaks. search_path is pinned to '' and every reference is fully
-- qualified, which is the standard hardening for definer functions.

create or replace function public.owns_store(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores s
    where s.id = p_store_id
      and s.owner_id = (select auth.uid())
  );
$$;

comment on function public.owns_store(uuid) is
  'True when the calling user owns the given store. Ownership is read from the database, never from client input.';

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'seller'
  );
$$;

create or replace function public.store_is_public(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores s
    where s.id = p_store_id
      and s.is_active
      and s.is_verified
  );
$$;

create or replace function public.product_is_public(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.products p
    where p.id = p_product_id
      and p.is_active
  );
$$;


-- -----------------------------------------------------------------------------
-- 16. Table and column privileges
-- -----------------------------------------------------------------------------
-- RLS decides WHICH ROWS a role may touch. GRANT decides WHICH COLUMNS. Both are
-- needed: an UPDATE policy alone cannot stop a user from writing profiles.role,
-- so the privileged columns are simply never granted to end users.
--
-- Columns deliberately withheld from `authenticated`:
--   profiles.role        - prevents self-promotion to seller / admin
--   stores.is_verified   - prevents a seller self-verifying into public results
--   store_products.store_id / product_id on UPDATE
--                        - prevents re-pointing an owned row at another store

-- profiles ---------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

-- categories / brands / products : catalogue is curated by the trusted backend.
revoke all on table public.categories from anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant all on table public.categories to service_role;

revoke all on table public.brands from anon, authenticated;
grant select on table public.brands to anon, authenticated;
grant all on table public.brands to service_role;

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant all on table public.products to service_role;

-- stores -----------------------------------------------------------------------
revoke all on table public.stores from anon, authenticated;
grant select on table public.stores to anon, authenticated;
grant insert (
  owner_id, name, slug, description, phone,
  address_line_1, address_line_2, locality, city, state, postal_code,
  latitude, longitude
) on table public.stores to authenticated;
grant update (
  name, slug, description, phone,
  address_line_1, address_line_2, locality, city, state, postal_code,
  latitude, longitude, is_active
) on table public.stores to authenticated;
grant all on table public.stores to service_role;

-- store_hours --------------------------------------------------------------------
revoke all on table public.store_hours from anon, authenticated;
grant select on table public.store_hours to anon, authenticated;
grant insert (store_id, day_of_week, opens_at, closes_at, is_closed)
  on table public.store_hours to authenticated;
grant update (day_of_week, opens_at, closes_at, is_closed)
  on table public.store_hours to authenticated;
grant delete on table public.store_hours to authenticated;
grant all on table public.store_hours to service_role;

-- store_products -----------------------------------------------------------------
revoke all on table public.store_products from anon, authenticated;
grant select on table public.store_products to anon, authenticated;
grant insert (
  store_id, product_id, selling_price, stock_status,
  quantity_available, discount_percentage, is_available
) on table public.store_products to authenticated;
grant update (
  selling_price, stock_status,
  quantity_available, discount_percentage, is_available
) on table public.store_products to authenticated;
grant delete on table public.store_products to authenticated;
grant all on table public.store_products to service_role;


-- -----------------------------------------------------------------------------
-- 17. Row Level Security
-- -----------------------------------------------------------------------------
-- RLS is enabled on every application table. It is never disabled for
-- convenience. The backend uses the service role, which bypasses RLS and must
-- therefore stay server-only.
--
-- FORCE ROW LEVEL SECURITY is intentionally not set: the definer helpers in
-- section 15 run as the table owner and rely on the owner's normal RLS bypass.

alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.brands         enable row level security;
alter table public.products       enable row level security;
alter table public.stores         enable row level security;
alter table public.store_hours    enable row level security;
alter table public.store_products enable row level security;

-- profiles ---------------------------------------------------------------------
-- No INSERT policy: profiles are created only by the section 13 trigger.
-- No DELETE policy: profiles disappear with their auth.users row.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- categories -------------------------------------------------------------------
drop policy if exists categories_select_public on public.categories;
create policy categories_select_public
  on public.categories
  for select
  to anon, authenticated
  using (is_active);

-- brands -----------------------------------------------------------------------
drop policy if exists brands_select_public on public.brands;
create policy brands_select_public
  on public.brands
  for select
  to anon, authenticated
  using (true);

-- products ---------------------------------------------------------------------
drop policy if exists products_select_public on public.products;
create policy products_select_public
  on public.products
  for select
  to anon, authenticated
  using (is_active);

-- stores -----------------------------------------------------------------------
-- Customers see only active AND verified stores. Sellers additionally see their
-- own stores whatever their state, via the second policy (SELECT policies OR).
drop policy if exists stores_select_public on public.stores;
create policy stores_select_public
  on public.stores
  for select
  to anon, authenticated
  using (is_active and is_verified);

drop policy if exists stores_select_own on public.stores;
create policy stores_select_own
  on public.stores
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Only a profile already carrying role = 'seller' may create a store, and only
-- with itself as owner. Promotion to seller is a trusted-backend operation.
drop policy if exists stores_insert_own on public.stores;
create policy stores_insert_own
  on public.stores
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id and public.is_seller());

-- USING picks the rows the seller may touch; WITH CHECK stops them handing the
-- store to somebody else.
drop policy if exists stores_update_own on public.stores;
create policy stores_update_own
  on public.stores
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- store_hours ------------------------------------------------------------------
drop policy if exists store_hours_select_public on public.store_hours;
create policy store_hours_select_public
  on public.store_hours
  for select
  to anon, authenticated
  using (public.store_is_public(store_id));

drop policy if exists store_hours_select_own on public.store_hours;
create policy store_hours_select_own
  on public.store_hours
  for select
  to authenticated
  using (public.owns_store(store_id));

drop policy if exists store_hours_insert_own on public.store_hours;
create policy store_hours_insert_own
  on public.store_hours
  for insert
  to authenticated
  with check (public.owns_store(store_id));

drop policy if exists store_hours_update_own on public.store_hours;
create policy store_hours_update_own
  on public.store_hours
  for update
  to authenticated
  using (public.owns_store(store_id))
  with check (public.owns_store(store_id));

drop policy if exists store_hours_delete_own on public.store_hours;
create policy store_hours_delete_own
  on public.store_hours
  for delete
  to authenticated
  using (public.owns_store(store_id));

-- store_products ---------------------------------------------------------------
-- Public visibility is transitive: the line must be available AND its store must
-- be publicly visible AND the canonical product must be active. Without the
-- store_is_public check, inventory of an unverified store would leak.
drop policy if exists store_products_select_public on public.store_products;
create policy store_products_select_public
  on public.store_products
  for select
  to anon, authenticated
  using (
    is_available
    and public.store_is_public(store_id)
    and public.product_is_public(product_id)
  );

drop policy if exists store_products_select_own on public.store_products;
create policy store_products_select_own
  on public.store_products
  for select
  to authenticated
  using (public.owns_store(store_id));

-- Ownership is resolved from stores.owner_id in the database. The client cannot
-- assert it, so a seller cannot insert inventory into somebody else's store.
drop policy if exists store_products_insert_own on public.store_products;
create policy store_products_insert_own
  on public.store_products
  for insert
  to authenticated
  with check (public.owns_store(store_id));

drop policy if exists store_products_update_own on public.store_products;
create policy store_products_update_own
  on public.store_products
  for update
  to authenticated
  using (public.owns_store(store_id))
  with check (public.owns_store(store_id));

drop policy if exists store_products_delete_own on public.store_products;
create policy store_products_delete_own
  on public.store_products
  for delete
  to authenticated
  using (public.owns_store(store_id));


-- =============================================================================
-- Admin access
-- =============================================================================
-- No admin RLS policy exists, deliberately. An "admin" policy that reads a role
-- out of the request JWT or user metadata is only as trustworthy as the client
-- that supplied it. Until there is a vetted claim source, administrative work -
-- verifying stores, curating the catalogue, promoting a profile to seller -
-- happens through the Express backend using the Supabase service role, which
-- bypasses RLS and never leaves the server.
-- =============================================================================
