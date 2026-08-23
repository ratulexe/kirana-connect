-- Store manager edits are reviewed before they replace the live store profile.
-- A pending request keeps current customer-facing details stable until an admin
-- approves the change.

create table if not exists public.store_change_requests (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  payload      jsonb not null,
  hours        jsonb not null default '[]'::jsonb,
  status       text not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid references public.profiles(id) on delete set null,
  admin_note   text,

  constraint store_change_requests_status_check
    check (status in ('pending', 'approved', 'rejected')),
  constraint store_change_requests_payload_object_check
    check (jsonb_typeof(payload) = 'object'),
  constraint store_change_requests_hours_array_check
    check (jsonb_typeof(hours) = 'array')
);

create unique index if not exists store_change_requests_one_pending_idx
  on public.store_change_requests (store_id)
  where status = 'pending';

create index if not exists store_change_requests_owner_idx
  on public.store_change_requests (owner_id, submitted_at desc);

create index if not exists store_change_requests_status_idx
  on public.store_change_requests (status, submitted_at asc);

alter table public.store_change_requests enable row level security;

revoke all on table public.store_change_requests from anon, authenticated;
grant all on table public.store_change_requests to service_role;
