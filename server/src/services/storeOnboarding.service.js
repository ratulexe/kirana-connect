import { getServiceClient } from "../config/supabase.js";
import { httpError } from "../utils/httpError.js";
import { generateUniqueSlug } from "../utils/slug.js";

/**
 * Store onboarding.
 *
 * These operations deliberately use the service-role client, which bypasses
 * RLS, because an owner must be able to see their own store before it is
 * verified while the public policies correctly hide it. That makes every query
 * here responsible for its own scoping: each one filters on the authenticated
 * owner id, which comes from the verified token and never from the request body.
 */

const STORE_FIELDS = `
  id, name, slug, description, phone,
  address_line_1, address_line_2, locality, city, state, postal_code,
  latitude, longitude, is_active, is_verified, created_at
`;

function failed(operation, error) {
  // The database message is kept out of the response: it can leak column and
  // constraint names. It is still logged for the operator.
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

function toStatus(stores) {
  if (stores.length === 0) return "no_application";
  return stores.some((store) => store.is_verified) ? "approved" : "pending";
}

/**
 * Every store belonging to one owner, with a derived application status.
 */
export async function getOnboardingStatus(userId) {
  const client = getServiceClient();

  const { data: stores, error } = await client
    .from("stores")
    .select(STORE_FIELDS)
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw failed("load your store application", error);

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw failed("load your profile", profileError);

  return {
    status: toStatus(stores ?? []),
    stores: stores ?? [],
    profile: profile ?? null,
  };
}

async function fetchStoreHours(client, storeId) {
  const { data, error } = await client
    .from("store_hours")
    .select("day_of_week, opens_at, closes_at, is_closed")
    .eq("store_id", storeId)
    .order("day_of_week", { ascending: true });

  if (error) throw failed("load opening hours", error);
  return data ?? [];
}

/**
 * Creates a store application for the authenticated owner.
 *
 * owner_id is taken from the verified session and is_verified is pinned to
 * false here, in trusted code, so neither can be influenced by the payload.
 */
export async function createStoreApplication({ userId, store, owner, hours }) {
  const client = getServiceClient();

  // One application at a time keeps the prototype honest about duplicates. The
  // schema still allows several stores per owner, so this is a UX rule enforced
  // here rather than a database constraint that would block the real model.
  const existing = await getOnboardingStatus(userId);
  if (existing.stores.length > 0) {
    const conflict = httpError(409, "You have already registered a store.");
    conflict.payload = existing;
    throw conflict;
  }

  const isTaken = async (candidate) => {
    const { data, error } = await client
      .from("stores")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw failed("check the store address", error);
    return Boolean(data);
  };

  const slug = await generateUniqueSlug(store.name, isTaken);

  const { data: created, error: insertError } = await client
    .from("stores")
    .insert({
      ...store,
      slug,
      owner_id: userId,
      // An unverified store stays active but is invisible publicly, because the
      // public policy requires is_active AND is_verified. Approval alone then
      // makes it discoverable, with no second flag to remember.
      is_active: true,
      is_verified: false,
    })
    .select(STORE_FIELDS)
    .single();

  if (insertError) throw failed("submit your store", insertError);

  if (hours.length > 0) {
    const { error: hoursError } = await client
      .from("store_hours")
      .insert(hours.map((entry) => ({ ...entry, store_id: created.id })));

    if (hoursError) {
      // Roll back rather than leave a store with no hours and no way to add them.
      await client.from("stores").delete().eq("id", created.id);
      throw failed("save your opening hours", hoursError);
    }
  }

  // Only ever the safe columns. role is never written here: promotion to seller
  // is an admin decision, not a side effect of filling in a form.
  const profilePatch = {};
  if (owner.full_name) profilePatch.full_name = owner.full_name;
  if (owner.phone) profilePatch.phone = owner.phone;

  if (Object.keys(profilePatch).length > 0) {
    const { error: profileError } = await client
      .from("profiles")
      .update(profilePatch)
      .eq("id", userId);

    // A failed profile touch-up must not discard a valid store submission.
    if (profileError) {
      console.error(
        "[kirana-connect-api] profile details could not be updated:",
        profileError.message,
      );
    }
  }

  return {
    status: "pending",
    store: created,
    hours: await fetchStoreHours(client, created.id),
  };
}
