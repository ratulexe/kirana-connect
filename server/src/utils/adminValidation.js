import { badRequest } from "./httpError.js";
import { uuidField } from "./validateInventory.js";
import { normalizeProductName } from "./textFormat.js";

const TEXT_LIMITS = {
  name: 120,
  description: 500,
  image_url: 500,
  logo_url: 500,
  barcode: 120,
  unit_label: 60,
};

function requireObject(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw badRequest("A JSON object is required.");
  }
}

function cleanString(value, field, { required = false, max = 120 } = {}) {
  if (value === undefined || value === null) {
    if (required) throw badRequest(`${field} is required.`);
    return undefined;
  }
  if (typeof value !== "string") throw badRequest(`${field} must be text.`);

  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw badRequest(`${field} is required.`);
    return null;
  }
  if (trimmed.length > max) throw badRequest(`${field} must be at most ${max} characters.`);
  return trimmed;
}

function optionalBoolean(value, field) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw badRequest(`${field} must be true or false.`);
  return value;
}

function money(value, field) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`${field} is required.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw badRequest(`${field} must be a number.`);
  if (parsed < 0) throw badRequest(`${field} cannot be negative.`);
  if (parsed > 99999999.99) throw badRequest(`${field} is too large.`);
  return Math.round(parsed * 100) / 100;
}

function optionalNullableUuid(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return uuidField(value, field);
}

function optionalUrl(value, field) {
  const cleaned = cleanString(value, field, { max: TEXT_LIMITS[field] ?? 500 });
  if (cleaned === undefined || cleaned === null) return cleaned;

  try {
    const url = new URL(cleaned);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("bad protocol");
    return cleaned;
  } catch {
    throw badRequest(`${field} must be a valid http or https URL.`);
  }
}

function requireAtLeastOne(patch) {
  if (Object.keys(patch).length === 0) throw badRequest("Nothing to update.");
  return patch;
}

export function validateAdminStorePatch(body) {
  requireObject(body);
  const patch = {};

  const isActive = optionalBoolean(body.is_active, "is_active");
  const isVerified = optionalBoolean(body.is_verified, "is_verified");
  if (isActive !== undefined) patch.is_active = isActive;
  if (isVerified !== undefined) patch.is_verified = isVerified;

  return requireAtLeastOne(patch);
}

export function validateProductCreate(body) {
  requireObject(body);

  return {
    name: normalizeProductName(cleanString(body.name, "name", { required: true, max: TEXT_LIMITS.name })),
    category_id: uuidField(body.category_id, "category"),
    brand_id: optionalNullableUuid(body.brand_id, "brand") ?? null,
    description: cleanString(body.description, "description", {
      max: TEXT_LIMITS.description,
    }),
    image_url: optionalUrl(body.image_url, "image_url"),
    barcode: cleanString(body.barcode, "barcode", { max: TEXT_LIMITS.barcode }),
    unit_label: cleanString(body.unit_label, "unit_label", {
      required: true,
      max: TEXT_LIMITS.unit_label,
    }),
    mrp: money(body.mrp, "MRP"),
    is_active: optionalBoolean(body.is_active, "is_active") ?? true,
  };
}

export function validateProductUpdate(body) {
  requireObject(body);
  const patch = {};

  if (body.name !== undefined) {
    patch.name = normalizeProductName(cleanString(body.name, "name", { required: true, max: TEXT_LIMITS.name }));
  }
  if (body.category_id !== undefined) patch.category_id = uuidField(body.category_id, "category");
  if (body.brand_id !== undefined) patch.brand_id = optionalNullableUuid(body.brand_id, "brand");
  if (body.description !== undefined) {
    patch.description = cleanString(body.description, "description", {
      max: TEXT_LIMITS.description,
    });
  }
  if (body.image_url !== undefined) patch.image_url = optionalUrl(body.image_url, "image_url");
  if (body.barcode !== undefined) {
    patch.barcode = cleanString(body.barcode, "barcode", { max: TEXT_LIMITS.barcode });
  }
  if (body.unit_label !== undefined) {
    patch.unit_label = cleanString(body.unit_label, "unit_label", {
      required: true,
      max: TEXT_LIMITS.unit_label,
    });
  }
  if (body.mrp !== undefined) patch.mrp = money(body.mrp, "MRP");
  const isActive = optionalBoolean(body.is_active, "is_active");
  if (isActive !== undefined) patch.is_active = isActive;

  return requireAtLeastOne(patch);
}

export function validateCategoryCreate(body) {
  requireObject(body);
  return {
    name: cleanString(body.name, "name", { required: true, max: TEXT_LIMITS.name }),
    description: cleanString(body.description, "description", {
      max: TEXT_LIMITS.description,
    }),
    image_url: optionalUrl(body.image_url, "image_url"),
    is_active: optionalBoolean(body.is_active, "is_active") ?? true,
  };
}

export function validateCategoryUpdate(body) {
  requireObject(body);
  const patch = {};
  if (body.name !== undefined) {
    patch.name = cleanString(body.name, "name", { required: true, max: TEXT_LIMITS.name });
  }
  if (body.description !== undefined) {
    patch.description = cleanString(body.description, "description", {
      max: TEXT_LIMITS.description,
    });
  }
  if (body.image_url !== undefined) patch.image_url = optionalUrl(body.image_url, "image_url");
  const isActive = optionalBoolean(body.is_active, "is_active");
  if (isActive !== undefined) patch.is_active = isActive;
  return requireAtLeastOne(patch);
}

export function validateBrandCreate(body) {
  requireObject(body);
  return {
    name: cleanString(body.name, "name", { required: true, max: TEXT_LIMITS.name }),
    logo_url: optionalUrl(body.logo_url, "logo_url"),
  };
}

export function validateBrandUpdate(body) {
  requireObject(body);
  const patch = {};
  if (body.name !== undefined) {
    patch.name = cleanString(body.name, "name", { required: true, max: TEXT_LIMITS.name });
  }
  if (body.logo_url !== undefined) patch.logo_url = optionalUrl(body.logo_url, "logo_url");
  return requireAtLeastOne(patch);
}
