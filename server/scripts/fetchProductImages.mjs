/**
 * Fills in products.image_url from Open Food Facts.
 *
 * Open Food Facts is a free, open product database with no API key. Its photos
 * are contributed under CC-BY-SA, so anything shown from it needs visible
 * attribution, which the UI carries next to the image.
 *
 * The catalogue keeps a nullable image_url on purpose: not every kirana item
 * exists in an open database, and a product without a photo is a normal state,
 * not a failure. Anything unmatched is simply left null and renders as an
 * initials tile.
 *
 * Usage, from the repository root:
 *   node server/scripts/fetchProductImages.mjs --dry-run
 *   node server/scripts/fetchProductImages.mjs
 *   node server/scripts/fetchProductImages.mjs --force   (re-check rows that already have an image)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, "../.env"), quiet: true });

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

// Open Food Facts asks callers to identify themselves and to be gentle.
const USER_AGENT = "KiranaConnect/0.1 (prototype; https://github.com/ratulexe/kirana-connect)";

/**
 * Open Food Facts only covers food. Asking it for a soap bar returns whatever
 * shares a brand name, which is how "Dove Cream Beauty Bathing Bar" matched a
 * tub of Dove ice cream. Its sibling databases cover the other shelves, so each
 * category is sent to the right one.
 */
const DATABASE_BY_CATEGORY = {
  "dairy-and-eggs": "https://world.openfoodfacts.org",
  "groceries-and-staples": "https://world.openfoodfacts.org",
  beverages: "https://world.openfoodfacts.org",
  "snacks-and-packaged-food": "https://world.openfoodfacts.org",
  "personal-care": "https://world.openbeautyfacts.org",
  "household-care": "https://world.openproductsfacts.org",
};

// Words too generic to prove two products are the same thing.
const GENERIC_WORDS = new Set([
  "cream", "powder", "wash", "liquid", "original", "classic", "pack",
  "fresh", "natural", "plus", "extra", "super", "special", "premium",
]);
const REQUEST_GAP_MS = 2000;
const MAX_RETRIES = 3;

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Lowercase, accent-free, alphanumeric words.
 *
 * The NFKD pass matters: without it "Nescafé" loses its accented letter to the
 * character filter and becomes "nescaf", which then never matches "nescafe".
 */
const normalise = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function searchOpenFoodFacts(terms, baseUrl) {
  const url = new URL(`${baseUrl}/cgi/search.pl`);
  url.searchParams.set("search_terms", terms);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "8");
  url.searchParams.set("fields", "product_name,brands,image_front_url,image_front_small_url");

  // A shared free service throttles, and a 503 says "slow down", not "no such
  // product". Backing off and retrying is the difference between a real miss
  // and losing a match to traffic.
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    if (attempt > 0) await sleep(REQUEST_GAP_MS * (attempt + 1));

    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`Open Food Facts responded ${response.status}`);
        continue;
      }
      if (!response.ok) throw new Error(`Open Food Facts responded ${response.status}`);

      const payload = await response.json();
      return payload.products ?? [];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Open Food Facts could not be reached");
}

/**
 * Picks the best candidate, or nothing.
 *
 * A wrong photo is worse than no photo on a price-comparison site, so a
 * candidate must share a meaningful word with the product name, and a brand
 * match is required whenever we know the brand.
 */
function pickBest(candidates, product) {
  const brand = normalise(product.brand?.name);
  const ownWords = new Set(normalise(product.name).split(" ").filter(Boolean));
  const distinctive = [...ownWords].filter(
    (word) => word.length > 3 && !GENERIC_WORDS.has(word),
  );

  let best = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const image = candidate.image_front_url ?? candidate.image_front_small_url;
    if (!image) continue;

    const candidateName = normalise(candidate.product_name);
    const candidateWords = candidateName.split(" ").filter(Boolean);
    const candidateBrand = normalise(candidate.brands);

    // Must share something meaningful, not just a stray adjective.
    const overlap = distinctive.filter((word) => candidateName.includes(word)).length;
    if (overlap === 0) continue;

    const brandMatches = brand
      ? candidateBrand.includes(brand) || candidateName.includes(brand)
      : true;
    if (brand && !brandMatches) continue;

    // Words the candidate carries that our product does not are evidence of a
    // different item. "Nescafe Classic Instant Coffee" matching "Nescafé
    // classic descafeinado" is a decaf jar, and "Vim Dishwash Liquid Gel
    // Lemon" matching "Vim All-Purpose Cleaner Lemon Fresh" is not a
    // dishwash at all: both share a word but bring several that contradict.
    const unmatched = candidateWords.filter(
      (word) => word.length > 3 && !GENERIC_WORDS.has(word) && !ownWords.has(word),
    ).length;

    const score = overlap - unmatched;
    if (score < 1) continue;

    if (score > bestScore) {
      bestScore = score;
      best = { image, label: candidate.product_name, brand: candidate.brands };
    }
  }

  return best;
}

async function main() {
  let query = supabase
    .from("products")
    .select("id, name, slug, image_url, brand:brands (name), category:categories (slug)")
    .order("name");

  if (!FORCE) query = query.is("image_url", null);

  const { data: products, error } = await query;
  if (error) {
    console.error("Could not read products:", error.message);
    process.exit(1);
  }

  console.log(`${products.length} product(s) to look up${DRY_RUN ? "  (dry run, nothing will be written)" : ""}\n`);

  let matched = 0;
  let missed = 0;

  for (const product of products) {
    const baseUrl = DATABASE_BY_CATEGORY[product.category?.slug];
    if (!baseUrl) {
      missed += 1;
      console.log(`  no source  ${product.name} (category ${product.category?.slug ?? "unknown"})`);
      continue;
    }

    // Progressively looser queries. Exact names often miss because these
    // databases hold whatever a contributor typed on the packet, so the
    // fallbacks trade precision in the query for recall, while pickBest keeps
    // the precision requirement on the result.
    const brand = product.brand?.name;
    const words = normalise(product.name)
      .split(" ")
      .filter((w) => w.length > 3 && normalise(brand) !== w);

    const attempts = [
      product.name,
      // Brand plus the product type, which is usually the last word.
      words.length ? [brand, words[words.length - 1]].filter(Boolean).join(" ") : null,
      // Brand plus the leading descriptor.
      words.length ? [brand, words[0]].filter(Boolean).join(" ") : null,
      brand || null,
    ].filter(Boolean);

    let choice = null;
    for (const terms of attempts) {
      try {
        choice = pickBest(await searchOpenFoodFacts(terms, baseUrl), product);
      } catch (searchError) {
        console.log(`  ${product.name}: lookup failed (${searchError.message})`);
      }
      await sleep(REQUEST_GAP_MS);
      if (choice) break;
    }

    if (!choice) {
      missed += 1;
      console.log(`  no image   ${product.name}`);
      continue;
    }

    matched += 1;
    console.log(`  matched    ${product.name}\n             -> "${choice.label}" (${choice.brand || "no brand"})`);

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: choice.image })
        .eq("id", product.id);

      if (updateError) console.log(`             WRITE FAILED: ${updateError.message}`);
    }
  }

  console.log(`\n${matched} matched, ${missed} left without an image.`);
  if (missed > 0) {
    console.log("Products without an image render as an initials tile, which is expected.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
