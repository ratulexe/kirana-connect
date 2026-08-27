import { apiGet, apiPost } from "../lib/api.js";

/**
 * Reservation writes/reads for the customer app. Every call is
 * authenticated (apiPost/apiGet attach the current Supabase session token,
 * see lib/api.js) -- there is no anonymous reservation read or write.
 */

export async function createReservation({
  storeProductId,
  quantity,
  pickupWindowStart,
  pickupWindowEnd,
}) {
  const { data } = await apiPost("/reservations", {
    store_product_id: storeProductId,
    quantity,
    pickup_window_start: pickupWindowStart,
    pickup_window_end: pickupWindowEnd,
  });
  return data;
}

export async function fetchMyReservations({ signal } = {}) {
  const { data } = await apiGet("/reservations/mine", { signal, auth: true });
  return data;
}

export async function cancelReservation(reservationId) {
  const { data } = await apiPost(`/reservations/${encodeURIComponent(reservationId)}/cancel`);
  return data;
}
