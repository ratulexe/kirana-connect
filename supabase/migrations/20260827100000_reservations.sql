-- =============================================================================
-- Kirana Connect - product reservations (inventory holds)
-- =============================================================================
-- A reservation is a temporary HOLD on one store's inventory row
-- (store_products), not an order and not a stock decrement. Physical stock
-- (store_products.quantity_available) is only ever reduced at COLLECTION.
--
-- Source of truth for "is this unit available right now":
--   availableQuantity = max(quantity_available - activeReservedQuantity, 0)
--   activeReservedQuantity = sum(quantity) where status = 'active'
--                             and expires_at > now()
-- That WHERE clause is the entire correctness guarantee for expiry: a
-- reservation stops counting the instant it is past expires_at, whether or
-- not any cleanup job has ever touched its status column. The status flip to
-- 'expired' elsewhere in this file is bookkeeping for display, never a
-- precondition for correct availability math.
--
-- Reservations attach to store_products.id (the store x variant inventory
-- row already used everywhere else in this codebase -- see
-- server/src/services/inventory.service.js), not to products or
-- product_variants directly: the same variant sold by two different stores
-- must be reservable independently.
-- =============================================================================

do $$
begin
  create type public.reservation_status as enum ('active', 'collected', 'cancelled', 'expired');
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- 1. reservations
-- -----------------------------------------------------------------------------
create table if not exists public.reservations (
  id                  uuid primary key default gen_random_uuid(),
  reservation_code    text not null,
  user_id             uuid not null references public.profiles (id) on delete cascade,
  store_id            uuid not null references public.stores (id) on delete cascade,
  store_product_id    uuid not null references public.store_products (id) on delete cascade,
  quantity            integer not null default 1,
  pickup_window_start timestamptz not null,
  pickup_window_end   timestamptz not null,
  expires_at          timestamptz not null,
  status              public.reservation_status not null default 'active',
  cancelled_by        uuid references public.profiles (id),
  cancellation_reason text,
  cancelled_at        timestamptz,
  collected_at        timestamptz,
  expired_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint reservations_quantity_positive check (quantity > 0),
  constraint reservations_code_format check (reservation_code ~ '^KC-[0-9]{4}$'),
  constraint reservations_window_valid check (pickup_window_start < pickup_window_end),
  -- The +1 hour safety buffer is computed server-side (never trusted from the
  -- client), but is still enforced here as a structural invariant: an expiry
  -- at or before the pickup window's own end is never a valid row.
  constraint reservations_expires_after_window check (expires_at > pickup_window_end)
);

comment on table public.reservations is
  'Inventory holds against store_products, not orders. Physical stock is only decremented on collection (see public.collect_reservation).';
comment on column public.reservations.store_product_id is
  'The store x variant inventory row being held -- store_products.id, matching the identifier already used throughout inventory.service.js.';
comment on column public.reservations.reservation_code is
  'KC-0000..KC-9999, a short pickup-verification code -- never the primary key. Unique only while active (see the partial index below), so the 10,000-value space can be reused once a reservation goes terminal.';
comment on column public.reservations.expires_at is
  'pickup_window_end + 1 hour, computed by public.create_reservation. The sole source of truth for whether a hold still counts: status=active AND expires_at > now().';

-- Reused across every table in this project.
drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Indexes
-- -----------------------------------------------------------------------------
-- Only one ACTIVE reservation may hold a given code at a time; a terminal
-- reservation's code is free to be reused by a later one.
create unique index if not exists reservations_active_code_unique
  on public.reservations (reservation_code)
  where status = 'active';

-- The hot path: "how much of this inventory row is actively held right now".
create index if not exists reservations_active_inventory_idx
  on public.reservations (store_product_id, expires_at)
  where status = 'active';

-- Idempotency check: does this user already hold this same item.
create index if not exists reservations_active_user_item_idx
  on public.reservations (user_id, store_product_id)
  where status = 'active';

create index if not exists reservations_user_id_idx on public.reservations (user_id);
create index if not exists reservations_store_id_idx on public.reservations (store_id);
create index if not exists reservations_status_idx on public.reservations (status);
create index if not exists reservations_expires_at_idx on public.reservations (expires_at);

