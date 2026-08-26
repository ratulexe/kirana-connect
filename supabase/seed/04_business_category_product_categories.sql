-- =============================================================================
-- Kirana Connect - initial business category -> product category mapping
-- =============================================================================
-- Seed data, not schema -- matching the project convention that reference
-- data is seeded separately from the migration that creates its table. Safe
-- to re-run: keyed by the (business_category_id, product_category_id) unique
-- pair and skipped if it already exists.
--
-- Checked against the actual live product-category taxonomy (audited via
-- GET /api/categories) before writing this, not assumed. Every mapping
-- below is a genuinely defensible fit for what that business type sells:
--
--   Grocery Store       -> the general kirana-shelf categories: staples,
--                          dairy, beverages, biscuits, snacks, chocolate,
--                          oils/ghee, household care, personal care,
--                          cleaning supplies, frozen food.
--   Dairy Store         -> Dairy and Eggs only -- deliberately narrow.
--   Fruits & Vegetables -> Fruits & Vegetables only -- a direct 1:1 match.
--   Textiles            -> Fashion (clothing/fabric is the closest existing
--                          catalogue category; there is no separate
--                          "Textiles" product category).
--   Stationery           -> Stationary (the catalogue category is spelled
--                          "Stationary", not "Stationery" -- mapped by
--                          meaning, not by string match).
--   Electronics Retail  -> Electronics, Smartphones, Computers and Laptops.
--
-- General Retail is deliberately left with NO mapping. Its own seeded
-- description is "a general retail shop that does not fit a more specific
-- business category" -- mapping it to everything (or to an arbitrary
-- subset) just to avoid an empty result would be exactly the "map
-- unrelated categories to increase coverage" this milestone was told not to
-- do. The application treats an unmapped business category as a real,
-- honest "not yet configured" state, not a bug.
-- =============================================================================

with mapping(business_category_slug, product_category_slug) as (
  values
    ('grocery-store', 'groceries-and-staples'),
    ('grocery-store', 'dairy-and-eggs'),
    ('grocery-store', 'beverages'),
    ('grocery-store', 'biscuits-and-cookies'),
    ('grocery-store', 'snacks-and-packaged-food'),
    ('grocery-store', 'chocolate'),
    ('grocery-store', 'oils-and-ghee'),
    ('grocery-store', 'household-care'),
    ('grocery-store', 'personal-care'),
    ('grocery-store', 'cleaners-and-repellents'),
    ('grocery-store', 'frozen-food'),
    ('dairy-store', 'dairy-and-eggs'),
    ('fruits-vegetables', 'fruits-vegetables'),
    ('textiles', 'fashion'),
    ('stationery', 'stationary'),
    ('electronics-retail', 'electronics'),
    ('electronics-retail', 'smartphones'),
    ('electronics-retail', 'computers-and-laptops')
)
insert into public.business_category_product_categories (business_category_id, product_category_id)
select bc.id, pc.id
from mapping m
join public.business_categories bc on bc.slug = m.business_category_slug
join public.categories pc on pc.slug = m.product_category_slug
on conflict (business_category_id, product_category_id) do nothing;
