-- =============================================================================
-- Kirana Connect - product variants / pack sizes
-- =============================================================================
-- Staged, backward-compatible migration:
--   * products remains the base/canonical product table
--   * product_variants carries independently sellable pack sizes/SKUs
--   * store_products gains product_variant_id and is backfilled from products
--   * legacy products.unit_label / mrp / barcode remain populated for older code
-- =============================================================================

-- ----------------------------------------------------------------------------- 
-- 1. Unit helpers and product identity normalization
-- -----------------------------------------------------------------------------
create or replace function public.normalize_catalogue_text(input text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(lower(btrim(coalesce(input, ''))), '[^a-z0-9]+', ' ', 'g'),
      '\s+',
      ' ',
      'g'
    ),
    ''
  );
$$;

create or replace function public.normalize_unit_code(input text)
returns text
language sql
immutable
as $$
  select case lower(btrim(coalesce(input, '')))
    when 'ltr' then 'l'
    when 'litre' then 'l'
    when 'liter' then 'l'
    when 'litres' then 'l'
    when 'liters' then 'l'
    when 'piece' then 'pc'
    when 'pieces' then 'pcs'
    else lower(btrim(coalesce(input, '')))
  end;
$$;

create or replace function public.allowed_product_unit_codes()
returns text[]
language sql
immutable
as $$
  select array[
    'mg', 'g', 'kg', 'ml', 'l',
    'pc', 'pcs', 'pair', 'dozen',
    'pack', 'packet', 'pouch', 'sachet', 'bottle', 'can', 'jar', 'box',
    'carton', 'roll', 'tray', 'tube', 'bar', 'set', 'strip', 'sheet', 'bag',
    'egg', 'eggs', 'tablet', 'tablets'
  ];
$$;

create or replace function public.product_unit_label(p_quantity numeric, p_unit_code text)
returns text
language plpgsql
immutable
as $$
declare
  quantity_label text;
  unit_label text;
begin
  quantity_label := trim(trailing '.' from trim(trailing '0' from p_quantity::text));
  unit_label := case public.normalize_unit_code(p_unit_code)
    when 'l' then 'L'
    else public.normalize_unit_code(p_unit_code)
  end;

  return quantity_label || ' ' || unit_label;
end;
$$;

alter table public.products
  add column if not exists normalized_name text;

update public.products
set normalized_name = public.normalize_catalogue_text(name)
where normalized_name is null
   or normalized_name is distinct from public.normalize_catalogue_text(name);

alter table public.products
  alter column normalized_name set not null;

create or replace function public.set_product_normalized_name()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name := public.normalize_catalogue_text(new.name);
  return new;
end;
$$;

drop trigger if exists products_set_normalized_name on public.products;
create trigger products_set_normalized_name
  before insert or update of name on public.products
  for each row execute function public.set_product_normalized_name();