-- Store Portal's "Active Reservations" list.
create index if not exists reservations_store_active_idx
  on public.reservations (store_id, created_at desc)
  where status = 'active';

-- -----------------------------------------------------------------------------
-- 3. Opportunistic expiry
-- -----------------------------------------------------------------------------
-- Flips stale rows to 'expired' for bookkeeping/display. Never required for
-- correctness (every availability query already filters on expires_at
-- directly), so it is safe to call cheaply and often, and safe if it is never
-- called at all.
create or replace function public.expire_stale_reservations(p_store_product_id uuid default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.reservations
  set status = 'expired', expired_at = now()
  where status = 'active'
    and expires_at <= now()
    and (p_store_product_id is null or store_product_id = p_store_product_id);
$$;

-- -----------------------------------------------------------------------------
-- 4. Atomic reservation creation
-- -----------------------------------------------------------------------------
-- "SELECT ... FOR UPDATE" on the store_products row is what makes the whole
-- feature race-condition-safe: two concurrent calls for the same inventory
-- row serialize on that lock, so the second caller's availability check runs
-- against the first caller's already-committed reservation, never against a
-- stale read. Called with the identity (p_user_id) already verified by the
-- Express layer via requireAuth -- never trust a client-supplied user id.
create or replace function public.create_reservation(
  p_user_id uuid,
  p_store_product_id uuid,
  p_quantity integer,
  p_pickup_window_start timestamptz,
  p_pickup_window_end timestamptz,
  p_expires_at timestamptz
)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_on_hand integer;
  v_active_reserved integer;
  v_available integer;
  v_existing public.reservations;
  v_code text;
  v_attempt integer;
  v_row public.reservations;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'RESERVATION_INVALID: quantity must be positive';
  end if;

  if p_pickup_window_start is null or p_pickup_window_end is null or p_expires_at is null then
    raise exception 'RESERVATION_INVALID: pickup window and expiry are required';
  end if;

  if p_pickup_window_start >= p_pickup_window_end then
    raise exception 'RESERVATION_INVALID: pickup start must be before pickup end';
  end if;

  if p_pickup_window_end <= now() then
    raise exception 'RESERVATION_INVALID: pickup window must be in the future';
  end if;

  if p_pickup_window_end - p_pickup_window_start > interval '6 hours' then
    raise exception 'RESERVATION_INVALID: pickup window cannot exceed 6 hours';
  end if;

  if p_expires_at <> p_pickup_window_end + interval '1 hour' then
    raise exception 'RESERVATION_INVALID: expiry must be exactly 1 hour after pickup window end';
  end if;

  -- Lock the inventory row for the rest of this transaction. Any concurrent
  -- create_reservation call for the same row blocks here until this one
  -- commits or rolls back.
  select sp.store_id, sp.quantity_available
    into v_store_id, v_on_hand
  from public.store_products sp
  where sp.id = p_store_product_id
  for update;

  if not found then
    raise exception 'RESERVATION_NOT_FOUND: inventory item not found';
  end if;

  if v_on_hand is null then
    raise exception 'RESERVATION_UNTRACKED_STOCK: this store does not track exact stock for this item';
  end if;

  -- Bookkeeping only -- see comment on expire_stale_reservations. The
  -- availability check below does not rely on this having run.
  perform public.expire_stale_reservations(p_store_product_id);

  -- Idempotency: double-click / slow-network retry returns the same active
  -- hold instead of creating a second one.
  select r.* into v_existing
  from public.reservations r
  where r.user_id = p_user_id
    and r.store_product_id = p_store_product_id
    and r.status = 'active'
    and r.expires_at > now()
  limit 1;

  if found then
    return v_existing;
  end if;

  select coalesce(sum(r.quantity), 0) into v_active_reserved
  from public.reservations r
  where r.store_product_id = p_store_product_id
    and r.status = 'active'
    and r.expires_at > now();

  v_available := greatest(v_on_hand - v_active_reserved, 0);

  if v_available < p_quantity then
    raise exception 'RESERVATION_CONFLICT: not enough stock available to reserve';
  end if;

  -- Collision-safe code allocation: the namespace only holds ACTIVE codes
  -- (the partial unique index above), and the active set at any moment is
  -- tiny relative to 10,000 possible values, so a short retry loop is enough
  -- even under heavy contention.
  for v_attempt in 1..20 loop
    v_code := 'KC-' || lpad(floor(random() * 10000)::text, 4, '0');
    begin
      insert into public.reservations (
        reservation_code, user_id, store_id, store_product_id, quantity,
        pickup_window_start, pickup_window_end, expires_at, status
      ) values (
        v_code, p_user_id, v_store_id, p_store_product_id, p_quantity,
        p_pickup_window_start, p_pickup_window_end, p_expires_at, 'active'
      )
      returning * into v_row;

      return v_row;
    exception when unique_violation then
      -- Another active reservation already holds this exact code; try again.
      continue;
    end;
  end loop;

  raise exception 'RESERVATION_CODE_EXHAUSTED: could not allocate a reservation code, please try again';
end;
$$;

comment on function public.create_reservation is
  'Atomic, race-safe reservation creation. Locks the store_products row (FOR UPDATE) before computing availability, so two concurrent calls for the last unit can never both succeed.';

-- -----------------------------------------------------------------------------
-- 5. Atomic collection
-- -----------------------------------------------------------------------------
-- The only operation that ever reduces physical stock. p_store_id is the
-- caller's own store, already resolved server-side (see the
-- resolveOwnedStore pattern in inventory.service.js) -- never trusted from
-- the request body.
create or replace function public.collect_reservation(
  p_reservation_id uuid,
  p_store_id uuid
)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.reservations;
  v_on_hand integer;
