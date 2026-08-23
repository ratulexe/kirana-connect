-- =============================================================================
-- Kirana Connect - demo stores and inventory
-- =============================================================================
-- Creates three verified demo stores in Mumbai, all owned by one profile, and
-- stocks them with overlapping products at DIFFERENT prices so the price
-- comparison journey has something real to compare.
--
-- BEFORE RUNNING: replace the placeholder below with a real profiles.id.
-- Find one with:
--
--     select p.id, u.email, p.role from public.profiles p
--     join auth.users u on u.id = p.id;
--
-- The script promotes that profile to 'seller' and marks the stores verified,
-- which are both service-role operations. That is exactly why this runs in the
-- SQL Editor and not from the frontend.
--
-- Safe to re-run: stores upsert on slug, inventory upserts on (store, product).
-- =============================================================================

do $$
declare
  -- >>> REPLACE THIS with the profiles.id you want to own the demo stores <<<
  v_owner_id uuid := '00000000-0000-0000-0000-000000000000';

  v_store_a uuid;
  v_store_b uuid;
  v_store_c uuid;
begin
  if not exists (select 1 from public.profiles where id = v_owner_id) then
    raise exception
      'v_owner_id is not a real profile. Edit this file and paste an id from: select id from public.profiles;';
  end if;

  -- Seller onboarding is a trusted-backend action, so it happens here.
  update public.profiles set role = 'seller' where id = v_owner_id;

  -- Stores ---------------------------------------------------------------------
  -- Real Mumbai coordinates, a few kilometres apart, so nearby search and
  -- distance ranking produce meaningful results.
  insert into public.stores (
    owner_id, name, slug, description, phone,
    address_line_1, locality, city, state, postal_code,
    latitude, longitude, is_active, is_verified
  )
  values
    (v_owner_id, 'Sharma Kirana Stores', 'sharma-kirana-stores',
     'Neighbourhood grocery running since 1998', '9820011223',
     'Shop 4, Gokul Arcade, Subhash Road', 'Andheri East', 'Mumbai', 'Maharashtra', '400069',
     19.113700, 72.869800, true, true),
    (v_owner_id, 'Bandra Daily Needs', 'bandra-daily-needs',
     'Daily essentials and fresh dairy', '9820044556',
     'Ground Floor, Hill Road', 'Bandra West', 'Mumbai', 'Maharashtra', '400050',
     19.054400, 72.840700, true, true),
    (v_owner_id, 'Powai Fresh Mart', 'powai-fresh-mart',
     'Groceries, snacks and household supplies', '9820077889',
     'Unit 2, Hiranandani Gardens', 'Powai', 'Mumbai', 'Maharashtra', '400076',
     19.116900, 72.905600, true, true)
  on conflict (slug) do update
    set owner_id    = excluded.owner_id,
        is_active   = excluded.is_active,
        is_verified = excluded.is_verified,
        latitude    = excluded.latitude,
        longitude   = excluded.longitude;

  select id into v_store_a from public.stores where slug = 'sharma-kirana-stores';
  select id into v_store_b from public.stores where slug = 'bandra-daily-needs';
  select id into v_store_c from public.stores where slug = 'powai-fresh-mart';

  -- Opening hours ----------------------------------------------------------------
  -- Open every day except Sunday, which is the common kirana pattern.
  insert into public.store_hours (store_id, day_of_week, opens_at, closes_at, is_closed)
  select s.id, d.dow,
         case when d.dow = 0 then null else time '08:00' end,
         case when d.dow = 0 then null else time '21:30' end,
         d.dow = 0
  from (values (v_store_a), (v_store_b), (v_store_c)) as s(id),
       generate_series(0, 6) as d(dow)
  on conflict (store_id, day_of_week) do nothing;

  -- Inventory ---------------------------------------------------------------------
  -- The same canonical products at deliberately different prices per store.
  insert into public.store_products (
    store_id, product_id, selling_price, stock_status,
    quantity_available, discount_percentage, is_available
  )
  -- discount_percentage is the badge a store advertises. It is derived from the
  -- real gap to MRP rather than hardcoded, so the demo can never show "5% off"
  -- on a store that is actually charging full price.
  select v.store_id, p.id, v.price, v.status::public.stock_status, v.qty,
         case
           when p.mrp > 0 then greatest(round((p.mrp - v.price) / p.mrp * 100, 2), 0)
           else 0
         end,
         true
  from (
    values
      -- product slug,                                    A,      B,      C
      ('amul-taaza-toned-milk-500-ml',                    32.00,  31.50,  33.00),
      ('amul-butter-salted-100-g',                        60.00,  62.00,  58.00),
      ('amul-masti-dahi-400-g',                           44.00,  45.00,  42.50),
      ('aashirvaad-shudh-chakki-atta-5-kg',              279.00, 285.00, 269.00),
      ('tata-salt-iodised-1-kg',                          27.00,  28.00,  26.50),
      ('fortune-sunlite-refined-sunflower-oil-1-l',      152.00, 155.00, 148.00),
      ('brooke-bond-red-label-tea-500-g',                265.00, 275.00, 259.00),
      ('maggi-2-minute-masala-noodles-280-g',             58.00,  60.00,  55.00),
      ('parle-g-original-glucose-biscuits-800-g',         87.00,  90.00,  85.00),
      ('colgate-strong-teeth-toothpaste-200-g',          115.00, 118.00, 110.00),
      ('surf-excel-easy-wash-detergent-powder-1-kg',     136.00, 140.00, 132.00)
  ) as prices (product_slug, price_a, price_b, price_c)
  join public.products p on p.slug = prices.product_slug
  cross join lateral (
    values
      (v_store_a, prices.price_a, 'in_stock',  40),
      (v_store_b, prices.price_b, 'in_stock',  25),
      (v_store_c, prices.price_c, 'low_stock',  6)
  ) as v (store_id, price, status, qty)
  on conflict (store_id, product_id) do update
    set selling_price       = excluded.selling_price,
        stock_status        = excluded.stock_status,
        quantity_available  = excluded.quantity_available,
        discount_percentage = excluded.discount_percentage,
        is_available        = excluded.is_available;

  -- One deliberately sold-out line, so the UI has a real out-of-stock case.
  update public.store_products sp
  set stock_status = 'out_of_stock',
      quantity_available = 0,
      is_available = false
  from public.products p
  where p.id = sp.product_id
    and sp.store_id = v_store_b
    and p.slug = 'maggi-2-minute-masala-noodles-280-g';

  raise notice 'Demo stores seeded for owner %', v_owner_id;
end
$$;


-- Summary --------------------------------------------------------------------------
select
  (select count(*) from public.stores)         as stores,
  (select count(*) from public.store_hours)    as store_hours,
  (select count(*) from public.store_products) as store_products;
