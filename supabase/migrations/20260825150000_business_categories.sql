-- =============================================================================
-- Kirana Connect - store business categories
-- =============================================================================
-- Foundation for future competitor mapping. Two additive tables:
--
--   business_categories        a small curated taxonomy of business types
--                               ("Grocery Store", "Dairy Store", ...)
--   store_business_categories  which of those a given store actually is,
--                               many-to-many with at most one primary
--
-- This is deliberately NOT the same table as public.categories. categories
-- describes what a PRODUCT is (Dairy and Eggs, Beverages, Chocolate) --
-- business_categories describes what a STORE is (Grocery Store, Dairy
-- Store). A grocery store sells products from a dozen product categories;
-- that does not make it a dairy store. Pointing store classification at the
-- product-category table would conflate two different concepts that this
-- repository has always kept separate, so this migration does not touch
-- public.categories at all.
--
-- No store is classified by this migration. A store with zero rows in
-- store_business_categories is "Unclassified" -- a valid, permanent state,
-- not a gap to be silently defaulted to "General Retail". Fabricating a
-- classification from what a store happens to stock (a grocery store also
-- sells milk) is exactly the kind of fake competitor data this migration is
-- meant to prevent, so classification only ever comes from an explicit
-- store-owner or admin choice, never inferred here.
-- =============================================================================

create table if not exists public.business_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint business_categories_name_not_blank check (char_length(btrim(name)) > 0),
  constraint business_categories_slug_format    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.business_categories is
  'The nature of a business (Grocery Store, Dairy Store, ...), distinct from public.categories which describes products. Curated by admin only; seeded separately in supabase/seed, not by this migration, matching how categories/brands/products are seeded.';

drop trigger if exists business_categories_set_updated_at on public.business_categories;
create trigger business_categories_set_updated_at
  before update on public.business_categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- store_business_categories  (store x business_category, many-to-many)
-- -----------------------------------------------------------------------------
-- A composite primary key both enforces "one row per store per category" and
-- serves as the store_id lookup index, the same reasoning store_products
-- already documents for its own (store_id, product_id) unique constraint --
-- no separate store_id-only index is needed alongside it.
create table if not exists public.store_business_categories (
  store_id             uuid not null references public.stores (id) on delete cascade,
  business_category_id uuid not null references public.business_categories (id) on delete restrict,
  is_primary           boolean not null default false,
  created_at           timestamptz not null default now(),
  primary key (store_id, business_category_id)
);

comment on table public.store_business_categories is
  'Which business categories a store actually is. Many-to-many: a grocery store may also carry Dairy Store as a secondary category. At most one row per store may have is_primary = true, enforced below by a partial unique index, not just application logic.';
comment on column public.store_business_categories.is_primary is
  'Exactly one primary category per classified store. A store with zero rows here is Unclassified, not defaulted to any category.';

-- The real guarantee against two primaries for one store: a database
-- constraint, not just the service layer that happens to write these rows.
create unique index if not exists store_business_categories_one_primary_per_store
  on public.store_business_categories (store_id)
  where is_primary;

-- Future "who competes in category X nearby" queries key off this column;
-- the composite primary key above does not serve it (its leading column is
-- store_id, not business_category_id).
create index if not exists store_business_categories_business_category_id_idx
  on public.store_business_categories (business_category_id);

-- -----------------------------------------------------------------------------
-- Privileges and RLS
-- -----------------------------------------------------------------------------
-- business_categories: publicly readable when active, exactly like
-- public.categories. Curation (create/edit/deactivate) is a trusted-backend
-- admin action through the service role -- no authenticated grant at all,
-- matching how categories and brands are curated.
revoke all on table public.business_categories from anon, authenticated;
grant select on table public.business_categories to anon, authenticated;
grant all on table public.business_categories to service_role;

alter table public.business_categories enable row level security;

drop policy if exists business_categories_select_public on public.business_categories;
create policy business_categories_select_public
  on public.business_categories
  for select
  to anon, authenticated
  using (is_active);

-- store_business_categories: publicly readable exactly when the store itself
-- is publicly visible, reusing the existing store_is_public() helper so this
-- follows the same transitive-visibility rule store_products already uses --
-- an unverified store's classification does not leak just because this table
-- has no is_active flag of its own.
--
-- Writes go through the Express backend's service role today (both the
-- store-owner path and the admin override path re-verify ownership /
-- admin status server-side, exactly like store_products and store_hours).
-- The owner policies below are the same kind of backstop
-- product_demand_requests documents: not the primary mechanism, but a
-- guarantee that holds even if a future client-side write path is added.
revoke all on table public.store_business_categories from anon, authenticated;
grant select on table public.store_business_categories to anon, authenticated;
grant insert (store_id, business_category_id, is_primary) on table public.store_business_categories to authenticated;
grant delete on table public.store_business_categories to authenticated;
grant all on table public.store_business_categories to service_role;

alter table public.store_business_categories enable row level security;

drop policy if exists store_business_categories_select_public on public.store_business_categories;
create policy store_business_categories_select_public
  on public.store_business_categories
  for select
  to anon, authenticated
  using (public.store_is_public(store_id));

drop policy if exists store_business_categories_select_own on public.store_business_categories;
create policy store_business_categories_select_own
  on public.store_business_categories
  for select
  to authenticated
  using (public.owns_store(store_id));

drop policy if exists store_business_categories_insert_own on public.store_business_categories;
create policy store_business_categories_insert_own
  on public.store_business_categories
  for insert
  to authenticated
  with check (public.owns_store(store_id));

drop policy if exists store_business_categories_delete_own on public.store_business_categories;
create policy store_business_categories_delete_own
  on public.store_business_categories
  for delete
  to authenticated
  using (public.owns_store(store_id));

-- No update policy: the service layer replaces a store's category set with
-- delete-then-insert rather than updating is_primary in place, so no role
-- needs UPDATE on this table at all.
