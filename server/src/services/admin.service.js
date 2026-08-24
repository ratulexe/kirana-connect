import { randomUUID } from "node:crypto";
import { getServiceClient } from "../config/supabase.js";
import { httpError, notFoundError } from "../utils/httpError.js";
import { escapeLikePattern } from "../utils/queryParams.js";
import { generateUniqueSlug } from "../utils/slug.js";
import {
  isMissingChangeRequestTable,
  markMemoryStoreChangeReviewed,
  memoryPendingChangeById,
  memoryPendingChangeByStoreId,
  memoryPendingChangeCount,
  memoryPendingChanges,
} from "./storeChangeRequests.memory.js";

const STORE_FIELDS = `
  id, owner_id, name, slug, description, phone,
  address_line_1, address_line_2, locality, city, state, postal_code,
  latitude, longitude, is_active, is_verified, created_at, updated_at
`;

const HOURS_FIELDS = "day_of_week, opens_at, closes_at, is_closed";

const CHANGE_REQUEST_FIELDS = `
  id, store_id, owner_id, payload, hours, status, submitted_at,
  reviewed_at, reviewed_by, admin_note
`;

const PRODUCT_FIELDS = `
  id, category_id, brand_id, name, slug, description, image_url, barcode,
  unit_label, mrp, is_active, created_at, updated_at,
  category:categories (id, name, slug),
  brand:brands (id, name, slug, logo_url)
`;

const CATEGORY_FIELDS = "id, name, slug, description, image_url, is_active, created_at, updated_at";
const BRAND_FIELDS = "id, name, slug, logo_url, created_at, updated_at";
const PRODUCT_IMAGE_BUCKET = "product-images";
const PRODUCT_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

