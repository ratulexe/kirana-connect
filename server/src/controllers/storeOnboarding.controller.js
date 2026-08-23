import {
  getOnboardingStatus,
  createStoreApplication,
  submitStoreChangeRequest,
} from "../services/storeOnboarding.service.js";
import { geocodeIndianAddress } from "../services/geocoding.service.js";
import { validateStoreRegistration } from "../utils/validateStoreRegistration.js";
import { optionalString } from "../utils/queryParams.js";
import { uuidField } from "../utils/validateInventory.js";

export async function getStatus(req, res) {
  const data = await getOnboardingStatus(req.user.id);
  res.status(200).json({ success: true, data });
}

export async function geocodeStoreAddress(req, res) {
  const query = optionalString(req.query.q, { field: "q", maxLength: 300 });
  if (!query) {
    res.status(200).json({ success: true, data: null });
    return;
  }

  const data = await geocodeIndianAddress(query);
  res.status(200).json({ success: true, data });
}

export async function submitStore(req, res) {
  // Only the fields the validator returns are used. owner_id, is_verified,
  // role, slug and id are never read from the body, so sending them has no
  // effect at all.
  const { store, owner, hours } = validateStoreRegistration(req.body);

  const data = await createStoreApplication({
    userId: req.user.id,
    store,
    owner,
    hours,
  });

  res.status(201).json({ success: true, data });
}

export async function submitStoreChange(req, res) {
  const { store, hours } = validateStoreRegistration(req.body);

  const data = await submitStoreChangeRequest({
    userId: req.user.id,
    storeId: uuidField(req.params.storeId, "Store"),
    store,
    hours,
  });

  res.status(202).json({ success: true, data });
}
