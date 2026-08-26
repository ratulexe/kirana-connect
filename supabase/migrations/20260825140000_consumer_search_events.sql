-- =============================================================================
-- Kirana Connect - consumer search events
-- =============================================================================
-- Instrumentation only: one row per completed product search on the Consumer
-- app, whether or not it matched anything. This is the raw signal a future
-- Entrepreneur "unmet demand" module will read -- especially the zero-result
-- rows, which are evidence of demand nobody nearby currently supplies.
--
-- Deliberately NOT product_demand_requests: that table is an explicit,
-- signed-in "notify stores I want this" action tied to one product variant.
-- This table is passive instrumentation of ordinary search, works fully
-- anonymously, and is never surfaced back to the customer or a store.
--
-- No PII by design: no user_id, no session id, no exact address, no email or
-- phone. Location is coarsened to ~111 m (3 decimal places) before it is ever
-- written, via numeric(6,3), so the schema itself enforces the rounding --
-- not just the application code that computes it.
--
-- Written exclusively by the Express backend's service role, exactly like
-- product_demand_requests and store inventory. RLS is enabled as a backstop
-- per project convention, but carries no policies for anon/authenticated:
-- there is no per-row ownership concept here to scope a policy around, and a
-- broad client-side select policy is explicitly not wanted for an analytics
-- table. See "Admin access" in 20260822102000_initial_schema.sql for the same
-- reasoning applied to admin-only tables.
-- =============================================================================

create table if not exists public.consumer_search_events (
  id                     uuid primary key default gen_random_uuid(),
  search_query           text not null,
  normalized_query       text not null,
  product_id             uuid references public.products (id) on delete set null,
  category_id            uuid references public.categories (id) on delete set null,
  result_count           integer not null,
  available_store_count  integer,
  radius_km              numeric(5, 2),
  location_lat           numeric(6, 3),
  location_lng           numeric(6, 3),
  created_at             timestamptz not null default now(),

  constraint consumer_search_events_search_query_not_blank
    check (char_length(btrim(search_query)) > 0),
  constraint consumer_search_events_normalized_query_not_blank
    check (char_length(btrim(normalized_query)) > 0),
  constraint consumer_search_events_result_count_non_negative
    check (result_count >= 0),
  constraint consumer_search_events_available_store_count_non_negative
    check (available_store_count is null or available_store_count >= 0),
  constraint consumer_search_events_radius_non_negative
    check (radius_km is null or radius_km >= 0),
  constraint consumer_search_events_latitude_range
    check (location_lat is null or location_lat between -90 and 90),
  constraint consumer_search_events_longitude_range
    check (location_lng is null or location_lng between -180 and 180),
  -- A half-set coarsened coordinate is never useful, same rule as stores.
  constraint consumer_search_events_coordinates_paired
    check ((location_lat is null) = (location_lng is null))
);

comment on table public.consumer_search_events is
  'One row per completed Consumer search, anonymous, additive-only instrumentation. Not a demand-request, not shown to customers or stores. Feeds a future unmet-demand analysis module.';
comment on column public.consumer_search_events.search_query is
  'Trimmed, as typed. Kept alongside normalized_query for possible future display; never used for grouping.';
comment on column public.consumer_search_events.normalized_query is
  'trim + lowercase + collapsed whitespace only -- no stemming or NLP. The column future aggregation groups by.';
comment on column public.consumer_search_events.product_id is
  'Set only when the search unambiguously resolved to exactly one catalogue product (result_count = 1). Never guessed from free text; null for zero or multiple matches. ON DELETE SET NULL so a later product deletion does not erase the historical search evidence.';
comment on column public.consumer_search_events.category_id is
  'The category of product_id when set, for the same single-match reason. Independently nullable.';
comment on column public.consumer_search_events.result_count is
  'Total matching products for this search, from the same count the Consumer app displayed. 0 is valid and is the core unmet-demand signal.';
comment on column public.consumer_search_events.available_store_count is
  'Distinct nearby stores stocking any matching product, reusing the discovery query''s own result -- no separate query. Null (not 0) when the customer had no location set, since the count is then genuinely unknown rather than zero.';
comment on column public.consumer_search_events.location_lat is
  'Coarsened to 3 decimal places (~111 m) before insert. Never the customer''s exact position.';

-- Powers the worked aggregation this table exists for: group by search intent,
-- and separately isolate the zero-result rows within that grouping.
create index if not exists consumer_search_events_normalized_query_idx
  on public.consumer_search_events (normalized_query);

create index if not exists consumer_search_events_zero_result_idx
  on public.consumer_search_events (normalized_query)
  where result_count = 0;

-- Time-windowed reporting ("last 30 days"), the other obvious future read.
create index if not exists consumer_search_events_created_at_idx
  on public.consumer_search_events (created_at desc);

-- Partial and narrow, mirroring products_brand_id_idx: both columns are
-- nullable and most rows will not carry an unambiguous match.
create index if not exists consumer_search_events_product_id_idx
  on public.consumer_search_events (product_id)
  where product_id is not null;

create index if not exists consumer_search_events_category_id_idx
  on public.consumer_search_events (category_id)
  where category_id is not null;

-- -----------------------------------------------------------------------------
-- Privileges and RLS
-- -----------------------------------------------------------------------------
-- Unlike product_demand_requests, there is no signed-in owner to scope a
-- policy to -- this table must accept anonymous events -- so no insert or
-- select is granted to anon/authenticated at all, and no policy is defined
-- for them either. Only the trusted Express backend, via the service role,
-- ever touches this table.
revoke all on table public.consumer_search_events from anon, authenticated;
grant all on table public.consumer_search_events to service_role;

alter table public.consumer_search_events enable row level security;

-- No policies for anon/authenticated: RLS with zero policies denies all
-- access by default, the same posture the initial schema documents for
-- admin-only tables.