function failed(operation, error) {
  console.error(`[kirana-connect-api] admin ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

function textValue(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

async function countRows(table, apply = (query) => query) {
  const query = apply(getServiceClient().from(table).select("id", { count: "exact", head: true }));
  const { error, count } = await query;
  if (error) throw failed(`count ${table}`, error);
  return count ?? 0;
}

async function countOptionalRows(table, apply = (query) => query) {
  const query = apply(getServiceClient().from(table).select("id", { count: "exact", head: true }));
  const { error, count } = await query;
  if (isMissingChangeRequestTable(error)) return memoryPendingChangeCount();
  if (error) throw failed(`count ${table}`, error);
  return count ?? 0;
}

function authFullName(user) {
  return (
    textValue(user?.user_metadata?.full_name) ||
    textValue(user?.user_metadata?.name) ||
    textValue(user?.raw_user_meta_data?.full_name) ||
    textValue(user?.raw_user_meta_data?.name) ||
    null
  );
}

async function authUserSummary(userId) {
  if (!userId) return null;
  const { data, error } = await getServiceClient().auth.admin.getUserById(userId);
  if (error) {
    console.error("[kirana-connect-api] admin auth user lookup failed:", error.message);
    return null;
  }
  return {
    email: data?.user?.email ?? null,
    full_name: authFullName(data?.user),
  };
}

async function authUserMap(userIds) {
  const entries = await Promise.all(
    [...new Set(userIds.filter(Boolean))].map(async (id) => [id, await authUserSummary(id)]),
  );
  return new Map(entries);
}

async function profilesById(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await getServiceClient()
    .from("profiles")
    .select("id, role, full_name, phone, created_at, updated_at")
    .in("id", ids);

  if (error) throw failed("load owner profiles", error);
  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

async function withOwners(stores) {
  const [profiles, authUsers] = await Promise.all([
    profilesById(stores.map((store) => store.owner_id)),
    authUserMap(stores.map((store) => store.owner_id)),
  ]);

  return stores.map((store) => {
    const profile = profiles.get(store.owner_id) ?? {};
    const authUser = authUsers.get(store.owner_id);

    return {
      ...store,
      owner: {
        ...profile,
        full_name: textValue(profile.full_name) || authUser?.full_name || null,
      },
      owner_email: authUser?.email ?? null,
    };
  });
}

async function hoursByStoreIds(storeIds) {
  if (storeIds.length === 0) return new Map();
  const { data, error } = await getServiceClient()
    .from("store_hours")
    .select(`store_id, ${HOURS_FIELDS}`)
    .in("store_id", storeIds)
    .order("day_of_week", { ascending: true });

  if (error) throw failed("load store hours", error);

  const grouped = new Map();
  for (const row of data ?? []) {
    const list = grouped.get(row.store_id) ?? [];
    list.push({
      day_of_week: row.day_of_week,
      opens_at: row.opens_at,
      closes_at: row.closes_at,
      is_closed: row.is_closed,
    });
    grouped.set(row.store_id, list);
  }
  return grouped;
}

async function withHours(stores) {
  const hours = await hoursByStoreIds(stores.map((store) => store.id));
  return stores.map((store) => ({ ...store, hours: hours.get(store.id) ?? [] }));
}

async function pendingChangeByStoreId(storeId) {
  const { data, error } = await getServiceClient()
    .from("store_change_requests")
    .select(CHANGE_REQUEST_FIELDS)
    .eq("store_id", storeId)
    .eq("status", "pending")
    .maybeSingle();

  if (isMissingChangeRequestTable(error)) return memoryPendingChangeByStoreId(storeId);
  if (error) throw failed("load pending store change", error);
  return data ?? null;
}

async function storeWithDetails(store) {
  const [owned] = await withOwners([store]);
  const [detailed] = await withHours([owned]);
  return {
    ...detailed,
    pending_change: await pendingChangeByStoreId(store.id),
  };
}

function storePatchFromPayload(payload) {
  const { owner_full_name: _ownerFullName, owner_phone: _ownerPhone, ...storePatch } = payload ?? {};
  return storePatch;
}

function ownerPatchFromPayload(payload) {
  const patch = {};
  const fullName = textValue(payload?.owner_full_name);
  const phone = textValue(payload?.owner_phone);

  if (fullName) patch.full_name = fullName;
  if (phone) patch.phone = phone;
  return patch;
}

async function slugFor(table, name, currentId) {
  const isTaken = async (candidate) => {
    let query = getServiceClient().from(table).select("id").eq("slug", candidate).limit(1);
    if (currentId) query = query.neq("id", currentId);
    const { data, error } = await query;
    if (error) throw failed(`check ${table} slug`, error);
    return Boolean(data?.length);
  };
  return generateUniqueSlug(name, isTaken);
}

export async function getAdminProfile(user) {
  const profile = await profilesById([user.id]);
  return {
    user: { id: user.id, email: user.email },
    profile: profile.get(user.id) ?? null,
  };
}

export async function dashboardMetrics() {
  const [
    pendingStores,
    pendingStoreChanges,
    verifiedStores,
    activeStores,
    sellers,
    products,
    inventoryLines,
  ] = await Promise.all([
    countRows("stores", (query) => query.eq("is_verified", false)),
    countOptionalRows("store_change_requests", (query) => query.eq("status", "pending")),
    countRows("stores", (query) => query.eq("is_verified", true)),
    countRows("stores", (query) => query.eq("is_active", true)),
    countRows("profiles", (query) => query.eq("role", "seller")),
    countRows("products"),
    countRows("store_products"),
  ]);

  const latestPending = await listPendingStores({ limit: 5, offset: 0 });

  return {
    metrics: {
      pendingStores: pendingStores + pendingStoreChanges,
      verifiedStores,
      activeStores,
      sellers,
      products,
      inventoryLines,
    },
    latest_pending_stores: latestPending.stores,
  };
}

export async function listPendingStores({ limit, offset }) {
  const { data, error, count } = await getServiceClient()
    .from("stores")
    .select(STORE_FIELDS, { count: "exact" })
    .eq("is_verified", false)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw failed("load pending stores", error);
  const stores = await withHours(await withOwners(data ?? []));
  return { stores, total: count ?? 0 };
}

export async function listPendingStoreChanges({ limit, offset }) {
  const { data, error, count } = await getServiceClient()
    .from("store_change_requests")
    .select(CHANGE_REQUEST_FIELDS, { count: "exact" })
    .eq("status", "pending")
    .order("submitted_at", { ascending: true })
    .range(offset, offset + limit - 1);

  const isMemory = isMissingChangeRequestTable(error);
  const changes = isMemory ? memoryPendingChanges({ limit, offset }) : (data ?? []);
  const total = isMemory ? memoryPendingChangeCount() : (count ?? 0);
  if (isMemory) {
    return {
      changes: await withStoresForChanges(changes),
      total,
    };
  }
  if (error) throw failed("load pending store changes", error);

  return {
    changes: await withStoresForChanges(changes),
    total,
  };
}

async function withStoresForChanges(changes) {
  const storeIds = changes.map((change) => change.store_id);
  const { data: stores, error: storesError } = storeIds.length
    ? await getServiceClient()
        .from("stores")
        .select(STORE_FIELDS)
        .in("id", storeIds)
    : { data: [], error: null };

  if (storesError) throw failed("load stores for pending changes", storesError);

  const storesById = new Map(
    (await withOwners(stores ?? [])).map((store) => [store.id, store]),
  );

  return changes.map((change) => ({
    ...change,
    store: storesById.get(change.store_id) ?? null,
  }));
}

function applyStoreFilters(query, { search, verified, active }) {
  if (search) query = query.ilike("name", `%${escapeLikePattern(search)}%`);
  if (verified !== null) query = query.eq("is_verified", verified);
  if (active !== null) query = query.eq("is_active", active);
  return query;
}

export async function listStores({ search, verified, active, limit, offset }) {
  const query = applyStoreFilters(
    getServiceClient().from("stores").select(STORE_FIELDS, { count: "exact" }),
    { search, verified, active },
  );

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw failed("load stores", error);
  return { stores: await withOwners(data ?? []), total: count ?? 0 };
}

export async function getStoreDetail(storeId) {
  const { data, error } = await getServiceClient()
    .from("stores")
    .select(STORE_FIELDS)
    .eq("id", storeId)
    .maybeSingle();

  if (error) throw failed("load store", error);
  if (!data) throw notFoundError("Store not found.");
  return storeWithDetails(data);
}

export async function approveStore(storeId) {
  const client = getServiceClient();
  const { data: store, error: readError } = await client
    .from("stores")
    .select("id, owner_id, is_verified")
    .eq("id", storeId)
    .maybeSingle();

  if (readError) throw failed("load store for approval", readError);
  if (!store) throw notFoundError("Store not found.");

  const wasVerified = store.is_verified;

  const { error: storeError } = await client
    .from("stores")
    .update({ is_verified: true })
    .eq("id", store.id);

  if (storeError) throw failed("approve store", storeError);

  const { error: profileError } = await client
    .from("profiles")
    .update({ role: "seller" })
    .eq("id", store.owner_id);

  if (profileError) {
    if (!wasVerified) {
      await client.from("stores").update({ is_verified: false }).eq("id", store.id);
    }
    throw failed("promote store owner", profileError);
  }

  return getStoreDetail(store.id);
}

export async function rejectStore(storeId) {
  const client = getServiceClient();
  const { data: store, error: readError } = await client
    .from("stores")
    .select("id, name, is_verified")
    .eq("id", storeId)
    .maybeSingle();

  if (readError) throw failed("load store for rejection", readError);
  if (!store) throw notFoundError("Store not found.");
  if (store.is_verified) {
    throw httpError(409, "Verified stores cannot be rejected. Unverify or deactivate them instead.");
  }

  const { error } = await client.from("stores").delete().eq("id", store.id).eq("is_verified", false);
  if (error) throw failed("reject store application", error);

  return { id: store.id, name: store.name, rejected: true };
}

export async function approveStoreChange(changeId, adminId) {
  const client = getServiceClient();
  const { data: change, error: readError } = await client
    .from("store_change_requests")
    .select(CHANGE_REQUEST_FIELDS)
    .eq("id", changeId)
    .eq("status", "pending")
    .maybeSingle();

  const isMemory = isMissingChangeRequestTable(readError);
  const pendingChange = isMemory ? memoryPendingChangeById(changeId) : change;

  if (readError && !isMemory) throw failed("load store change for approval", readError);
  if (!pendingChange) throw notFoundError("Store change request not found.");

  const { data: current, error: storeReadError } = await client
    .from("stores")
    .select("id, name, owner_id")
    .eq("id", pendingChange.store_id)
    .maybeSingle();

  if (storeReadError) throw failed("load store for change approval", storeReadError);
  if (!current) throw notFoundError("Store not found.");

  const patch = storePatchFromPayload(pendingChange.payload);
  if (patch.name && patch.name !== current.name) {
    patch.slug = await slugFor("stores", patch.name, current.id);
  }

  const { error: storeError } = await client
    .from("stores")
    .update(patch)
    .eq("id", current.id);

  if (storeError) throw failed("apply store changes", storeError);

  const { error: deleteHoursError } = await client
    .from("store_hours")
    .delete()
    .eq("store_id", current.id);

  if (deleteHoursError) throw failed("replace store hours", deleteHoursError);

  if ((pendingChange.hours ?? []).length > 0) {
    const { error: insertHoursError } = await client
      .from("store_hours")
      .insert(pendingChange.hours.map((hour) => ({ ...hour, store_id: current.id })));

    if (insertHoursError) throw failed("save store hours", insertHoursError);
  }

  const ownerPatch = ownerPatchFromPayload(pendingChange.payload);
  if (Object.keys(ownerPatch).length > 0) {
    const { error: ownerError } = await client
      .from("profiles")
      .update(ownerPatch)
      .eq("id", current.owner_id);

    if (ownerError) throw failed("apply owner changes", ownerError);
  }

  if (isMemory) {
    markMemoryStoreChangeReviewed(changeId, { status: "approved", adminId });
    return getStoreDetail(current.id);
  }

  const { error: reviewError } = await client
    .from("store_change_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq("id", pendingChange.id);

  if (reviewError) throw failed("mark store change approved", reviewError);

  return getStoreDetail(current.id);
}

export async function rejectStoreChange(changeId, adminId) {
  const { data, error } = await getServiceClient()
    .from("store_change_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq("id", changeId)
    .eq("status", "pending")
    .select(CHANGE_REQUEST_FIELDS)
    .maybeSingle();

  if (isMissingChangeRequestTable(error)) {
    const rejected = markMemoryStoreChangeReviewed(changeId, { status: "rejected", adminId });
    if (!rejected) throw notFoundError("Store change request not found.");
    return rejected;
  }

  if (error) throw failed("reject store change", error);
  if (!data) throw notFoundError("Store change request not found.");

  return data;
}

export async function updateStoreState(storeId, patch) {
  const { data, error } = await getServiceClient()
    .from("stores")
    .update(patch)
    .eq("id", storeId)
    .select(STORE_FIELDS)
    .maybeSingle();

  if (error) throw failed("update store", error);
  if (!data) throw notFoundError("Store not found.");
  return storeWithDetails(data);
}

export async function listSellers() {
  const { data: profiles, error } = await getServiceClient()
    .from("profiles")
    .select("id, role, full_name, phone, created_at, updated_at")
    .eq("role", "seller")
    .order("updated_at", { ascending: false });

  if (error) throw failed("load sellers", error);

  const ids = (profiles ?? []).map((profile) => profile.id);
  const [authUsers, storesResult] = await Promise.all([
    authUserMap(ids),
    ids.length
      ? getServiceClient()
          .from("stores")
          .select("id, owner_id, name, slug, is_active, is_verified")
          .in("owner_id", ids)
      : { data: [], error: null },
  ]);

  if (storesResult.error) throw failed("load seller stores", storesResult.error);

  const storesByOwner = new Map();
  for (const store of storesResult.data ?? []) {
    const list = storesByOwner.get(store.owner_id) ?? [];
    list.push(store);
    storesByOwner.set(store.owner_id, list);
  }

  return (profiles ?? []).map((profile) => ({
    ...profile,
    full_name: textValue(profile.full_name) || authUsers.get(profile.id)?.full_name || null,
    email: authUsers.get(profile.id)?.email ?? null,
    stores: storesByOwner.get(profile.id) ?? [],
  }));
}

function applyProductFilters(query, { search, categoryId, brandId, active }) {
  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`;
    query = query.or(`name.ilike.${pattern},barcode.ilike.${pattern}`);
  }
  if (categoryId) query = query.eq("category_id", categoryId);
  if (brandId) query = query.eq("brand_id", brandId);
  if (active !== null) query = query.eq("is_active", active);
  return query;
}

