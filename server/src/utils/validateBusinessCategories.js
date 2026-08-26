import { badRequest } from "./httpError.js";
import { uuidField } from "./validateInventory.js";

const MAX_CATEGORIES_PER_STORE = 10;

/**
 * Payload for replacing one store's full set of business categories.
 * category_ids is the COMPLETE resulting set (primary included), not a diff
 * -- the caller (the checkbox + dropdown UI) always knows the full desired
 * state, which is what keeps "change primary" simple: the same category ids
 * stay checked, only which one is primary changes.
 */
export function validateStoreBusinessCategoriesUpdate(body) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("A business category payload is required.");
  }

  const rawIds = body.category_ids;
  if (!Array.isArray(rawIds)) {
    throw badRequest("category_ids must be an array.");
  }
  if (rawIds.length > MAX_CATEGORIES_PER_STORE) {
    throw badRequest(`Choose at most ${MAX_CATEGORIES_PER_STORE} business categories.`);
  }

  const categoryIds = rawIds.map((id, index) => uuidField(id, `category_ids[${index}]`));
  if (new Set(categoryIds).size !== categoryIds.length) {
    throw badRequest("The same business category was selected more than once.");
  }

  let primaryCategoryId = null;
  if (body.primary_category_id !== undefined && body.primary_category_id !== null && body.primary_category_id !== "") {
    primaryCategoryId = uuidField(body.primary_category_id, "primary_category_id");
  }

  if (categoryIds.length > 0 && !primaryCategoryId) {
    throw badRequest("Choose one primary business category.");
  }
  if (primaryCategoryId && !categoryIds.includes(primaryCategoryId)) {
    throw badRequest("The primary business category must be one of the selected categories.");
  }

  return { categoryIds, primaryCategoryId };
}

const MAX_PRODUCT_CATEGORY_MAPPINGS = 30;

/** Payload for replacing one business category's full mapped product-category set. */
export function validateProductCategoryMappingUpdate(body) {
  if (typeof body !== "object" || body === null) {
    throw badRequest("A product category mapping payload is required.");
  }

  const rawIds = body.product_category_ids;
  if (!Array.isArray(rawIds)) {
    throw badRequest("product_category_ids must be an array.");
  }
  if (rawIds.length > MAX_PRODUCT_CATEGORY_MAPPINGS) {
    throw badRequest(`Choose at most ${MAX_PRODUCT_CATEGORY_MAPPINGS} product categories.`);
  }

  const productCategoryIds = rawIds.map((id, index) => uuidField(id, `product_category_ids[${index}]`));
  if (new Set(productCategoryIds).size !== productCategoryIds.length) {
    throw badRequest("The same product category was selected more than once.");
  }

  return productCategoryIds;
}