begin
  select r.* into v_reservation
  from public.reservations r
  where r.id = p_reservation_id
  for update;

  if not found then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if v_reservation.store_id <> p_store_id then
    raise exception 'RESERVATION_WRONG_STORE';
  end if;

  if v_reservation.status = 'collected' then
    raise exception 'RESERVATION_ALREADY_COLLECTED';
  end if;

  if v_reservation.status = 'cancelled' then
    raise exception 'RESERVATION_ALREADY_CANCELLED';
  end if;

  if v_reservation.status = 'expired' or v_reservation.expires_at <= now() then
    raise exception 'RESERVATION_EXPIRED';
  end if;

  select sp.quantity_available into v_on_hand
  from public.store_products sp
  where sp.id = v_reservation.store_product_id
  for update;

  if v_on_hand is null or v_on_hand < v_reservation.quantity then
    raise exception 'RESERVATION_INSUFFICIENT_STOCK';
  end if;

  update public.store_products
  set quantity_available = quantity_available - v_reservation.quantity
  where id = v_reservation.store_product_id;

  update public.reservations
  set status = 'collected', collected_at = now()
  where id = p_reservation_id
  returning * into v_reservation;

  return v_reservation;
end;
$$;

comment on function public.collect_reservation is
  'Atomic collection: verifies ownership/state, decrements store_products.quantity_available, and marks the reservation collected in one transaction. Never lets quantity_available go negative.';

-- -----------------------------------------------------------------------------
-- 6. Privileges and RLS
-- -----------------------------------------------------------------------------
-- Every reservation read/write in this app goes through the Express backend
-- using the service-role client, exactly like inventory.service.js and
-- admin.service.js -- identity and ownership are enforced in application
-- code against a verified req.user.id, not by end-user RLS policies. RLS is
-- still enabled (defense in depth: it guarantees anon/authenticated get
-- nothing directly, so a KC-#### code can never be enumerated or read via
-- direct table access even if a query is ever added without going through
-- the backend).
revoke all on table public.reservations from anon, authenticated;
grant all on table public.reservations to service_role;

alter table public.reservations enable row level security;
-- No policies for anon/authenticated: the table is reachable only via
-- service_role (the Express backend) or the SECURITY DEFINER functions
-- above, which themselves run with owner privileges. This mirrors this
-- project's existing "Admin access" section in the initial schema migration.

grant execute on function public.create_reservation(uuid, uuid, integer, timestamptz, timestamptz, timestamptz) to service_role;
grant execute on function public.collect_reservation(uuid, uuid) to service_role;
grant execute on function public.expire_stale_reservations(uuid) to service_role;
