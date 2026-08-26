import { useEffect, useState } from "react";
import { Check, Store as StoreIcon } from "lucide-react";
import Alert from "../../components/Alert.jsx";
import Button from "../../components/Button.jsx";
import Card from "../../components/Card.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import { useBusinessCategories, useUpdateStoreBusinessCategories } from "./useBusinessCategories.js";

/**
 * Primary business category (a dropdown, exactly one) plus optional
 * secondary categories (a checklist of everything else). Saves the full
 * resulting set in one request -- this is not the store-details change
 * request flow: classification takes effect immediately, the same way
 * inventory and opening hours do, since it is not a public-trust fact that
 * needs admin review before it applies.
 */
export default function BusinessCategoryPanel({ storeId, primaryBusinessCategory, businessCategories }) {
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

  const isDirty =
    primaryId !== (primaryBusinessCategory?.id ?? "") ||
    secondaryIds.size !== (businessCategories ?? []).filter((c) => c.id !== primaryBusinessCategory?.id).length ||
    [...secondaryIds].some((id) => !(businessCategories ?? []).some((c) => c.id === id));

  if (categories.isPending) {
    return <Skeleton className="h-40" />;
  }

  if (categories.isError) {
    return (
      <Alert tone="error" title="Could not load business categories">
        {categories.error?.message ?? "Please try again in a moment."}
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
      <p className="mt-1 text-meta text-ink-muted">
        Helps identify your store's business type for future local market insights. Not shown to customers yet.
      </p>

      {update.isError ? (
        <Alert tone="error" className="mt-4">
          {update.error?.message ?? "Could not save your business category."}
        </Alert>
      ) : null}
      {update.isSuccess && !isDirty ? (
        <Alert tone="success" className="mt-4">
          Business category saved.
        </Alert>
      ) : null}

      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="primary-business-category" className="text-meta font-semibold text-ink-soft">
          Primary category
        </label>
        <select
          id="primary-business-category"
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
            <label
              key={category.id}
              className="flex items-center gap-2 text-meta text-ink-soft disabled:opacity-45"
            >
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
        {!primaryId ? (
          <p className="mt-2 text-meta text-ink-muted">Choose a primary category first.</p>
        ) : null}
      </fieldset>

      <div className="mt-5 flex justify-end">
        <Button onClick={handleSave} isLoading={update.isPending} disabled={!isDirty}>
          <Check className="size-4" aria-hidden="true" />
          Save business category
        </Button>
      </div>
    </Card>
  );
}
