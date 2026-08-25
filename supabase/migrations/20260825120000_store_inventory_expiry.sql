-- =============================================================================
-- Kirana Connect - store inventory expiry / best-before visibility
-- =============================================================================
-- Expiry belongs to the STORE-SPECIFIC INVENTORY row (store_products), not to
-- products or product_variants: the same canonical variant (e.g. Amul Taaza
-- 500 ml) can sit on different shelves in different stores with different
-- expiry dates on the stock currently being sold.
--
-- PROTOTYPE SCOPE (documented deliberately):
--   One nullable expiry_date per (store, product_variant) row represents the
--   expiry/best-before date of the stock this store is CURRENTLY advertising.
--   This is intentionally not a batch system: no batch_id, no manufacturing
--   date, no per-batch quantity, no FIFO. A future store_inventory_batches
--   table (batch_id, quantity, manufacturing_date, expiry_date) can layer
--   batch-level tracking on top of this later; it is out of scope here.
-- =============================================================================

alter table public.store_products
  add column if not exists expiry_date date;

comment on column public.store_products.expiry_date is
  'Best-before/expiry date of the stock this store currently advertises for this variant. Nullable: many products carry no expiry, or the owner has not entered it yet. Prototype scope: one date per row, not a batch history -- see migration header.';

-- -----------------------------------------------------------------------------
-- Column privileges: store owners may set/clear their own expiry date.
-- -----------------------------------------------------------------------------
grant insert (expiry_date) on table public.store_products to authenticated;
grant update (expiry_date) on table public.store_products to authenticated;

-- -----------------------------------------------------------------------------
-- Public visibility: expired inventory must never be publicly discoverable.
-- expires_today stays visible on purpose (expiry_date >= current_date), so a
-- product due today is still listed with a clear "Expires today" label rather
-- than silently disappearing at midnight.
-- -----------------------------------------------------------------------------
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
    and (expiry_date is null or expiry_date >= current_date)
  );

-- Store owners still see their own rows regardless of expiry (store_products_select_own,
-- created in the product-variants migration, is untouched: it has no expiry condition).
