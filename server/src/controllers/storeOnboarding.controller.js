import {
  getOnboardingStatus,
  createStoreApplication,
} from "../services/storeOnboarding.service.js";
import { validateStoreRegistration } from "../utils/validateStoreRegistration.js";

export async function getStatus(req, res) {
  const data = await getOnboardingStatus(req.user.id);
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
