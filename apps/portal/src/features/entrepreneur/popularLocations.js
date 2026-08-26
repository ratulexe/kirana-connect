/**
 * Quick-pick starting points shown when the location field is empty.
 *
 * These are NOT search results and are never presented as such -- the
 * dropdown labels them "Popular locations" and they only appear before the
 * entrepreneur has typed anything. The moment a real query starts, live
 * provider results replace them entirely (see LocationAutocompleteInput).
 *
 * Every coordinate below was resolved from the real configured geocoder and
 * pasted verbatim -- none are hand-estimated. They exist so a first-time
 * visitor (or a demo) has a working starting point in one tap instead of
 * having to know what to type.
 */
export const POPULAR_LOCATIONS = [
  {
    id: "popular-agarpara",
    label: "Agarpara, Nilgunj Road, Sodepur, Kamarhati - 700058, WB, India",
    shortLabel: "Agarpara, Kamarhati",
    latitude: 22.6828782,
    longitude: 88.3853645,
  },
  {
    id: "popular-singur",
    label: "Singur, WB, India",
    shortLabel: "Singur, Hooghly",
    latitude: 22.8130387,
    longitude: 88.2283646,
  },
  {
    id: "popular-esplanade",
    label: "Esplanade, Kolkata - 700001, WB, India",
    shortLabel: "Esplanade, Kolkata",
    latitude: 22.563292,
    longitude: 88.3503566,
  },
  {
    id: "popular-bidhannagar",
    label: "Bidhannagar, WB, India",
    shortLabel: "Salt Lake (Bidhannagar)",
    latitude: 22.590425,
    longitude: 88.41692,
  },
  {
    id: "popular-howrah",
    label: "Howrah, WB, India",
    shortLabel: "Howrah",
    latitude: 22.5736296,
    longitude: 88.3251045,
  },
];
