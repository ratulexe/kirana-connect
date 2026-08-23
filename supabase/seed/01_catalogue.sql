-- =============================================================================
-- Kirana Connect - catalogue seed
-- =============================================================================
-- Categories, brands and canonical products. No store, price or stock data:
-- those belong to a store and are seeded in 02_demo_stores.sql.
--
-- Safe to re-run. Every insert is ON CONFLICT (slug) DO NOTHING, so existing
-- rows are left untouched.
--
-- Run this in the Supabase SQL Editor, or with the CLI. It is NOT part of the
-- schema migration on purpose: a migration describes structure, a seed
-- describes content.
-- =============================================================================


-- Categories -------------------------------------------------------------------
insert into public.categories (name, slug, description)
values
  ('Groceries and Staples', 'groceries-and-staples', 'Atta, rice, dal, oil, sugar and salt'),
  ('Dairy and Eggs',        'dairy-and-eggs',        'Milk, curd, paneer, butter and eggs'),
  ('Beverages',             'beverages',             'Tea, coffee, soft drinks and juices'),
  ('Snacks and Packaged Food', 'snacks-and-packaged-food', 'Biscuits, namkeen, noodles and chocolates'),
  ('Personal Care',         'personal-care',         'Soap, shampoo, toothpaste and grooming'),
  ('Household Care',        'household-care',        'Detergent, cleaners and utensil care')
on conflict (slug) do nothing;


-- Brands -----------------------------------------------------------------------
insert into public.brands (name, slug)
values
  ('Amul', 'amul'),
  ('Aashirvaad', 'aashirvaad'),
  ('Tata', 'tata'),
  ('Fortune', 'fortune'),
  ('Britannia', 'britannia'),
  ('Parle', 'parle'),
  ('Nestle', 'nestle'),
  ('Maggi', 'maggi'),
  ('Haldiram', 'haldiram'),
  ('Colgate', 'colgate'),
  ('Dove', 'dove'),
  ('Surf Excel', 'surf-excel'),
  ('Vim', 'vim'),
  ('Red Label', 'red-label')
on conflict (slug) do nothing;


-- Products ---------------------------------------------------------------------
-- MRP is the printed maximum retail price. What a customer actually pays is set
-- per store in store_products, which is what makes comparison possible.
insert into public.products (category_id, brand_id, name, slug, description, unit_label, mrp)
select c.id, b.id, v.name, v.slug, v.description, v.unit_label, v.mrp
from (
  values
    -- Dairy and eggs
    ('dairy-and-eggs', 'amul', 'Amul Taaza Toned Milk', 'amul-taaza-toned-milk-500-ml',
     'Homogenised toned milk in a tetra pack', '500 ml', 33.00),
    ('dairy-and-eggs', 'amul', 'Amul Butter Salted', 'amul-butter-salted-100-g',
     'Pasteurised salted table butter', '100 g', 62.00),
    ('dairy-and-eggs', 'amul', 'Amul Masti Dahi', 'amul-masti-dahi-400-g',
     'Fresh set curd in a cup', '400 g', 45.00),
    ('dairy-and-eggs', 'amul', 'Amul Malai Paneer', 'amul-malai-paneer-200-g',
     'Fresh malai paneer block', '200 g', 99.00),

    -- Groceries and staples
    ('groceries-and-staples', 'aashirvaad', 'Aashirvaad Shudh Chakki Atta', 'aashirvaad-shudh-chakki-atta-5-kg',
     'Whole wheat chakki atta', '5 kg', 285.00),
    ('groceries-and-staples', 'tata', 'Tata Salt Iodised', 'tata-salt-iodised-1-kg',
     'Vacuum evaporated iodised salt', '1 kg', 28.00),
    ('groceries-and-staples', 'fortune', 'Fortune Sunlite Refined Sunflower Oil', 'fortune-sunlite-refined-sunflower-oil-1-l',
     'Refined sunflower cooking oil pouch', '1 L', 155.00),
    ('groceries-and-staples', 'tata', 'Tata Sampann Toor Dal', 'tata-sampann-toor-dal-1-kg',
     'Unpolished toor dal', '1 kg', 189.00),

    -- Beverages
    ('beverages', 'red-label', 'Brooke Bond Red Label Tea', 'brooke-bond-red-label-tea-500-g',
     'Strong blended black tea', '500 g', 275.00),
    ('beverages', 'nestle', 'Nescafe Classic Instant Coffee', 'nescafe-classic-instant-coffee-50-g',
     'Instant coffee powder jar', '50 g', 190.00),
    ('beverages', 'tata', 'Tata Tea Gold', 'tata-tea-gold-250-g',
     'Assam tea blended with long leaves', '250 g', 160.00),

    -- Snacks and packaged food
    ('snacks-and-packaged-food', 'maggi', 'Maggi 2-Minute Masala Noodles', 'maggi-2-minute-masala-noodles-280-g',
     'Instant noodles, pack of four', '280 g', 60.00),
    ('snacks-and-packaged-food', 'britannia', 'Britannia Good Day Cashew Cookies', 'britannia-good-day-cashew-cookies-200-g',
     'Cashew butter cookies', '200 g', 50.00),
    ('snacks-and-packaged-food', 'parle', 'Parle-G Original Glucose Biscuits', 'parle-g-original-glucose-biscuits-800-g',
     'Glucose biscuits family pack', '800 g', 90.00),
    ('snacks-and-packaged-food', 'haldiram', 'Haldiram Aloo Bhujia', 'haldiram-aloo-bhujia-400-g',
     'Spiced potato and gram flour namkeen', '400 g', 105.00),

    -- Personal care
    ('personal-care', 'colgate', 'Colgate Strong Teeth Toothpaste', 'colgate-strong-teeth-toothpaste-200-g',
     'Anticavity fluoride toothpaste', '200 g', 118.00),
    ('personal-care', 'dove', 'Dove Cream Beauty Bathing Bar', 'dove-cream-beauty-bathing-bar-100-g',
     'Moisturising bathing bar', '100 g', 72.00),

    -- Household care
    ('household-care', 'surf-excel', 'Surf Excel Easy Wash Detergent Powder', 'surf-excel-easy-wash-detergent-powder-1-kg',
     'Machine and hand wash detergent powder', '1 kg', 140.00),
    ('household-care', 'vim', 'Vim Dishwash Liquid Gel Lemon', 'vim-dishwash-liquid-gel-lemon-750-ml',
     'Lemon dishwashing gel bottle', '750 ml', 165.00)
) as v (category_slug, brand_slug, name, slug, description, unit_label, mrp)
join public.categories c on c.slug = v.category_slug
join public.brands     b on b.slug = v.brand_slug
on conflict (slug) do nothing;


-- Summary ------------------------------------------------------------------------
select
  (select count(*) from public.categories) as categories,
  (select count(*) from public.brands)     as brands,
  (select count(*) from public.products)   as products;
