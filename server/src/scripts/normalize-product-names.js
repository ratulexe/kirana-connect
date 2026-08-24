import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(".env") });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export function normalizeProductName(input) {
  if (typeof input !== "string") return input;
  let normalized = input.trim().replace(/\s+/g, " ");
  if (!normalized) return normalized;
  normalized = normalized.toLowerCase();
  const match = normalized.match(/[a-z]/i);
  if (match) {
    const idx = match.index;
    normalized =
      normalized.substring(0, idx) +
      normalized.charAt(idx).toUpperCase() +
      normalized.substring(idx + 1);
  }
  return normalized;
}

async function run() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, barcode");

  if (error) {
    console.error("Failed to load products", error);
    process.exit(1);
  }

  const updates = [];
  const normalizedMap = new Map();
  const conflicts = [];

  for (const product of products) {
    const norm = normalizeProductName(product.name);
    
    // Even if it hasn't changed case, check collisions just in case? 
    // We mainly care if the NEW normalized name collides.
    const key = norm.toLowerCase(); // Case-insensitive duplicate check 

    if (normalizedMap.has(key)) {
      conflicts.push({ existing: normalizedMap.get(key), new: product, normalizedName: norm });
    } else {
      normalizedMap.set(key, product);
    }

    if (norm !== product.name) {
      updates.push({ id: product.id, old: product.name, new: norm });
    }
  }

  console.log(`Found ${updates.length} products to normalize.`);
  
  if (conflicts.length > 0) {
    console.error(`\nFound ${conflicts.length} conflicts where normalization would create duplicates:`);
    for (const conflict of conflicts) {
      console.error(`  - "${conflict.new.name}" normalizes to "${conflict.normalizedName}" which conflicts with existing "${conflict.existing.name}"`);
    }
    console.log("\nPlease resolve these conflicts manually before continuing.");
    // We only migrate safe ones.
    const conflictIds = new Set(conflicts.flatMap(c => [c.existing.id, c.new.id]));
    const safeUpdates = updates.filter(u => !conflictIds.has(u.id));
    console.log(`\nSafe updates remaining: ${safeUpdates.length}`);

    if (safeUpdates.length > 0) {
      console.log("Applying safe updates...");
      for (const update of safeUpdates) {
        await supabase.from("products").update({ name: update.new }).eq("id", update.id);
      }
      console.log("Safe updates applied.");
    }
  } else {
    console.log("No conflicts found.");
    if (updates.length > 0) {
      console.log("Applying updates...");
      for (const update of updates) {
        await supabase.from("products").update({ name: update.new }).eq("id", update.id);
      }
      console.log("Updates applied successfully.");
    }
  }
}

run();
