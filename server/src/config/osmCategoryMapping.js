/**
 * The one place a Kirana Connect business category is translated into
 * OpenStreetMap `shop=*` tag values. Keyed by business_categories.slug (the
 * stable identifier, not the editable display name) so this stays correct
 * even if an admin renames a category later.
 *
 * Verified against OSM's actual shop=* tagging scheme, not guessed:
 * convenience, supermarket, dairy, greengrocer, fabric, clothes, stationery,
 * electronics, general, variety_store and department_store are all
 * established OSM shop values, not invented ones.
 *
 * "general" deliberately appears under both grocery-store and
 * general-retail: OSM's own shop=general tag is itself ambiguous between a
 * small general/kirana-style store and generic retail, so a single mapping
 * cannot separate what the source data does not separate.
 */
export const OSM_CATEGORY_MAPPING = {
  "grocery-store": ["convenience", "supermarket", "general"],
  "dairy-store": ["dairy"],
  "fruits-vegetables": ["greengrocer"],
  textiles: ["fabric", "clothes"],
  stationery: ["stationery"],
  "electronics-retail": ["electronics"],
  "general-retail": ["general", "variety_store", "department_store"],
};

export function osmShopTagsForCategory(categorySlug) {
  return OSM_CATEGORY_MAPPING[categorySlug] ?? [];
}
