import { getServiceClient } from "../config/supabase.js";
import { httpError, notFoundError } from "../utils/httpError.js";
import { escapeLikePattern } from "../utils/queryParams.js";
import { generateUniqueSlug } from "../utils/slug.js";

const STORE_FIELDS = `
  id, owner_id, name, slug, description, phone,
  address_line_1, address_line_2, locality, city, state, postal_code,
  latitude, longitude, is_active, is_verified, created_at, updated_at
`;

const HOURS_FIELDS = "day_of_week, opens_at, closes_at, is_closed";

const PRODUCT_FIELDS = `
  id, category_id, brand_id, name, slug, description, image_url, barcode,
  unit_label, mrp, is_active, created_at, updated_at,
  category:categories (id, name, slug),
  brand:brands (id, name, slug, logo_url)
`;

const CATEGORY_FIELDS = "id, name, slug, description, image_url, is_active, created_at, updated_at";
const BRAND_FIELDS = "id, name, slug, logo_url, created_at, updated_at";

function failed(operation, error) {
  console.error(`[kirana-connect-api] admin ${operation} failed:`, error.message);
  return httpError(502, `Could not ${operation}. Please try again.`);
}

async function countRows(table, apply = (query) => query) {
  const query = apply(getServiceClient().from(table).select("id", { count: "exact", head: true }));
  const { error, count } = await query;
  if (error) throw failed(`count ${table}`, error);
  return count ?? 0;
}

async function authEmail(userId) {
  if (!userId) return null;
  const { data, error } = await getServiceClient().auth.admin.getUserById(userId);
  if (error) {
    console.error("[kirana-connect-api] admin auth user lookup failed:", error.message);
    return null;
  }
  return data?.user?.email ?? null;
}

async function authEmailMap(userIds) {
  const entries = await Promise.all(
    [...new Set(userIds.filter(Boolean))].map(async (id) => [id, await authEmail(id)]),
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
  const [profiles, emails] = await Promise.all([
    profilesById(stores.map((store) => store.owner_id)),
    authEmailMap(stores.map((store) => store.owner_id)),
  ]);

  return stores.map((store) => ({
    ...store,
    owner: profiles.get(store.owner_id) ?? null,
    owner_email: emails.get(store.owner_id) ?? null,
  }));
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

async function storeWithDetails(store) {
  const [owned] = await withOwners([store]);
  const [detailed] = await withHours([owned]);
  return detailed;
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
    verifiedStores,
    activeStores,
    sellers,
    products,
    inventoryLines,
  ] = await Promise.all([
    countRows("stores", (query) => query.eq("is_verified", false)),
    countRows("stores", (query) => query.eq("is_verified", true)),
    countRows("stores", (query) => query.eq("is_active", true)),
    countRows("profiles", (query) => query.eq("role", "seller")),
    countRows("products"),
    countRows("store_products"),
  ]);

  const latestPending = await listPendingStores({ limit: 5, offset: 0 });

  return {
    metrics: { pendingStores, verifiedStores, activeStores, sellers, products, inventoryLines },
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
  const [emails, storesResult] = await Promise.all([
    authEmailMap(ids),
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
    email: emails.get(profile.id) ?? null,
    stores: storesByOwner.get(profile.id) ?? [],
  }));
}

function applyProductFilters(query, { search, categoryId, brandId, active }) {
  if (search) query = query.ilike("name", `%${escapeLikePattern(search)}%`);
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
  return data;
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
  if (body.name) body.slug = await slugFor("products", body.name, productId);

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
