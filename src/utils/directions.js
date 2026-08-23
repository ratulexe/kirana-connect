/**
 * A maps link for walking to a store.
 *
 * Coordinates are used when the store has them, because a pin is unambiguous
 * in a way a written address is not. The address is the fallback so a store
 * that has not been geocoded still gets a usable link.
 */
export function directionsUrl(store) {
  const hasCoordinates = Number.isFinite(Number(store?.latitude)) && Number.isFinite(Number(store?.longitude));

  const destination = hasCoordinates
    ? `${store.latitude},${store.longitude}`
    : [store?.name, store?.address_line_1, store?.locality, store?.city, store?.postal_code]
        .filter(Boolean)
        .join(", ");

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}
