import { getServiceClient } from "../config/supabase.js";
import { httpError, notFoundError } from "../utils/httpError.js";
import { resolveOwnedStore } from "./inventory.service.js";

/**
 * Product reservations: a temporary hold against one store's inventory row
 * (store_products), never an order and never an immediate stock decrement.
 * The atomic guarantees this module depends on -- no two customers can hold
 * the last unit, and collection cannot double-decrement stock -- live in the
 * database as the create_reservation / collect_reservation functions (see
 * supabase/migrations/20260827100000_reservations.sql). This module's job is
 * shaping requests into those calls, translating their errors into HTTP
 * responses, and shaping reservation rows for display -- it never computes
 * availability or touches quantity_available itself.
 */

const RESERVATION_FIELDS = `
  id, reservation_code, quantity, pickup_window_start, pickup_window_end, expires_at,
  status, cancellation_reason, cancelled_at, collected_at, expired_at, created_at,
  store:stores (
    id, name, slug, phone,
    address_line_1, address_line_2, locality, city, state, postal_code,
    latitude, longitude
  ),
  store_product:store_products (
    id, selling_price,
    variant:product_variants!store_products_product_variant_id_fkey (
      id, unit_label, image_url, size_label, color,
      product:products!inner (id, name, slug, image_url)
    )
  )
`;

// The store-facing shape deliberately omits any customer profile join --
// the store never needs the customer's name/phone/email to complete a
// pickup, only the code the customer shows them, per the "do not expose
// unnecessary consumer PII" requirement.
const STORE_RESERVATION_FIELDS = `
  id, reservation_code, quantity, pickup_window_start, pickup_window_end, expires_at,
  status, cancelled_at, collected_at, expired_at, created_at,
  store_product:store_products (
    id, selling_price,
    variant:product_variants!store_products_product_variant_id_fkey (
      id, unit_label, image_url, size_label, color,
      product:products!inner (id, name, slug, image_url)
    )
  )
`;

function failed(operation, error) {
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

/**
 * The create/collect database functions signal specific conflicts with a
 * `CODE: human-readable detail` message rather than relying on SQLSTATEs,
 * which stay reserved for genuine Postgres-level failures. This is the one
 * place that vocabulary is translated into an HTTP status, so every caller
 * gets a consistent, honest response instead of a raw database error.
 */
const RPC_ERROR_STATUS = {
  RESERVATION_INVALID: 400,
  RESERVATION_NOT_FOUND: 404,
  RESERVATION_UNTRACKED_STOCK: 409,
  RESERVATION_CONFLICT: 409,
  RESERVATION_CODE_EXHAUSTED: 409,
  RESERVATION_WRONG_STORE: 403,
  RESERVATION_ALREADY_COLLECTED: 409,
  RESERVATION_ALREADY_CANCELLED: 409,
  RESERVATION_EXPIRED: 409,
  RESERVATION_INSUFFICIENT_STOCK: 409,
};

function rpcError(error, fallbackOperation) {
  const message = String(error?.message ?? "");
  const [code, ...rest] = message.split(":");
  const status = RPC_ERROR_STATUS[code.trim()];
  if (status) {
    const detail = rest.join(":").trim();
    return httpError(status, detail || humanizeRpcCode(code.trim()));
  }
  return failed(fallbackOperation, error);
}

function humanizeRpcCode(code) {
  switch (code) {
    case "RESERVATION_NOT_FOUND":
      return "That reservation could not be found.";
    case "RESERVATION_CONFLICT":
      return "This item is no longer available in the quantity you requested.";
    case "RESERVATION_UNTRACKED_STOCK":
      return "This store has not entered exact stock for this item, so it cannot be reserved yet.";
    case "RESERVATION_WRONG_STORE":
      return "That reservation does not belong to this store.";
    case "RESERVATION_ALREADY_COLLECTED":
      return "This reservation has already been collected.";
    case "RESERVATION_ALREADY_CANCELLED":
      return "This reservation has already been cancelled.";
    case "RESERVATION_EXPIRED":
      return "This reservation has expired.";
    case "RESERVATION_INSUFFICIENT_STOCK":
      return "There is not enough recorded stock left to complete this collection.";
    default:
      return "That reservation request could not be completed.";
  }
}

function shapeReservation(row) {
  if (!row) return row;
  const variant = row.store_product?.variant;
  const product = variant?.product;
  return {
    id: row.id,
    reservation_code: row.reservation_code,
    quantity: row.quantity,
    pickup_window_start: row.pickup_window_start,
    pickup_window_end: row.pickup_window_end,
    expires_at: row.expires_at,
    status: row.status,
    cancellation_reason: row.cancellation_reason ?? null,
    cancelled_at: row.cancelled_at,
    collected_at: row.collected_at,
    expired_at: row.expired_at,
    created_at: row.created_at,
    store: row.store ?? null,
    product: product
      ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
          image_url: variant.image_url ?? product.image_url,
          unit_label: variant.unit_label,
          size_label: variant.size_label ?? null,
          color: variant.color ?? null,
        }
      : null,
    selling_price: row.store_product?.selling_price ?? null,
  };
}

