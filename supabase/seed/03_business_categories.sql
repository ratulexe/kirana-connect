-- =============================================================================
-- Kirana Connect - initial business category taxonomy
-- =============================================================================
-- Seed data, not schema -- matching the project convention that categories,
-- brands and products are seeded separately from the migration that creates
-- their table (see supabase/README.md). Safe to re-run: each row is keyed by
-- its unique slug and skipped if it already exists.
--
-- A concise, curated starting taxonomy, not a speculative one: the seven
-- business types below are the ones the Entrepreneur Platform's own supplied
-- problem statement names, plus a general fallback. No store is classified
-- into any of these by this file -- that is a separate, explicit choice made
-- by a store owner or admin later.
-- =============================================================================

insert into public.business_categories (name, slug, description) values
  ('Grocery Store', 'grocery-store',
   'A general kirana store selling everyday groceries, staples and household essentials.'),
  ('Dairy Store', 'dairy-store',
   'A shop primarily selling milk, dairy products and related fresh items.'),
  ('Fruits & Vegetables', 'fruits-vegetables',
   'A shop primarily selling fresh fruits and vegetables.'),
  ('Textiles', 'textiles',
   'A shop selling clothing, fabric and other textile goods.'),
  ('Stationery', 'stationery',
   'A shop selling stationery, books and office or school supplies.'),
  ('Electronics Retail', 'electronics-retail',
   'A shop selling electronics, appliances and related accessories.'),
  ('General Retail', 'general-retail',
   'A general retail shop that does not fit a more specific business category.')
on conflict (slug) do nothing;