export async function listAdminProducts({ search, categoryId, brandId, active, limit, offset }) {
  const query = applyProductFilters(
    getServiceClient().from("products").select(PRODUCT_FIELDS, { count: "exact" }),
    { search, categoryId, brandId, active },
  );

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw failed("load products", error);
  return { products: data ?? [], total: count ?? 0 };
}

export async function getAdminProduct(productId) {
  const { data, error } = await getServiceClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("id", productId)
    .maybeSingle();

  if (error) throw failed("load product", error);
  if (!data) throw notFoundError("Product not found.");

  const media = await listProductMedia(productId);
  return { ...data, media };
}

export async function createProduct(payload) {
  const body = { ...payload, slug: await slugFor("products", payload.name) };
  const { data, error } = await getServiceClient()
    .from("products")
    .insert(body)
    .select(PRODUCT_FIELDS)
    .single();

  if (error?.code === "23505") throw httpError(409, "A product with that barcode or slug already exists.");
  if (error) throw failed("create product", error);
  return data;
}

export async function updateProduct(productId, patch) {
  const body = { ...patch };
  if (body.name) {
    const { slugify } = await import("../utils/slug.js");
    const { data: existing } = await getServiceClient().from("products").select("name, slug").eq("id", productId).single();
    
    if (existing && slugify(existing.name) !== slugify(body.name)) {
      body.slug = await slugFor("products", body.name, productId);
    }
  }

  const { data, error } = await getServiceClient()
    .from("products")
    .update(body)
    .eq("id", productId)
    .select(PRODUCT_FIELDS)
    .maybeSingle();

  if (error?.code === "23505") throw httpError(409, "A product with that barcode or slug already exists.");
  if (error) throw failed("update product", error);
  if (!data) throw notFoundError("Product not found.");
  return data;
}

