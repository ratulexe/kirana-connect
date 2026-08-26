import { recordSearchEvent } from "../services/searchEvents.service.js";
import { validateSearchEventCreate } from "../utils/validateSearchEvent.js";

export async function postSearchEvent(req, res) {
  const data = await recordSearchEvent(validateSearchEventCreate(req.body));
  res.status(201).json({ success: true, data });
}