create unique index if not exists products_normalized_identity_unique
  on public.products (normalized_name, category_id, coalesce(brand_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists products_normalized_name_trgm_idx
  on public.products using gin (normalized_name extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 2. Product variants
-- -----------------------------------------------------------------------------
create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    numeric(12, 3) not null,
  unit_code   text not null,
  unit_label  text not null,
  mrp         numeric(10, 2) not null,
  barcode     text,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint product_variants_quantity_positive check (quantity > 0),
  constraint product_variants_unit_allowed check (unit_code = any (public.allowed_product_unit_codes())),
  constraint product_variants_mrp_non_negative check (mrp >= 0),
  constraint product_variants_barcode_not_blank check (barcode is null or char_length(btrim(barcode)) > 0),
  constraint product_variants_unit_label_not_blank check (char_length(btrim(unit_label)) > 0)
);

-- If a project already has an early/partial product_variants table, bring it up
-- to the expected shape instead of assuming CREATE TABLE ran above.
alter table public.product_variants
  add column if not exists product_id uuid references public.products (id) on delete cascade,
  add column if not exists quantity numeric(12, 3) default 1,
  add column if not exists unit_code text default 'pc',
  add column if not exists unit_label text default '1 pc',
  add column if not exists mrp numeric(10, 2) default 0,
  add column if not exists barcode text,
  add column if not exists image_url text,
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.product_variants
set quantity = coalesce(quantity, 1),
    unit_code = public.normalize_unit_code(coalesce(unit_code, 'pc')),
    unit_label = coalesce(nullif(btrim(unit_label), ''), public.product_unit_label(coalesce(quantity, 1), coalesce(unit_code, 'pc'))),
    mrp = coalesce(mrp, 0),
    is_active = coalesce(is_active, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

alter table public.product_variants
  alter column product_id set not null,
  alter column quantity set not null,
  alter column unit_code set not null,
  alter column unit_label set not null,
  alter column mrp set not null,
  alter column is_active set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  alter table public.product_variants
    add constraint product_variants_product_id_fkey
    foreign key (product_id) references public.products (id) on delete cascade;
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.product_variants
    add constraint product_variants_quantity_positive check (quantity > 0);
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.product_variants
    add constraint product_variants_unit_allowed check (unit_code = any (public.allowed_product_unit_codes()));
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.product_variants
    add constraint product_variants_mrp_non_negative check (mrp >= 0);
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.product_variants
    add constraint product_variants_barcode_not_blank check (barcode is null or char_length(btrim(barcode)) > 0);
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.product_variants
    add constraint product_variants_unit_label_not_blank check (char_length(btrim(unit_label)) > 0);
exception when duplicate_object then null;
end
$$;

comment on table public.product_variants is
  'Independently sellable product SKUs/pack sizes. Product identity lives on products; store price and stock live in store_products.';
comment on column public.product_variants.quantity is
  'Numeric pack quantity, e.g. 500 for 500 ml or 1 for 1 L.';
comment on column public.product_variants.unit_code is
  'Normalized retail unit code used to generate display labels.';

create or replace function public.set_product_variant_unit_label()
returns trigger
language plpgsql
as $$
begin
  new.unit_code := public.normalize_unit_code(new.unit_code);
  new.unit_label := public.product_unit_label(new.quantity, new.unit_code);
  return new;
end;
$$;

drop trigger if exists product_variants_set_unit_label on public.product_variants;
create trigger product_variants_set_unit_label
  before insert or update of quantity, unit_code on public.product_variants
  for each row execute function public.set_product_variant_unit_label();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

create unique index if not exists product_variants_product_unit_unique
  on public.product_variants (product_id, quantity, unit_code);

create unique index if not exists product_variants_barcode_unique
  on public.product_variants (barcode)
  where barcode is not null;

create index if not exists product_variants_product_active_idx
  on public.product_variants (product_id, is_active);

-- Backfill every existing product as its first/default variant.
insert into public.product_variants (
  product_id, quantity, unit_code, unit_label, mrp, barcode, image_url, is_active, created_at, updated_at
)
select
  p.id,
  coalesce(nullif((regexp_match(p.unit_label, '^\s*([0-9]+(?:\.[0-9]+)?)\s+(.+?)\s*$'))[1], '')::numeric, 1),
  public.normalize_unit_code(coalesce((regexp_match(p.unit_label, '^\s*([0-9]+(?:\.[0-9]+)?)\s+(.+?)\s*$'))[2], 'pc')),
  p.unit_label,
  p.mrp,
  p.barcode,
  p.image_url,
  p.is_active,
  p.created_at,
  p.updated_at
from public.products p
where not exists (
  select 1 from public.product_variants pv where pv.product_id = p.id
)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. Inventory now points to a specific variant
-- -----------------------------------------------------------------------------
alter table public.store_products
  add column if not exists product_variant_id uuid references public.product_variants (id) on delete restrict;

update public.store_products sp
set product_variant_id = pv.id
from public.product_variants pv
where sp.product_variant_id is null
  and pv.product_id = sp.product_id;

alter table public.store_products
  alter column product_variant_id set not null;

alter table public.store_products
  drop constraint if exists store_products_store_product_unique;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'store_products_store_variant_unique'
      and conrelid = 'public.store_products'::regclass
  ) then
    return;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_index i on i.indexrelid = c.oid
    where n.nspname = 'public'
      and c.relname = 'store_products_store_variant_unique'
      and c.relkind = 'i'
      and i.indisunique
  ) then
    alter table public.store_products
      add constraint store_products_store_variant_unique unique using index store_products_store_variant_unique;
  else
    alter table public.store_products
      add constraint store_products_store_variant_unique unique (store_id, product_variant_id);
  end if;
end
$$;

create index if not exists store_products_variant_price_idx
  on public.store_products (product_variant_id, selling_price)
  where is_available;

create index if not exists store_products_store_variant_idx
  on public.store_products (store_id, product_variant_id);

-- -----------------------------------------------------------------------------
-- 4. Compatibility trigger keeps legacy product fields aligned with default SKU
-- -----------------------------------------------------------------------------
create or replace function public.sync_product_legacy_variant_fields()
returns trigger
language plpgsql
as $$
declare
  chosen public.product_variants%rowtype;
begin
  select *
    into chosen
  from public.product_variants
  where product_id = coalesce(new.product_id, old.product_id)
  order by is_active desc, created_at asc, id asc
  limit 1;

  if found then
    update public.products
    set unit_label = chosen.unit_label,
        mrp = chosen.mrp,
        barcode = chosen.barcode,
        image_url = coalesce(public.products.image_url, chosen.image_url)
    where id = chosen.product_id
      and (
        unit_label is distinct from chosen.unit_label
        or mrp is distinct from chosen.mrp
        or barcode is distinct from chosen.barcode
        or (image_url is null and chosen.image_url is not null)
      );
  end if;

  return null;
end;
$$;

drop trigger if exists product_variants_sync_product_legacy_fields on public.product_variants;
create trigger product_variants_sync_product_legacy_fields
  after insert or update or delete on public.product_variants
  for each row execute function public.sync_product_legacy_variant_fields();

-- -----------------------------------------------------------------------------
-- 5. Public visibility helper, grants and RLS
-- -----------------------------------------------------------------------------
create or replace function public.product_variant_is_public(p_variant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = p_variant_id
      and pv.is_active
      and p.is_active
  );
$$;

revoke all on table public.product_variants from anon, authenticated;
grant select on table public.product_variants to anon, authenticated;
grant all on table public.product_variants to service_role;

revoke all on table public.store_products from anon, authenticated;
grant select on table public.store_products to anon, authenticated;
grant insert (
  store_id, product_id, product_variant_id, selling_price, stock_status,
  quantity_available, discount_percentage, is_available
) on table public.store_products to authenticated;
grant update (
  selling_price, stock_status,
  quantity_available, discount_percentage, is_available
) on table public.store_products to authenticated;
grant delete on table public.store_products to authenticated;
grant all on table public.store_products to service_role;

alter table public.product_variants enable row level security;

drop policy if exists product_variants_select_public on public.product_variants;
create policy product_variants_select_public
  on public.product_variants
  for select
  to anon, authenticated
  using (is_active and public.product_is_public(product_id));

drop policy if exists store_products_select_public on public.store_products;
create policy store_products_select_public
  on public.store_products
  for select
  to anon, authenticated
  using (
    is_available
    and public.store_is_public(store_id)
    and public.product_is_public(product_id)
    and public.product_variant_is_public(product_variant_id)
  );

-- Seller policies keep the same ownership semantics; only the SKU key changed.
drop policy if exists store_products_select_own on public.store_products;
create policy store_products_select_own
  on public.store_products
  for select
  to authenticated
  using (public.owns_store(store_id));

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
