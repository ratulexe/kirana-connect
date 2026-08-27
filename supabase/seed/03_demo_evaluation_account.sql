-- =============================================================================
-- Kirana Connect - grant demo@gmail.com full evaluation access
-- =============================================================================
-- Run this once in the Supabase SQL Editor (service-role context), after the
-- demo@gmail.com user already exists in Auth.
--
-- What this actually grants, given the app's real role model (see README.md
-- "First admin bootstrap" and supabase/seed/02_demo_stores.sql):
--   - Admin Panel:        profiles.role = 'admin' (checked by
--                          server/src/middleware/requireAdmin.js)
--   - Store Portal:       a verified store with owner_id = this profile
--                          (server/src/routes/storeOnboarding.routes.js only
--                          checks requireAuth + ownership, never role, so an
--                          'admin'-role profile can still own and manage a
--                          store through the normal Store Portal UI)
--   - Consumer app:       nothing to grant -- any signed-in user already has
--                          full consumer access, no role involved.
--   - Entrepreneur Portal (apps/portal): nothing to grant -- it has no
--                          authentication at all, it's fully open.
--
-- profiles.role is a single enum (customer/seller/admin), so this profile
-- will read as 'admin' rather than 'seller' in the Admin Panel's own Sellers
-- list -- purely cosmetic; it does not affect Store Portal access.
--
-- Safe to re-run: the store insert upserts on slug, store_products upserts on
-- (store, variant).
-- =============================================================================

do $$
declare
  v_owner_id uuid;
  v_store_id uuid;
begin
  select p.id into v_owner_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email = 'demo@gmail.com';

  if v_owner_id is null then
    raise exception
      'No profiles row for demo@gmail.com. Confirm the user exists under Authentication > Users, then re-run this.';
  end if;

  -- Admin Panel access.
  update public.profiles set role = 'admin' where id = v_owner_id;

  -- Store Portal access: one verified demo store owned by this account, so
  -- signing in lands straight in the Store Portal dashboard instead of the
  -- pending-approval screen.
  insert into public.stores (
    owner_id, name, slug, description, phone,
    address_line_1, locality, city, state, postal_code,
    latitude, longitude, is_active, is_verified
  )
  values (
    v_owner_id, 'Demo Evaluation Store', 'demo-evaluation-store',
    'Seeded for account evaluation.', '9820000000',
    'Shop 1, Demo Complex, MG Road', 'Andheri East', 'Mumbai', 'Maharashtra', '400069',
    19.113700, 72.869800, true, true
  )
  on conflict (slug) do update
    set owner_id    = excluded.owner_id,
        is_active   = true,
        is_verified = true;

  select id into v_store_id from public.stores where slug = 'demo-evaluation-store';

  insert into public.store_hours (store_id, day_of_week, opens_at, closes_at, is_closed)
  select v_store_id, dow,
         case when dow = 0 then null else time '08:00' end,
         case when dow = 0 then null else time '21:30' end,
         dow = 0
  from generate_series(0, 6) as dow
  on conflict (store_id, day_of_week) do nothing;

  -- A handful of listed products so Inventory isn't empty on first look.
  insert into public.store_products (
    store_id, product_id, product_variant_id, selling_price, stock_status,
    quantity_available, discount_percentage, is_available
  )
  select
    v_store_id, p.id, pv.id,
    round(pv.mrp * 0.9, 2),
    'in_stock',
    30,
    round(((pv.mrp - pv.mrp * 0.9) / pv.mrp) * 100, 2),
    true
  from public.products p
  join lateral (
    select id, mrp
    from public.product_variants
    where product_id = p.id and is_active
    order by created_at asc, id asc
    limit 1
  ) pv on true
  where p.slug in (
    'amul-taaza-toned-milk-500-ml',
    'aashirvaad-shudh-chakki-atta-5-kg',
    'tata-salt-iodised-1-kg',
    'parle-g-original-glucose-biscuits-800-g',
    'colgate-strong-teeth-toothpaste-200-g'
  )
  on conflict (store_id, product_variant_id) do update
    set selling_price       = excluded.selling_price,
        stock_status        = excluded.stock_status,
        quantity_available  = excluded.quantity_available,
        discount_percentage = excluded.discount_percentage,
        is_available        = excluded.is_available;

  raise notice 'Demo evaluation access granted for profile %', v_owner_id;
end
$$;

-- Confirm the result.
select u.email, p.role, s.name as store, s.is_verified
from auth.users u
join public.profiles p on p.id = u.id
left join public.stores s on s.owner_id = p.id
where u.email = 'demo@gmail.com';
