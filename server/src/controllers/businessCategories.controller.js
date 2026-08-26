import { listActiveBusinessCategories } from "../services/businessCategories.service.js";

export async function getBusinessCategories(req, res) {
  const data = await listActiveBusinessCategories();
  res.status(200).json({ success: true, data });
}
