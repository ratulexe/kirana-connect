-- =============================================================================
-- Kirana Connect - remap store listings stuck on a hidden placeholder variant
-- =============================================================================
-- Background: many products in this catalogue were originally created with a
-- default "1 pc" placeholder variant, then later given real sized variants
-- (e.g. "500 g" / "1 kg"). The product API hides that placeholder from
-- customers once a real size exists (removePlaceholderPieceVariants in
-- server/src/utils/productUnits.js), but the store_products rows that were
-- seeded against the placeholder were never migrated to the real variant --
-- so those stores still technically "carry" the product, but against a size
-- nobody can ever see or select.
--
-- As of writing this affects roughly 152 products and 586 store_products
-- rows across the whole catalogue (checked directly against this database,
-- not an estimate).
--
-- server/src/services/catalogue.service.js's "available nearby" badge has
-- already been fixed in code to stop counting these rows, so the visible bug
-- (a product shown as "available nearby" that then says "not available" on
-- its own page) is already resolved without running this. This script is
-- the separate, optional follow-up: it makes those 586 listings actually
-- purchasable again, by pointing them at a real variant instead of leaving
-- them stuck on an invisible one.
--
-- What it does, per affected store_products row:
--   1. If the product has exactly one real (non-placeholder) variant, use it
--      -- unambiguous, most of the 152 products fall in this case.
--   2. Otherwise, pick whichever real variant's mrp is closest to the row's
--      own selling_price -- a heuristic, since nothing records which size
--      the store actually meant. Worth spot-checking after running.
--   3. If the store already has a separate row for that target variant
--      (store_id + product_variant_id must be unique), the placeholder row
--      is deleted instead of updated, rather than fail on the conflict.
--
-- Safe to re-run: rows with no matching placeholder are left untouched, and
-- once remapped a row no longer matches the placeholder criteria.
-- =============================================================================

do $$
declare
  r record;
  v_target_variant uuid;
  v_conflict_exists boolean;
  v_updated int := 0;
  v_deleted int := 0;
  v_skipped int := 0;
begin
  for r in
    with placeholder_products as (
      select pv.product_id
      from public.product_variants pv
      where pv.is_active
      group by pv.product_id
      having bool_or(pv.quantity = 1 and lower(pv.unit_code) = 'pc')
         and bool_or(lower(pv.unit_code) <> 'pc')
    ),
    hidden_variants as (
      select pv.id as variant_id, pv.product_id
      from public.product_variants pv
      join placeholder_products pp on pp.product_id = pv.product_id
      where pv.quantity = 1 and lower(pv.unit_code) = 'pc'
    )
    select sp.id as store_product_id, sp.store_id, sp.selling_price, hv.product_id
    from public.store_products sp
    join hidden_variants hv on hv.variant_id = sp.product_variant_id
  loop
    -- Pick the replacement: the one real variant if there is only one,
    -- otherwise the real variant whose mrp is closest to what this store
    -- already charges.
    select pv.id into v_target_variant
    from public.product_variants pv
    where pv.product_id = r.product_id
      and pv.is_active
      and not (pv.quantity = 1 and lower(pv.unit_code) = 'pc')
    order by abs(pv.mrp - r.selling_price) asc, pv.created_at asc
    limit 1;

    if v_target_variant is null then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    select exists(
      select 1 from public.store_products
      where store_id = r.store_id
        and product_variant_id = v_target_variant
        and id <> r.store_product_id
    ) into v_conflict_exists;

    if v_conflict_exists then
      delete from public.store_products where id = r.store_product_id;
      v_deleted := v_deleted + 1;
    else
      update public.store_products
      set product_variant_id = v_target_variant
      where id = r.store_product_id;
      v_updated := v_updated + 1;
    end if;
  end loop;

  raise notice 'Remapped %, deleted % (already had the real variant), skipped % (no real variant found)',
    v_updated, v_deleted, v_skipped;
end
$$;
