import { badRequest } from "./httpError.js";
import { uuidField } from "./validateInventory.js";
import { allowedUnitCodes, formatUnitLabel, normalizeUnitCode } from "./productUnits.js";

const TEXT_LIMITS = {
  name: 120,
  description: 500,
  image_url: 500,
  logo_url: 500,
  barcode: 120,
  unit_label: 60,
  unit_code: 24,
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

function positiveQuantity(value, field = "Quantity") {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`${field} is required.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw badRequest(`${field} must be a number.`);
  if (parsed <= 0) throw badRequest(`${field} must be greater than zero.`);
  if (parsed > 99999999.999) throw badRequest(`${field} is too large.`);
  return Math.round(parsed * 1000) / 1000;
}

function unitCode(value) {
  const code = normalizeUnitCode(cleanString(value, "unit", { required: true, max: TEXT_LIMITS.unit_code }));
  if (!allowedUnitCodes().includes(code)) {
    throw badRequest(`Unit must be one of: ${allowedUnitCodes().join(", ")}.`);
  }
  return code;
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

function validateVariant(value, index, { existing = false } = {}) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw badRequest(`Variant ${index + 1} must be an object.`);
  }
  const quantity = positiveQuantity(value.quantity, `Variant ${index + 1} quantity`);
  const code = unitCode(value.unit_code);
  const variant = {
    quantity,
    unit_code: code,
    unit_label: formatUnitLabel(quantity, code),
    mrp: money(value.mrp, `Variant ${index + 1} MRP`),
    barcode: cleanString(value.barcode, `Variant ${index + 1} barcode`, { max: TEXT_LIMITS.barcode }),
    image_url: optionalUrl(value.image_url, "image_url"),
    is_active: optionalBoolean(value.is_active, `Variant ${index + 1} active`) ?? true,
  };

  if (existing && value.id !== undefined && value.id !== null && value.id !== "") {
    variant.id = uuidField(value.id, `Variant ${index + 1}`);
  }
  return variant;
}

function validateVariants(value, { existing = false } = {}) {
  if (!Array.isArray(value) || value.length === 0) {
    throw badRequest("At least one product variant is required.");
  }
  if (value.length > 24) throw badRequest("A product can have at most 24 variants.");

  const variants = value.map((variant, index) => validateVariant(variant, index, { existing }));
  const seen = new Set();
  const barcodes = new Set();
  for (const variant of variants) {
    const key = `${variant.quantity}:${variant.unit_code}`;
    if (seen.has(key)) throw badRequest(`${variant.unit_label} is already listed for this product.`);
    seen.add(key);

    const barcode = variant.barcode?.toLowerCase();
    if (barcode) {
      if (barcodes.has(barcode)) throw badRequest(`Barcode ${variant.barcode} is used by more than one variant.`);
      barcodes.add(barcode);
    }
  }
  return variants;
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
    name: cleanString(body.name, "name", { required: true, max: TEXT_LIMITS.name }),
    category_id: uuidField(body.category_id, "category"),
    brand_id: optionalNullableUuid(body.brand_id, "brand") ?? null,
    description: cleanString(body.description, "description", {
      max: TEXT_LIMITS.description,
    }),
    image_url: optionalUrl(body.image_url, "image_url"),
    variants: validateVariants(body.variants),
    is_active: optionalBoolean(body.is_active, "is_active") ?? true,
  };
}

export function validateProductUpdate(body) {
  requireObject(body);
  const patch = {};

  if (body.name !== undefined) {
    patch.name = cleanString(body.name, "name", { required: true, max: TEXT_LIMITS.name });
  }
  if (body.category_id !== undefined) patch.category_id = uuidField(body.category_id, "category");
  if (body.brand_id !== undefined) patch.brand_id = optionalNullableUuid(body.brand_id, "brand");
  if (body.description !== undefined) {
    patch.description = cleanString(body.description, "description", {
      max: TEXT_LIMITS.description,
    });
  }
  if (body.image_url !== undefined) patch.image_url = optionalUrl(body.image_url, "image_url");
  if (body.variants !== undefined) patch.variants = validateVariants(body.variants, { existing: true });
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
