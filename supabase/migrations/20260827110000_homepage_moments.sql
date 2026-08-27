-- =============================================================================
-- Kirana Connect - homepage "Browse by mood" card images
-- =============================================================================
-- The six mood cards on the Consumer homepage (title, caption, search query,
-- icon) stay fixed in frontend code -- see src/features/home/DiscoveryMoments.jsx
-- -- this table only ever holds an optional background image per card, keyed
-- by the same stable slug the frontend uses. A missing row (or a null
-- image_url) simply means that card still shows its plain gradient.
-- =============================================================================

create table if not exists public.homepage_moments (
  slug        text primary key,
  image_url   text,
  updated_at  timestamptz not null default now(),
  constraint homepage_moments_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.homepage_moments is
  'Optional background image per homepage mood card, keyed by the slug DiscoveryMoments.jsx (Consumer) and the admin Homepage Moments page both use. Title/caption/search query stay in frontend code -- only the image is admin-managed.';

drop trigger if exists homepage_moments_set_updated_at on public.homepage_moments;
create trigger homepage_moments_set_updated_at
  before update on public.homepage_moments
  for each row execute function public.set_updated_at();

-- Curated by the trusted backend, same as categories/brands/products.
revoke all on table public.homepage_moments from anon, authenticated;
grant select on table public.homepage_moments to anon, authenticated;
grant all on table public.homepage_moments to service_role;

alter table public.homepage_moments enable row level security;

drop policy if exists homepage_moments_select_public on public.homepage_moments;
create policy homepage_moments_select_public
  on public.homepage_moments
  for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policy for anon/authenticated: images are set only
-- by the admin backend via service_role, matching this project's existing
-- "Admin access" convention.
