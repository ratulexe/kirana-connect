-- =============================================================================
-- Kirana Connect — product media
-- =============================================================================
-- Structured multi-image support for canonical products. Each product may have
-- front, back, nutrition, and promotional images. The legacy products.image_url
-- column is NOT dropped; it continues as a fallback for products that have not
-- yet received structured media.
-- =============================================================================


-- 1. Media type enum
-- -----------------------------------------------------------------------------
do $$
begin
  create type public.product_media_type as enum ('front', 'back', 'nutrition', 'promotional');
exception
  when duplicate_object then null;
end
$$;


-- 2. product_media table
-- -----------------------------------------------------------------------------
create table if not exists public.product_media (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  media_type   public.product_media_type not null,
  image_url    text not null,
  storage_path text,
  alt_text     text,
  sort_order   smallint not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint product_media_image_url_not_blank
    check (char_length(btrim(image_url)) > 0),
  constraint product_media_sort_order_range
    check (sort_order >= 0 and sort_order <= 999)
);

comment on table public.product_media is
  'Structured images for canonical products. Replaces the single image_url column with typed, ordered media.';
comment on column public.product_media.storage_path is
  'Supabase Storage object path, used to delete the file when the media row is removed. NULL if the image is an external URL.';
comment on column public.product_media.is_primary is
  'The image shown in search results, product cards, and catalogue thumbnails. At most one per product.';


-- 3. Indexes
-- -----------------------------------------------------------------------------
-- Ordered fetch for product detail gallery.
create index if not exists product_media_product_sort_idx
  on public.product_media (product_id, sort_order);

-- Enforce at most one primary image per product.
create unique index if not exists product_media_one_primary_idx
  on public.product_media (product_id)
  where is_primary;


-- 4. updated_at trigger
-- -----------------------------------------------------------------------------
drop trigger if exists product_media_set_updated_at on public.product_media;
create trigger product_media_set_updated_at
  before update on public.product_media
  for each row execute function public.set_updated_at();


-- 5. Privileges
-- -----------------------------------------------------------------------------
revoke all on table public.product_media from anon, authenticated;
grant select on table public.product_media to anon, authenticated;
grant all on table public.product_media to service_role;


-- 6. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.product_media enable row level security;

-- Public read: anyone can see media for active products.
drop policy if exists product_media_select_public on public.product_media;
create policy product_media_select_public
  on public.product_media
  for select
  to anon, authenticated
  using (public.product_is_public(product_id));

-- Admin operations go through the service role which bypasses RLS.
