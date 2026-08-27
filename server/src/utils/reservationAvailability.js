import { getServiceClient } from "../config/supabase.js";
import { httpError } from "./httpError.js";

/**
 * Active, unexpired reservation quantity per store_products row, batched to
 * avoid N+1. Shared by every service that shows or gates on availability
 * (discovery.service.js's store-comparison list, inventory.service.js's
 * On hand/Reserved/Available) so the same definition of "held right now" is
 * used everywhere: status = 'active' AND expires_at > now(). That WHERE
 * clause -- not any status-column bookkeeping -- is what makes an expired
 * hold stop counting automatically, cleanup job or not.
 *
 * Reservations are never readable by the anon/public client (see the
 * reservations table's RLS), so this always uses the service role -- a
 * read of aggregate quantities only, never full reservation rows, so no
 * customer identity or reservation code leaks through it.
 */
export async function getActiveReservedQuantities(storeProductIds) {
  if (!storeProductIds || storeProductIds.length === 0) return new Map();

  const { data, error } = await getServiceClient()
    .from("reservations")
    .select("store_product_id, quantity")
    .in("store_product_id", storeProductIds)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  if (error) throw httpError(502, `Supabase active-reservation lookup failed: ${error.message}`);

  const totals = new Map();
  for (const row of data ?? []) {
    totals.set(row.store_product_id, (totals.get(row.store_product_id) ?? 0) + row.quantity);
  }
  return totals;
}

/** available = max(on hand - active reserved, 0); null when stock isn't tracked exactly. */
export function computeAvailableQuantity(quantityAvailable, activeReserved) {
  if (quantityAvailable === null || quantityAvailable === undefined) return null;
  return Math.max(quantityAvailable - (activeReserved ?? 0), 0);
}
