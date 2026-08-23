import {
  listInventory,
  addInventoryItem,
  updateInventoryItem,
  removeInventoryItem,
} from "../services/inventory.service.js";
import {
  validateInventoryCreate,
  validateInventoryUpdate,
  uuidField,
} from "../utils/validateInventory.js";

// store_id is optional and only used to choose between stores the caller
// already owns. Ownership is still verified server-side; supplying somebody
// else's id results in a not-found, never access.
const optionalStoreId = (req) =>
  uuidField(req.query.store_id, "Store", { required: false });

export async function getInventory(req, res) {
  const data = await listInventory({
    userId: req.user.id,
    storeId: optionalStoreId(req),
  });
  res.status(200).json({ success: true, data });
}

export async function postInventoryItem(req, res) {
  const data = await addInventoryItem({
    userId: req.user.id,
    storeId: optionalStoreId(req),
    payload: validateInventoryCreate(req.body),
  });
  res.status(201).json({ success: true, data });
}

export async function patchInventoryItem(req, res) {
  const data = await updateInventoryItem({
    userId: req.user.id,
    itemId: uuidField(req.params.itemId, "Inventory item"),
    storeId: optionalStoreId(req),
    // The patch is built once the current row is known, so stock status and
    // availability stay coherent even on a partial update.
    buildPatch: (current) => validateInventoryUpdate(req.body, current),
  });
  res.status(200).json({ success: true, data });
}

export async function deleteInventoryItem(req, res) {
  const data = await removeInventoryItem({
    userId: req.user.id,
    itemId: uuidField(req.params.itemId, "Inventory item"),
    storeId: optionalStoreId(req),
  });
  res.status(200).json({ success: true, data });
}
