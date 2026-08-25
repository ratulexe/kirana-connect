import { createDemandRequest, getStoreDemand } from "../services/demandRequests.service.js";
import { validateDemandRequestCreate } from "../utils/validateDemandRequest.js";
import { uuidField } from "../utils/validateInventory.js";

export async function postDemandRequest(req, res) {
  const data = await createDemandRequest({
    userId: req.user.id,
    payload: validateDemandRequestCreate(req.body),
  });
  res.status(201).json({ success: true, data });
}

export async function getStoreDemandHandler(req, res) {
  const data = await getStoreDemand({
    userId: req.user.id,
    storeId: uuidField(req.query.store_id, "Store"),
  });
  res.status(200).json({ success: true, data });
}
