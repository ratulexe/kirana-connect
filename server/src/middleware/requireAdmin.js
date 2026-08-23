import { getServiceClient } from "../config/supabase.js";
import { httpError } from "../utils/httpError.js";

/**
 * Admin authorization sits behind requireAuth.
 *
 * The role is resolved from the trusted profiles row with the service client.
 * Browser state, request bodies and auth metadata are never accepted as proof
 * of admin access.
 */
export async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.id) throw httpError(401, "Authentication required.");

    const { data, error } = await getServiceClient()
      .from("profiles")
      .select("id, role, full_name, phone")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw httpError(502, "Could not verify admin access.");
    if (!data || data.role !== "admin") throw httpError(403, "Admin access required.");

    req.adminProfile = data;
    next();
  } catch (err) {
    next(err);
  }
}
