import { badRequest } from "./httpError.js";

/**
 * Validation for store inventory writes.
 *
 * Mirrors the CHECK constraints on store_products so a bad payload fails here
 * with a readable message rather than as a raw constraint error. As with
 * onboarding, the browser validates the same rules for UX only; this is the
 * one that counts.
 */

const STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuidField(value, field, { required = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest(`${field} is required.`);
    return null;
  }
  if (typeof value !== "string" || !UUID.test(value)) {
    throw badRequest(`${field} must be a valid id.`);
  }
  return value;
}

function money(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw badRequest(`${field} must be a number.`);
  if (parsed < 0) throw badRequest(`${field} cannot be negative.`);
  if (parsed > 99999999.99) throw badRequest(`${field} is too large.`);
  // numeric(10,2): round rather than let the database reject the write.
  return Math.round(parsed * 100) / 100;
}

function stockStatus(value) {
  if (!STOCK_STATUSES.includes(value)) {
    throw badRequest(`Stock status must be one of: ${STOCK_STATUSES.join(", ")}.`);
  }
  return value;
}

function quantity(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw badRequest("Quantity must be a whole number.");
  if (parsed < 0) throw badRequest("Quantity cannot be negative.");
  if (parsed > 1000000) throw badRequest("Quantity is too large.");
  return parsed;
}

function discount(value) {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw badRequest("Discount must be a number.");
  if (parsed < 0 || parsed > 100) throw badRequest("Discount must be between 0 and 100.");
  return Math.round(parsed * 100) / 100;
}

/**
 * Expiry/best-before date. Optional; when present must be a real calendar
 * date in YYYY-MM-DD form. Past dates are allowed on purpose -- a seller may
 * be recording stock that has already expired -- the frontend only warns.
 */
function expiryDate(value) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw badRequest("Expiry date must be a valid date (YYYY-MM-DD).");
  }
  const [year, month, day] = value.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw badRequest("Expiry date must be a valid calendar date.");
  }
  return value;
}

/**
 * store_products_availability_coherent forbids an out-of-stock line that still
 * claims to be available. Rather than bounce the seller for a contradiction
 * they did not really intend, sold out simply implies not listed.
 */
function coherentAvailability(status, requested) {
  if (status === "out_of_stock") return false;
  return requested === undefined ? true : Boolean(requested);
}

/** Full payload for adding a product to a store. */
export function validateInventoryCreate(body) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("An inventory payload is required.");
  }

  const status = stockStatus(body.stock_status ?? "in_stock");

  return {
    product_variant_id: uuidField(body.product_variant_id ?? body.variant_id, "Product size"),
    selling_price: money(body.selling_price, "Selling price"),
    stock_status: status,
    quantity_available: quantity(body.quantity_available),
    discount_percentage: discount(body.discount_percentage),
    is_available: coherentAvailability(status, body.is_available),
    expiry_date: body.expiry_date === undefined ? null : expiryDate(body.expiry_date),
  };
}

/**
 * Partial update. store_id and product_id are deliberately not accepted: moving
 * a line to another store or repointing it at another product is not an edit,
 * and allowing it would be a way around the ownership check.
 */
export function validateInventoryUpdate(body, current) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("An update payload is required.");
  }

  const patch = {};

  if (body.selling_price !== undefined) {
    patch.selling_price = money(body.selling_price, "Selling price");
  }
  if (body.quantity_available !== undefined) {
    patch.quantity_available = quantity(body.quantity_available);
  }
  if (body.discount_percentage !== undefined) {
    patch.discount_percentage = discount(body.discount_percentage);
  }
  if (body.expiry_date !== undefined) {
    patch.expiry_date = expiryDate(body.expiry_date);
  }

  const statusProvided = body.stock_status !== undefined;
  const status = statusProvided ? stockStatus(body.stock_status) : current.stock_status;
  if (statusProvided) patch.stock_status = status;

  if (body.is_available !== undefined) {
    // An explicit choice always wins, subject to the sold-out rule.
    patch.is_available = coherentAvailability(status, body.is_available);
  } else if (statusProvided) {
    if (status === "out_of_stock") {
      patch.is_available = false;
    } else if (current.stock_status === "out_of_stock") {
      // Restocking re-lists the product. Without this, marking an item sold out
      // and later back in stock would leave it invisible to customers forever,
      // with nothing in the interface to explain why.
      patch.is_available = true;
    }
  }

  if (Object.keys(patch).length === 0) {
    throw badRequest("Nothing to update.");
  }

  return patch;
}
