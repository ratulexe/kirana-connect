import { useEffect, useState } from "react";
import { Check, Store as StoreIcon } from "lucide-react";
import Alert from "../../components/Alert.jsx";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useBusinessCategories, useUpdateStoreBusinessCategories } from "./useAdmin.js";

/**
 * Admin override of a store's business classification -- same underlying
 * write as the store owner's own panel in the Store app, just without the
 * ownership/verification gate, since an admin can classify (or correct the
 * classification of) any store.
 */
export default function BusinessCategoryAssignment({ storeId, primaryBusinessCategory, businessCategories }) {
  const categories = useBusinessCategories();
  const update = useUpdateStoreBusinessCategories();

  const [primaryId, setPrimaryId] = useState(primaryBusinessCategory?.id ?? "");
  const [secondaryIds, setSecondaryIds] = useState(
    () => new Set((businessCategories ?? []).filter((c) => c.id !== primaryBusinessCategory?.id).map((c) => c.id)),
  );

  useEffect(() => {
    setPrimaryId(primaryBusinessCategory?.id ?? "");
    setSecondaryIds(
      new Set((businessCategories ?? []).filter((c) => c.id !== primaryBusinessCategory?.id).map((c) => c.id)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handlePrimaryChange = (event) => {
    const nextPrimaryId = event.target.value;
    setPrimaryId(nextPrimaryId);
    setSecondaryIds((current) => {
      if (!current.has(nextPrimaryId)) return current;
      const next = new Set(current);
      next.delete(nextPrimaryId);
      return next;
    });
  };

  const toggleSecondary = (id) => {
    setSecondaryIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    const categoryIds = primaryId ? [primaryId, ...secondaryIds] : [];
    update.mutate({ storeId, categoryIds, primaryCategoryId: primaryId || null });
  };

  if (categories.isPending) return <Skeleton className="h-40" />;
  if (categories.isError) {
    return (
      <Alert tone="error" title="Could not load business categories">
        {categories.error?.message ?? "Please try again."}
      </Alert>
    );
  }

  const options = categories.data ?? [];
  const secondaryOptions = options.filter((category) => category.id !== primaryId);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <StoreIcon className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-section text-ink">Business category</h2>
      </div>

      {update.isError ? (
        <Alert tone="error" className="mt-4">
          {update.error?.message ?? "Could not save this store's business category."}
        </Alert>
      ) : null}

      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="admin-primary-business-category" className="text-meta font-semibold text-ink-soft">
          Primary category
        </label>
        <select
          id="admin-primary-business-category"
          value={primaryId}
          onChange={handlePrimaryChange}
          className="w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink focus:border-primary focus:outline-none"
        >
          <option value="">Not classified</option>
          {options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="mt-4" disabled={!primaryId}>
        <legend className="text-meta font-semibold text-ink-soft">
          Also operates in <span className="font-normal text-ink-muted">(optional)</span>
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {secondaryOptions.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-meta text-ink-soft">
              <input
                type="checkbox"
                checked={secondaryIds.has(category.id)}
                onChange={() => toggleSecondary(category.id)}
                disabled={!primaryId}
                className="size-4 accent-[var(--color-primary)]"
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex justify-end">
        <Button onClick={handleSave} isLoading={update.isPending}>
          <Check className="size-4" aria-hidden="true" />
          Save
        </Button>
      </div>
    </Card>
  );
}
