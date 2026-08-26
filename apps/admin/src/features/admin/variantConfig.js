/**
 * Categories whose variants are picked by size (and sometimes color)
 * instead of a physical quantity + unit -- a shirt doesn't come in "500 g",
 * it comes in "M". Keyed by category slug. This is a deliberately small
 * hardcoded list rather than a category-level setting: only two categories
 * need it today, and adding a third is a one-line change here.
 *
 * Variants in a sized category still use the same quantity/unit_code
 * columns under the hood (fixed to 1 / "pc", see EMPTY_SIZED_VARIANT in
 * ProductForm.jsx) so no product_variants schema branch is needed there --
 * size_label and color are what actually distinguish the SKUs.
 */
export const SIZED_VARIANT_CATEGORIES = {
  fashion: {
    sizeOptions: ["XS", "S", "M", "L", "XL", "XXL"],
    hasColor: true,
  },
  furnitures: {
    sizeOptions: ["Small", "Medium", "Large"],
    hasColor: true,
  },
};

export function sizedVariantConfigForSlug(slug) {
  return SIZED_VARIANT_CATEGORIES[slug] ?? null;
}
