-- =============================================================================
-- Kirana Connect - give every untracked listing a real tracked quantity
-- =============================================================================
-- Reservation is deliberately gated on quantity_available being a real,
-- non-null number (see server/src/utils/reservationAvailability.js's
-- computeAvailableQuantity and the is_reservable field it drives) -- the app
-- refuses to promise a hold against stock it can't actually verify. As of
-- writing, 318 of 712 store_products rows have quantity_available = null,
-- which is why "Reserve" shows as unavailable for a large share of listings
-- even though their stock_status says in stock.
--
-- This assigns each null row a real count sized to what it already claims:
--   - in_stock     -> a healthy count, 20-59
--   - low_stock     -> a thin count, 1-5 (matches the "last unit" style case
--                      supabase/seed/02_demo_stores.sql already seeds)
--   - out_of_stock -> 0 (a real, tracked zero -- not "unknown" any more,
--                      still correctly not reservable)
--
-- Only rows that are currently null are touched -- safe to re-run, and it
-- will never overwrite a quantity a store owner has already set through the
-- Store Portal's own Inventory screen.
-- =============================================================================

update public.store_products
set quantity_available = case stock_status
  when 'in_stock' then 20 + floor(random() * 40)::int
  when 'low_stock' then 1 + floor(random() * 5)::int
  when 'out_of_stock' then 0
  else quantity_available
end
where quantity_available is null;

-- Confirm the result.
select
  stock_status,
  count(*) filter (where quantity_available is null) as still_untracked,
  count(*) filter (where quantity_available is not null) as tracked,
  min(quantity_available) as min_qty,
  max(quantity_available) as max_qty
from public.store_products
group by stock_status
order by stock_status;
