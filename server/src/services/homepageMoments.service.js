import { getPublicClient, getServiceClient } from "../config/supabase.js";
import { badRequest, httpError } from "../utils/httpError.js";

// Mirrors the six cards in src/features/home/DiscoveryMoments.jsx (Consumer)
// and the admin Homepage Moments page. Kept here too so an unrecognised slug
// is rejected before it ever reaches the database.
export const HOMEPAGE_MOMENT_SLUGS = [
  "breakfast-rush",
  "chai-break",
  "celebration",
  "late-night",
  "sunday-stocking",
  "festival-ready",
];

function failed(operation, error) {
  return httpError(502, `Supabase ${operation} failed: ${error.message}`);
}

export async function listMomentImages() {
  const { data, error } = await getPublicClient().from("homepage_moments").select("slug, image_url");

  if (error) throw failed("load homepage moment images", error);
  return data ?? [];
}

export async function setMomentImage(slug, imageUrl) {
  if (!HOMEPAGE_MOMENT_SLUGS.includes(slug)) throw badRequest("Unknown homepage moment.");

  const { data, error } = await getServiceClient()
    .from("homepage_moments")
    .upsert({ slug, image_url: imageUrl }, { onConflict: "slug" })
    .select("slug, image_url")
    .single();

  if (error) throw failed("save homepage moment image", error);
  return data;
}
