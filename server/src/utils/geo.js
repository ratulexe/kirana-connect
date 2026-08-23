// Proximity helpers. Deliberately plain arithmetic: the schema stores latitude
// and longitude as numeric columns and the project does not depend on PostGIS.
// The database narrows candidates with a bounding box, then these functions
// compute and rank true distances over that small result set.

const EARTH_RADIUS_KM = 6371;
const KM_PER_DEGREE_LAT = 111.045;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two points, in kilometres.
 */
export function haversineKm(fromLat, fromLng, toLat, toLng) {
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Latitude/longitude box that fully contains a radius around a point.
 *
 * The box is a superset of the true circle, so results still need filtering by
 * real distance afterwards. Longitude degrees shrink towards the poles, hence
 * the cosine term; it is clamped so the maths cannot divide by ~zero.
 */
export function boundingBox(lat, lng, radiusKm) {
  const latDelta = radiusKm / KM_PER_DEGREE_LAT;
  const cosLat = Math.max(Math.cos(toRadians(lat)), 0.01);
  const lngDelta = radiusKm / (KM_PER_DEGREE_LAT * cosLat);

  return {
    minLat: Math.max(lat - latDelta, -90),
    maxLat: Math.min(lat + latDelta, 90),
    minLng: Math.max(lng - lngDelta, -180),
    maxLng: Math.min(lng + lngDelta, 180),
  };
}

/**
 * Distance rounded to a sensible display precision, in kilometres.
 */
export function roundKm(value) {
  return Math.round(value * 100) / 100;
}
