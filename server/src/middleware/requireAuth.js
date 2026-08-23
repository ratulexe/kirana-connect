import { getPublicClient } from "../config/supabase.js";
import { httpError } from "../utils/httpError.js";

/**
 * Verifies a Supabase access token supplied as `Authorization: Bearer <token>`.
 *
 * The token is verified by asking Supabase Auth who it belongs to, rather than
 * decoding the JWT locally. A locally decoded JWT proves nothing without
 * signature and expiry validation, and getting that wrong is the difference
 * between authentication and a suggestion.
 *
 * The identity attached to the request comes only from that response. Anything
 * in the request body claiming to be a user id or email is ignored everywhere
 * downstream.
 *
 * The token itself is never logged.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") ?? "";
    const [scheme, token] = header.split(" ");

    if (!token || scheme?.toLowerCase() !== "bearer") {
      throw httpError(401, "Authentication required.");
    }

    const { data, error } = await getPublicClient().auth.getUser(token);

    if (error || !data?.user) {
      throw httpError(401, "Your session is invalid or has expired. Please sign in again.");
    }

    req.user = { id: data.user.id, email: data.user.email ?? null };

    next();
  } catch (err) {
    next(err);
  }
}
