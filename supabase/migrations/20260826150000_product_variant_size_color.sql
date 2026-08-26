-- =============================================================================
-- Kirana Connect - sized product variants (e.g. Fashion, Furniture)
-- =============================================================================
-- Some categories sell by size (and sometimes color), not by a physical
-- quantity + unit: a shirt doesn't come in "500 g", it comes in "M". Rather
-- than repurposing unit_code for non-measurement concepts, this adds two
-- optional columns that, when present, take over the display label instead
-- of the quantity/unit-derived one. quantity/unit_code stay required and
-- populated (the app sends 1 / 'pc' for sized variants) so every existing
-- constraint, index, and legacy-sync trigger keeps working unmodified.
-- =============================================================================

alter table public.product_variants
  add column if not exists size_label text,
  add column if not exists color text;

do $$
begin
  alter table public.product_variants
    add constraint product_variants_size_label_not_blank
    check (size_label is null or char_length(btrim(size_label)) > 0);
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.product_variants
    add constraint product_variants_color_not_blank
    check (color is null or char_length(btrim(color)) > 0);
exception when duplicate_object then null;
end
$$;

comment on column public.product_variants.size_label is
  'Size choice for non-measured categories (e.g. "M", "Large"). When set, this and color drive unit_label instead of quantity/unit_code.';
comment on column public.product_variants.color is
  'Optional color/finish paired with size_label, e.g. "Navy Blue".';

-- The unit_label trigger now branches: sized variants (size_label present)
-- get "<size>" or "<size> - <color>"; everything else keeps the existing
-- quantity + unit label untouched.
create or replace function public.set_product_variant_unit_label()
returns trigger
language plpgsql
as $$
begin
  if new.size_label is not null and btrim(new.size_label) <> '' then
    new.unit_label := btrim(new.size_label) || case
      when new.color is not null and btrim(new.color) <> '' then ' - ' || btrim(new.color)
      else ''
    end;
  else
    new.unit_code := public.normalize_unit_code(new.unit_code);
    new.unit_label := public.product_unit_label(new.quantity, new.unit_code);
  end if;
  return new;
end;
$$;

drop trigger if exists product_variants_set_unit_label on public.product_variants;
create trigger product_variants_set_unit_label
  before insert or update of quantity, unit_code, size_label, color on public.product_variants
  for each row execute function public.set_product_variant_unit_label();

-- No index change needed: the existing product_id/unit_label uniqueness
-- already keeps sizes distinct. Every sized variant of a product shares
-- quantity=1, unit_code='pc', so unit_label ("M", "M - Navy Blue") is what
-- actually distinguishes them -- the same guarantee quantity+unit already
-- gave measured variants.