async function fetchReservationById(client, id, fields) {
  const { data, error } = await client.from("reservations").select(fields).eq("id", id).maybeSingle();
  if (error) throw failed("load that reservation", error);
  return data;
}

/**
 * Called with userId already verified by requireAuth -- the database
 * function receives it as an explicit parameter, never reads it from
 * anything the client supplied.
 */
export async function createReservation({ userId, payload }) {
  const client = getServiceClient();

  const { data, error } = await client.rpc("create_reservation", {
    p_user_id: userId,
    p_store_product_id: payload.store_product_id,
    p_quantity: payload.quantity,
    p_pickup_window_start: payload.pickup_window_start,
    p_pickup_window_end: payload.pickup_window_end,
    p_expires_at: payload.expires_at,
  });

  if (error) throw rpcError(error, "create reservation");

  const full = await fetchReservationById(client, data.id, RESERVATION_FIELDS);
  return shapeReservation(full ?? data);
}

export async function listMyReservations({ userId }) {
  const client = getServiceClient();

  // Bookkeeping only, see the migration's comment on this function -- the
  // status column is refreshed here so "My Reservations" shows an accurate
  // label even if this user's own create/cancel calls are the only traffic
  // this row will ever see again.
  // supabase-js query builders resolve to { data, error } rather than
  // rejecting, so there is nothing to .catch() here -- and this call is
  // bookkeeping-only anyway (see the migration's comment on the function),
  // so its error is intentionally not inspected.
  await client.rpc("expire_stale_reservations", { p_store_product_id: null });

  const { data, error } = await client
    .from("reservations")
    .select(RESERVATION_FIELDS)
    .eq("user_id", userId)
    .order("status", { ascending: true }) // 'active' sorts before the other three alphabetically
    .order("created_at", { ascending: false });

  if (error) throw failed("load your reservations", error);
  return (data ?? []).map(shapeReservation);
}

export async function cancelReservation({ userId, reservationId }) {
  const client = getServiceClient();

  // A single conditional UPDATE is already atomic; no stored function is
  // needed here since, unlike collection, cancellation never touches
  // store_products (physical stock was never decremented on reserve).
  const { data, error } = await client
    .from("reservations")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: userId })
    .eq("id", reservationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .select(RESERVATION_FIELDS)
    .maybeSingle();

  if (error) throw failed("cancel that reservation", error);
  if (!data) {
    // Same response whether the reservation does not exist, belongs to
    // someone else, or is no longer active -- never confirms which.
    throw notFoundError("That reservation is not an active reservation of yours.");
  }

  return shapeReservation(data);
}

// ---------------------------------------------------------------------------
// Store Portal
// ---------------------------------------------------------------------------

export async function listStoreReservations({ userId, storeId }) {
  const store = await resolveOwnedStore(userId, storeId);
  const client = getServiceClient();

  // supabase-js query builders resolve to { data, error } rather than
  // rejecting, so there is nothing to .catch() here -- and this call is
  // bookkeeping-only anyway (see the migration's comment on the function),
  // so its error is intentionally not inspected.
  await client.rpc("expire_stale_reservations", { p_store_product_id: null });

  const { data, error } = await client
    .from("reservations")
    .select(STORE_RESERVATION_FIELDS)
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw failed("load reservations", error);
  return { store, reservations: (data ?? []).map(shapeReservation) };
}

export async function findStoreReservationByCode({ userId, storeId, code }) {
  const store = await resolveOwnedStore(userId, storeId);
  const client = getServiceClient();

  // supabase-js query builders resolve to { data, error } rather than
  // rejecting, so there is nothing to .catch() here -- and this call is
  // bookkeeping-only anyway (see the migration's comment on the function),
  // so its error is intentionally not inspected.
  await client.rpc("expire_stale_reservations", { p_store_product_id: null });

  const { data, error } = await client
    .from("reservations")
    .select(STORE_RESERVATION_FIELDS)
    .eq("store_id", store.id)
    .eq("reservation_code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw failed("look up that reservation", error);
  if (!data) {
    // Deliberately identical whether the code has never existed or belongs
    // to a different store -- a code is a pickup convenience, not a search
    // key another store's staff can use to probe this one's reservations.
    throw notFoundError("No reservation with that code was found for this store.");
  }

  return shapeReservation(data);
}

export async function collectStoreReservation({ userId, storeId, reservationId }) {
  const store = await resolveOwnedStore(userId, storeId);
  const client = getServiceClient();

  const { data, error } = await client.rpc("collect_reservation", {
    p_reservation_id: reservationId,
    p_store_id: store.id,
  });

  if (error) throw rpcError(error, "collect that reservation");

  const full = await fetchReservationById(client, data.id, STORE_RESERVATION_FIELDS);
  return shapeReservation(full ?? data);
}