export async function deleteProduct(productId) {
  const client = getServiceClient();

  // Check store inventory references
  const { count: inventoryCount, error: countError } = await client
    .from("store_products")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (countError) throw failed("check product inventory", countError);
  
  if (inventoryCount && inventoryCount > 0) {
    throw httpError(409, "This product is used by one or more stores. Deactivate it instead.");
  }

  // Safe to hard delete
  const { error } = await client
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw failed("delete product", error);
  return { id: productId, deleted: true };
}

async function ensureProductImageBucket(client) {
  const { data, error } = await client.storage.getBucket(PRODUCT_IMAGE_BUCKET);
  if (!error && data) return;

  const { error: createError } = await client.storage.createBucket(PRODUCT_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: PRODUCT_IMAGE_MAX_BYTES,
    allowedMimeTypes: [...PRODUCT_IMAGE_TYPES.keys()],
  });

  if (createError && !String(createError.message).toLowerCase().includes("already exists")) {
    throw failed("prepare product image storage", createError);
  }
}

export async function uploadProductImage({ buffer, mimeType }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw httpError(400, "Choose an image to upload.");
  }
  if (buffer.length > PRODUCT_IMAGE_MAX_BYTES) {
    throw httpError(413, "Product images must be 2 MB or smaller.");
  }

  const extension = PRODUCT_IMAGE_TYPES.get(mimeType);
  if (!extension) {
    throw httpError(415, "Upload a JPG, PNG, or WebP image.");
  }

  const client = getServiceClient();
  await ensureProductImageBucket(client);

  const path = `products/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { error } = await client.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw failed("upload product image", error);

  const { data } = client.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return { bucket: PRODUCT_IMAGE_BUCKET, path, public_url: data.publicUrl };
}

export async function listAdminCategories() {
  const { data, error } = await getServiceClient()
    .from("categories")
    .select(CATEGORY_FIELDS)
    .order("name", { ascending: true });

  if (error) throw failed("load categories", error);
  return data ?? [];
}

export async function createCategory(payload) {
  const body = { ...payload, slug: await slugFor("categories", payload.name) };
  const { data, error } = await getServiceClient()
    .from("categories")
    .insert(body)
    .select(CATEGORY_FIELDS)
    .single();

  if (error?.code === "23505") throw httpError(409, "A category with that name already exists.");
  if (error) throw failed("create category", error);
  return data;
}

export async function updateCategory(categoryId, patch) {
  const body = { ...patch };
  if (body.name) body.slug = await slugFor("categories", body.name, categoryId);

  const { data, error } = await getServiceClient()
    .from("categories")
    .update(body)
    .eq("id", categoryId)
    .select(CATEGORY_FIELDS)
    .maybeSingle();

  if (error?.code === "23505") throw httpError(409, "A category with that name already exists.");
  if (error) throw failed("update category", error);
  if (!data) throw notFoundError("Category not found.");
  return data;
}

export async function listAdminBrands() {
  const { data, error } = await getServiceClient()
    .from("brands")
    .select(BRAND_FIELDS)
    .order("name", { ascending: true });

  if (error) throw failed("load brands", error);
  return data ?? [];
}

export async function createBrand(payload) {
  const body = { ...payload, slug: await slugFor("brands", payload.name) };
  const { data, error } = await getServiceClient()
    .from("brands")
    .insert(body)
    .select(BRAND_FIELDS)
    .single();

  if (error?.code === "23505") throw httpError(409, "A brand with that name already exists.");
  if (error) throw failed("create brand", error);
  return data;
}

export async function updateBrand(brandId, patch) {
  const body = { ...patch };
  if (body.name) body.slug = await slugFor("brands", body.name, brandId);

  const { data, error } = await getServiceClient()
    .from("brands")
    .update(body)
    .eq("id", brandId)
    .select(BRAND_FIELDS)
    .maybeSingle();

  if (error?.code === "23505") throw httpError(409, "A brand with that name already exists.");
  if (error) throw failed("update brand", error);
  if (!data) throw notFoundError("Brand not found.");
  return data;
}

const MEDIA_FIELDS = `id, product_id, media_type, image_url, storage_path, alt_text, sort_order, is_primary, created_at, updated_at`;

export async function listProductMedia(productId) {
  const { data, error } = await getServiceClient()
    .from("product_media")
    .select(MEDIA_FIELDS)
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw failed("load product media", error);
  return data ?? [];
}

export async function createProductMedia(productId, { mediaType, imageUrl, storagePath, altText, sortOrder, isPrimary }) {
  const client = getServiceClient();

  // Verify product exists
  const { data: product, error: productError } = await client
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (productError) throw failed("verify product for media", productError);
  if (!product) throw notFoundError("Product not found.");

  // If setting as primary, unset any existing primary
  if (isPrimary) {
    await client
      .from("product_media")
      .update({ is_primary: false })
      .eq("product_id", productId)
      .eq("is_primary", true);
  }

  const { data, error } = await client
    .from("product_media")
    .insert({
      product_id: productId,
      media_type: mediaType,
      image_url: imageUrl,
      storage_path: storagePath ?? null,
      alt_text: altText ?? null,
      sort_order: sortOrder ?? 0,
      is_primary: isPrimary ?? false,
    })
    .select(MEDIA_FIELDS)
    .single();

  if (error) throw failed("create product media", error);
  return data;
}

export async function updateProductMedia(mediaId, patch) {
  const client = getServiceClient();

  // If setting as primary, unset existing primary for the same product
  if (patch.is_primary) {
    const { data: existing } = await client
      .from("product_media")
      .select("product_id")
      .eq("id", mediaId)
      .maybeSingle();

    if (existing) {
      await client
        .from("product_media")
        .update({ is_primary: false })
        .eq("product_id", existing.product_id)
        .eq("is_primary", true);
    }
  }

  const { data, error } = await client
    .from("product_media")
    .update(patch)
    .eq("id", mediaId)
    .select(MEDIA_FIELDS)
    .maybeSingle();

  if (error) throw failed("update product media", error);
  if (!data) throw notFoundError("Media not found.");
  return data;
}

export async function deleteProductMedia(mediaId) {
  const client = getServiceClient();

  // Fetch the media row to get storage_path for cleanup
  const { data: media, error: readError } = await client
    .from("product_media")
    .select("id, storage_path")
    .eq("id", mediaId)
    .maybeSingle();

  if (readError) throw failed("load media for deletion", readError);
  if (!media) throw notFoundError("Media not found.");

  // Delete storage file if it exists
  if (media.storage_path) {
    const { error: storageError } = await client.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove([media.storage_path]);

    if (storageError) {
      console.error("[kirana-connect-api] storage cleanup failed:", storageError.message);
    }
  }

  const { error } = await client
    .from("product_media")
    .delete()
    .eq("id", media.id);

  if (error) throw failed("delete product media", error);
  return { id: media.id, deleted: true };
}
