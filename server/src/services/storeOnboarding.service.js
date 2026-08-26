import { getServiceClient } from "../config/supabase.js";
import { httpError } from "../utils/httpError.js";
import { generateUniqueSlug } from "../utils/slug.js";
import {
  isMissingChangeRequestTable,
  memoryPendingChangeByStoreId,
  upsertMemoryStoreChange,
} from "./storeChangeRequests.memory.js";
import { fetchBusinessCategoriesForStores, setOwnStoreBusinessCategories } from "./businessCategories.service.js";

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
  latitude, longitude, is_active, is_verified, created_at, updated_at
`;

const CHANGE_REQUEST_FIELDS = `
  id, store_id, owner_id, payload, hours, status, submitted_at, reviewed_at, admin_note
`;

function failed(operation, error) {
  // The database message is kept out of the response: it can leak column and
  // constraint names. It is still logged for the operator.
  console.error(`[kirana-connect-api] ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

function textValue(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function authOwnerDetails(user) {
  return {
    full_name:
      textValue(user?.user_metadata?.full_name) ||
      textValue(user?.user_metadata?.name) ||
      textValue(user?.raw_user_meta_data?.full_name) ||
      textValue(user?.raw_user_meta_data?.name),
    phone:
      textValue(user?.user_metadata?.phone) ||
      textValue(user?.raw_user_meta_data?.phone),
  };
}

async function ownerProfile(client, userId) {
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw failed("load your profile", profileError);

  if (textValue(profile?.full_name) && textValue(profile?.phone)) {
    return profile;
  }

  const { data: authUser, error: authError } = await client.auth.admin.getUserById(userId);
  if (authError) {
    console.error("[kirana-connect-api] owner auth metadata lookup failed:", authError.message);
    return profile ?? null;
  }

  const authOwner = authOwnerDetails(authUser?.user);
  const hydrated = {
    ...(profile ?? {}),
    full_name: textValue(profile?.full_name) || authOwner.full_name || null,
    phone: textValue(profile?.phone) || authOwner.phone || null,
  };

  const patch = {};
  if (!textValue(profile?.full_name) && hydrated.full_name) patch.full_name = hydrated.full_name;
  if (!textValue(profile?.phone) && hydrated.phone) patch.phone = hydrated.phone;

  if (Object.keys(patch).length > 0) {
    const { error } = await client.from("profiles").update(patch).eq("id", userId);
    if (error) {
      console.error("[kirana-connect-api] owner profile hydration failed:", error.message);
    }
  }

  return hydrated;
}

async function updateOwnerProfile(client, userId, owner) {
  const profilePatch = {};
  if (owner.full_name) profilePatch.full_name = owner.full_name;
  if (owner.phone) profilePatch.phone = owner.phone;

  if (Object.keys(profilePatch).length === 0) return;

  const { error } = await client.from("profiles").update(profilePatch).eq("id", userId);
  if (error) throw failed("update owner profile", error);
}

function toStatus(stores) {
  if (stores.length === 0) return "no_application";
  return stores.some((store) => store.is_verified) ? "approved" : "pending";
}

async function pendingChangesByStoreIds(client, storeIds) {
  if (storeIds.length === 0) return new Map();

  const { data, error } = await client
    .from("store_change_requests")
    .select(CHANGE_REQUEST_FIELDS)
    .in("store_id", storeIds)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  if (isMissingChangeRequestTable(error)) {
    return new Map(
      storeIds
        .map((storeId) => [storeId, memoryPendingChangeByStoreId(storeId)])
        .filter(([, change]) => Boolean(change)),
    );
  }
  if (error) throw failed("load pending store changes", error);

  const changes = new Map();
  for (const change of data ?? []) {
    if (!changes.has(change.store_id)) changes.set(change.store_id, change);
  }
  return changes;
}

async function withStoreReviewState(client, stores) {
  const storeIds = (stores ?? []).map((store) => store.id);
  const [hours, pendingChanges, businessCategories] = await Promise.all([
    Promise.all(storeIds.map((id) => fetchStoreHours(client, id))),
    pendingChangesByStoreIds(client, storeIds),
    fetchBusinessCategoriesForStores(client, storeIds),
  ]);

  return (stores ?? []).map((store, index) => ({
    ...store,
    hours: hours[index] ?? [],
    pending_change: pendingChanges.get(store.id) ?? null,
    ...(businessCategories.get(store.id) ?? { primary_business_category: null, business_categories: [] }),
  }));
}

/**
 * Sets the authenticated owner's store business categories. Immediate
 * effect, unlike the change-request flow submitStoreChangeRequest uses for
 * name/address/hours: classification is not a public-trust fact that needs
 * admin review before it takes effect, it is the same kind of owner-direct
 * data as inventory or opening hours.
 */
export async function updateOwnStoreBusinessCategories({ userId, storeId, categoryIds, primaryCategoryId }) {
  return setOwnStoreBusinessCategories({ userId, storeId, categoryIds, primaryCategoryId });
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

  const profile = await ownerProfile(client, userId);

  const storesWithReviewState = await withStoreReviewState(client, stores ?? []);

  return {
    status: toStatus(stores ?? []),
    stores: storesWithReviewState,
    profile,
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

  try {
    await updateOwnerProfile(client, userId, owner);
  } catch (profileError) {
    // A failed profile touch-up must not discard a valid store submission.
    console.error("[kirana-connect-api] profile details could not be updated:", profileError.message);
  }

  return {
    status: "pending",
    store: created,
    hours: await fetchStoreHours(client, created.id),
  };
}

export async function submitStoreChangeRequest({ userId, storeId, store, owner, hours }) {
  const client = getServiceClient();

  const { data: current, error: storeError } = await client
    .from("stores")
    .select("id, owner_id, is_verified")
    .eq("id", storeId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (storeError) throw failed("load your store", storeError);
  if (!current) throw httpError(404, "Store not found.");
  if (!current.is_verified) {
    throw httpError(409, "Your store is already under review.");
  }

  const payload = {
    ...store,
    owner_full_name: owner.full_name,
    owner_phone: owner.phone,
  };

  const { data: existing, error: existingError } = await client
    .from("store_change_requests")
    .select("id")
    .eq("store_id", storeId)
    .eq("status", "pending")
    .maybeSingle();

  if (isMissingChangeRequestTable(existingError)) {
    upsertMemoryStoreChange({
      storeId,
      ownerId: userId,
      payload,
      hours,
    });
    return getOnboardingStatus(userId);
  }
  if (existingError) throw failed("check pending store changes", existingError);

  const body = {
    store_id: storeId,
    owner_id: userId,
    payload,
    hours,
    status: "pending",
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
    admin_note: null,
  };

  const query = existing
    ? client
        .from("store_change_requests")
        .update(body)
        .eq("id", existing.id)
        .select(CHANGE_REQUEST_FIELDS)
        .single()
    : client
        .from("store_change_requests")
        .insert(body)
        .select(CHANGE_REQUEST_FIELDS)
        .single();

  const { error } = await query;
  if (isMissingChangeRequestTable(error)) {
    upsertMemoryStoreChange({
      storeId,
      ownerId: userId,
      payload,
      hours,
    });
    return getOnboardingStatus(userId);
  }
  if (error) throw failed("submit store changes", error);

  return getOnboardingStatus(userId);
}
