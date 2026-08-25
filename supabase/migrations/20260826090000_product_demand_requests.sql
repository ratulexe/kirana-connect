-- =============================================================================
-- Kirana Connect - hyperlocal product demand requests
-- =============================================================================
-- Lets a signed-in customer tell nearby stores "I want this product, but it
-- is not available near me." One row is one customer's interest in one exact
-- product variant, at one location, within one search radius.
--
-- This is deliberately NOT a notifications or messaging table: nothing here
-- delivers anything to anyone. The Express backend aggregates open rows into
-- counts for the Store Portal; customer identity never leaves the backend.
--
-- Future scope (not built here): Entrepreneur Mode will query this table for
-- demand density, top unmet variants, and trend over time. Columns are kept
-- plain and indexed so those read patterns stay possible without a redesign.
-- =============================================================================

create type public.demand_request_status as enum ('open', 'fulfilled', 'cancelled');

create table if not exists public.product_demand_requests (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  product_variant_id uuid not null references public.product_variants (id) on delete cascade,
  latitude           numeric(9, 6) not null,
  longitude          numeric(9, 6) not null,
  radius_km          numeric(5, 2) not null,
  status             public.demand_request_status not null default 'open',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint product_demand_requests_latitude_range check (latitude between -90 and 90),
  constraint product_demand_requests_longitude_range check (longitude between -180 and 180),
  constraint product_demand_requests_radius_range check (radius_km > 0 and radius_km <= 50)
);

comment on table public.product_demand_requests is
  'One signed-in customer''s interest in one product variant at one location: "I want this nearby, but no store has it." Aggregated (never shown per-customer) to Store Managers through the Express API.';
comment on column public.product_demand_requests.radius_km is
  'How far the customer was willing to look when they made the request; used both to judge eligibility at creation time and, later, to decide which stores a request is relevant to.';

-- One open request per customer per variant: repeated button presses must not
-- inflate demand. The service layer catches the resulting unique violation and
-- returns an idempotent "already requested" response instead of erroring.
create unique index if not exists product_demand_requests_open_unique
  on public.product_demand_requests (user_id, product_variant_id)
  where status = 'open';

-- Store-side lookup: which open requests fall near a given store. Partial and
-- narrow, mirroring stores_public_coordinates_idx's shape for the same reason.
create index if not exists product_demand_requests_open_coordinates_idx
  on public.product_demand_requests (latitude, longitude)
  where status = 'open';

-- Fulfillment-on-stock: "does this exact variant already have open demand
-- nearby" is looked up by variant first, coordinates second.
create index if not exists product_demand_requests_variant_status_idx
  on public.product_demand_requests (product_variant_id, status);

-- Future "my requests" and analytics; cheap to keep now, expensive to add later.
create index if not exists product_demand_requests_user_idx
  on public.product_demand_requests (user_id, created_at desc);

drop trigger if exists product_demand_requests_set_updated_at on public.product_demand_requests;
create trigger product_demand_requests_set_updated_at
  before update on public.product_demand_requests
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Privileges and RLS
-- -----------------------------------------------------------------------------
-- The application workflow goes through Express (service role) on both the
-- create side and the store-aggregation side, exactly like store inventory.
-- RLS here is a backstop, not the primary mechanism: it stops a customer from
-- impersonating another user or reading someone else's request even if a
-- future client-side query is ever added, without weakening what the backend
-- already enforces.
revoke all on table public.product_demand_requests from anon, authenticated;
grant select on table public.product_demand_requests to authenticated;
grant insert (user_id, product_variant_id, latitude, longitude, radius_km)
  on table public.product_demand_requests to authenticated;
grant all on table public.product_demand_requests to service_role;

alter table public.product_demand_requests enable row level security;

drop policy if exists product_demand_requests_select_own on public.product_demand_requests;
create policy product_demand_requests_select_own
  on public.product_demand_requests
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists product_demand_requests_insert_own on public.product_demand_requests;
create policy product_demand_requests_insert_own
  on public.product_demand_requests
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- No update/delete policy for authenticated: status transitions (fulfilled,
-- cancelled) are a trusted-backend decision, not something a customer can do
-- to their own row directly -- otherwise "fulfilled" would mean nothing.
