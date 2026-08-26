-- =============================================================================
-- Kirana Connect - business category -> product category mapping
-- =============================================================================
-- The Demand-Supply Gap module needs to know which catalogue product
-- categories (Dairy and Eggs, Beverages, ...) are relevant evidence for a
-- given business category (Grocery Store, Dairy Store, ...). These are two
-- different concepts that this repository has always kept separate --
-- business_categories describes what a STORE is, public.categories
-- describes what a PRODUCT is -- so the relationship between them is a
-- third, explicit, additive table, not a foreign key bolted onto either.
--
-- This is a curated analytical relationship, not an inference: no row here
-- is derived from "this store happens to sell that product." Only mappings
-- with a genuinely defensible connection are seeded (see the seed file);
-- a deliberately unmapped category (general-retail, as of this migration)
-- is expected and handled by the application as "mapping not configured yet"
-- rather than silently mapped to everything to avoid an empty result.
-- =============================================================================

create table if not exists public.business_category_product_categories (
  business_category_id uuid not null references public.business_categories (id) on delete cascade,
  product_category_id  uuid not null references public.categories (id) on delete cascade,
  created_at            timestamptz not null default now(),
  primary key (business_category_id, product_category_id)
);

comment on table public.business_category_product_categories is
  'Which catalogue product categories count as relevant demand/supply evidence for a business category. Many-to-many, curated by admin. A business category with zero rows here has "no configured mapping yet", not "matches nothing" by omission -- the two are treated differently by the application.';

-- The composite primary key above enforces UNIQUE(business_category_id,
-- product_category_id) and already indexes business_category_id as its
-- leading column (the "which product categories does Grocery Store map to"
-- read); this index serves the reverse "which business categories does this
-- product category feed into" direction.
create index if not exists business_category_product_categories_product_category_id_idx
  on public.business_category_product_categories (product_category_id);

-- -----------------------------------------------------------------------------
-- Demand-Supply Gap query support on consumer_search_events
-- -----------------------------------------------------------------------------
-- The new analysis service's core read is "events in this product category,
-- within the last N days" -- category_id already had its own partial index
-- for a different access pattern (linking a single unambiguous product), but
-- nothing combined category with recency, which is now the hot path.
create index if not exists consumer_search_events_category_created_at_idx
  on public.consumer_search_events (category_id, created_at desc)
  where category_id is not null;

-- Supply/demand analysis also needs a coordinate bounding-box prefilter on
-- this table, the same shape every other coordinate-filtered table in this
-- project already has (stores_public_coordinates_idx,
-- product_demand_requests_open_coordinates_idx). consumer_search_events did
-- not need this until now, since no prior read filtered it geographically.
create index if not exists consumer_search_events_location_idx
  on public.consumer_search_events (location_lat, location_lng)
  where location_lat is not null;

-- -----------------------------------------------------------------------------
-- Privileges and RLS
-- -----------------------------------------------------------------------------
-- Nothing in either frontend reads this table directly: the Portal only ever
-- calls the aggregate /api/entrepreneur/demand-supply endpoint, which
-- resolves the mapping server-side via the service role. There is therefore
-- no public read grant at all -- same posture as consumer_search_events, and
-- curation is trusted-backend-only, same as business_categories itself.
revoke all on table public.business_category_product_categories from anon, authenticated;
grant all on table public.business_category_product_categories to service_role;

alter table public.business_category_product_categories enable row level security;

-- No policies for anon/authenticated: RLS with zero policies denies all
-- access by default, matching the posture already used for admin-curated
-- and analytics-only tables elsewhere in this project.
