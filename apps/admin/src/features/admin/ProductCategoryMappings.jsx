import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, ListTree } from "lucide-react";
import Alert from "../../components/Alert.jsx";
import Button from "../../components/Button.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useCategories, useProductCategoryMappings, useUpdateProductCategoryMappings } from "./useAdmin.js";

/**
 * Which Product Categories (Beverages, Snacks, ...) count as "relevant" for
 * a given Business Category (Grocery Store, Dairy Store, ...) -- the exact
 * taxonomy bridge demand/supply/price-intelligence analysis already reads
 * via business_category_product_categories. This was API-only until now;
 * a compact expandable checklist per business category is enough, since a
 * mapping is a handful of checkboxes, not a page of its own.
 */
export default function ProductCategoryMappings({ businessCategoryId }) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const categories = useCategories();
  const mappings = useProductCategoryMappings(open ? businessCategoryId : null);
  const update = useUpdateProductCategoryMappings();

  // Preserve the current mappings as the starting checklist state each time
  // a fresh copy loads -- never trust local edits across a reopen.
  useEffect(() => {
    if (mappings.data) setSelectedIds(new Set(mappings.data.map((c) => c.id)));
  }, [mappings.data]);

  function toggle(id) {
    setJustSaved(false);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    update.mutate(
      { categoryId: businessCategoryId, productCategoryIds: [...selectedIds] },
      { onSuccess: () => setJustSaved(true) },
    );
  }

  return (
    <div className="mt-3 border-t border-line-soft pt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-meta font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <ListTree className="size-3.5 shrink-0" aria-hidden="true" />
        Product categories
        {open ? <ChevronUp className="size-3.5 shrink-0" aria-hidden="true" /> : <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />}
      </button>

      {open ? (
        <div className="mt-3">
          {categories.isPending || mappings.isPending ? (
            <Skeleton className="h-24" />
          ) : categories.isError || mappings.isError ? (
            <Alert tone="error">
              {(categories.error ?? mappings.error)?.message ?? "Could not load product categories."}
            </Alert>
          ) : (
            <>
              {update.isError ? (
                <Alert tone="error" className="mb-3">
                  {update.error?.message ?? "Could not save this mapping."}
                </Alert>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {categories.data.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 text-meta text-ink-soft">
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(category.id) ?? false}
                      onChange={() => toggle(category.id)}
                      className="size-4 accent-[var(--color-primary)]"
                    />
                    {category.name}
                  </label>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <Button size="sm" onClick={handleSave} isLoading={update.isPending}>
                  <Check className="size-3.5" aria-hidden="true" />
                  Save mapping
                </Button>
                {justSaved && !update.isPending ? (
                  <span className="text-meta font-semibold text-success">Saved</span>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
