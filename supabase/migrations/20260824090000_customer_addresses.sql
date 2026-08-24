-- Customer saved addresses for the consumer app.
--
-- Browsing remains public, but authenticated customers can keep reusable
-- locations across devices. Rows are scoped by auth.uid() through RLS.

create table if not exists public.customer_addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  label          text not null,
  address_line_1 text not null,
  address_line_2 text,
  locality       text,
  city           text,
  state          text,
  postal_code    text,
  latitude       numeric(9, 6) not null,
  longitude      numeric(9, 6) not null,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint customer_addresses_label_not_blank check (char_length(btrim(label)) > 0),
  constraint customer_addresses_line_1_not_blank check (char_length(btrim(address_line_1)) > 0),
  constraint customer_addresses_label_length check (char_length(label) <= 60),
  constraint customer_addresses_line_1_length check (char_length(address_line_1) <= 200),
  constraint customer_addresses_line_2_length check (address_line_2 is null or char_length(address_line_2) <= 200),
  constraint customer_addresses_locality_length check (locality is null or char_length(locality) <= 120),
  constraint customer_addresses_city_length check (city is null or char_length(city) <= 120),
  constraint customer_addresses_state_length check (state is null or char_length(state) <= 120),
  constraint customer_addresses_postal_code_length check (postal_code is null or char_length(postal_code) <= 20),
  constraint customer_addresses_latitude_range check (latitude between -90 and 90),
  constraint customer_addresses_longitude_range check (longitude between -180 and 180)
);

comment on table public.customer_addresses is
  'Saved customer locations for consumer app accounts. Each row is owner-scoped by RLS.';

create index if not exists customer_addresses_user_idx
  on public.customer_addresses (user_id, created_at desc);

create unique index if not exists customer_addresses_one_default_per_user_idx
  on public.customer_addresses (user_id)
  where is_default;

drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;

revoke all on table public.customer_addresses from anon, authenticated;
grant select on table public.customer_addresses to authenticated;
grant insert (
  user_id, label, address_line_1, address_line_2, locality, city, state,
  postal_code, latitude, longitude, is_default
) on table public.customer_addresses to authenticated;
grant update (
  label, address_line_1, address_line_2, locality, city, state, postal_code,
  latitude, longitude, is_default
) on table public.customer_addresses to authenticated;
grant delete on table public.customer_addresses to authenticated;
grant all on table public.customer_addresses to service_role;

drop policy if exists customer_addresses_select_own on public.customer_addresses;
create policy customer_addresses_select_own
  on public.customer_addresses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists customer_addresses_insert_own on public.customer_addresses;
create policy customer_addresses_insert_own
  on public.customer_addresses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists customer_addresses_update_own on public.customer_addresses;
create policy customer_addresses_update_own
  on public.customer_addresses
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists customer_addresses_delete_own on public.customer_addresses;
create policy customer_addresses_delete_own
  on public.customer_addresses
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
