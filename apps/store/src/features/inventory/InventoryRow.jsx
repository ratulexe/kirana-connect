import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import Button from "../../components/Button.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import { formatPrice, formatRelativeTime, formatShortDate, todayIsoDate } from "../../utils/format.js";
import { useRemoveInventoryItem, useUpdateInventoryItem } from "./useInventory.js";

const STOCK_LABELS = {
  in_stock: { label: "In stock", cls: "bg-success-soft text-success" },
  low_stock: { label: "Low stock", cls: "bg-warning-soft text-warning" },
  out_of_stock: { label: "Sold out", cls: "bg-surface-sunken text-ink-muted" },
};

function StockPill({ status }) {
  const state = STOCK_LABELS[status];
  return (
    <span
      className={`inline-flex rounded-pill px-2.5 py-1 text-meta font-semibold ${state.cls}`}
    >
      {state.label}
    </span>
  );
}

const EXPIRY_TONES = {
  valid: "bg-surface-sunken text-ink-soft",
  expiring_soon: "bg-warning-soft text-warning",
  expires_today: "bg-warning-soft text-warning",
  expired: "bg-danger-soft text-danger",
  unknown: "bg-surface-sunken text-ink-muted",
};

/**
 * Expiry belongs to this store's inventory row, never to the product or
 * variant -- the same 500 ml pack can carry a different expiry at every shop
 * that stocks it. Wording is deliberately factual (no "fresh guaranteed"):
 * the date is whatever the store owner entered, not something the platform
 * verifies.
 */
function expiryLabel({ expiry_status, days_until_expiry, expiry_date }) {
  switch (expiry_status) {
    case "expired":
      return `Expired on ${formatShortDate(expiry_date)}`;
    case "expires_today":
      return "Expires today";
    case "expiring_soon":
      return `Expires in ${days_until_expiry} day${days_until_expiry === 1 ? "" : "s"}`;
    case "valid":
      return `Best before ${formatShortDate(expiry_date)}`;
    default:
      return "Expiry not provided";
  }
}

function ExpiryPill({ item }) {
  const status = item.expiry_status ?? "unknown";
  return (
    <span
      className={`inline-flex rounded-pill px-2.5 py-1 text-meta font-semibold ${EXPIRY_TONES[status] ?? EXPIRY_TONES.unknown}`}
    >
      {expiryLabel(item)}
    </span>
  );
}

/**
 * One product a store carries.
 *
 * Editing is explicit rather than save-on-change: a price is commercial data,
 * and nudging a number field should not silently republish it to customers.
 */
export default function InventoryRow({ item, storeId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [draft, setDraft] = useState(null);

  const update = useUpdateInventoryItem(storeId);
  const remove = useRemoveInventoryItem(storeId);

  const { product } = item;
  const mrp = Number(product.mrp);
  const price = Number(item.selling_price);
  const savings = mrp > price ? mrp - price : 0;

  const startEditing = () => {
    setDraft({
      selling_price: String(item.selling_price),
      stock_status: item.stock_status,
      quantity_available: item.quantity_available ?? "",
      discount_percentage: String(item.discount_percentage ?? 0),
      is_available: item.is_available,
      expiry_date: item.expiry_date ?? "",
    });
    setIsEditing(true);
  };

  const save = () => {
    update.mutate(
      {
        itemId: item.id,
        patch: {
          selling_price: draft.selling_price,
          stock_status: draft.stock_status,
          quantity_available: draft.quantity_available === "" ? null : draft.quantity_available,
          discount_percentage: draft.discount_percentage,
          is_available: draft.is_available,
          expiry_date: draft.expiry_date === "" ? null : draft.expiry_date,
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const field = (key) => ({
    value: draft[key],
    onChange: (event) => setDraft({ ...draft, [key]: event.target.value }),
  });

  /**
   * Changing stock also moves the listing checkbox, so it shows what will
   * actually happen. Sold out is always hidden, and restocking puts the product
   * back in front of customers rather than leaving it silently invisible.
   */
  const changeStockStatus = (event) => {
    const next = event.target.value;
    setDraft((current) => ({
      ...current,
      stock_status: next,
      is_available:
        next === "out_of_stock"
          ? false
          : current.stock_status === "out_of_stock"
            ? true
            : current.is_available,
    }));
  };

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ProductImage src={product.image_url} name={product.name} size="sm" />
          <div className="min-w-0">
          <p className="text-card text-ink">{product.name}</p>
          <p className="mt-0.5 text-meta text-ink-muted">
            {product.unit_label}
            {product.brand ? ` · ${product.brand.name}` : ""}
            {` · MRP ${formatPrice(mrp)}`}
          </p>
          </div>
        </div>

        {!isEditing ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="text-right">
              <p className="text-[1.125rem] font-bold tracking-tight text-ink tabular-nums">
                {formatPrice(price)}
              </p>
              {savings > 0 ? (
                <p className="text-meta font-semibold text-success tabular-nums">
                  {formatPrice(savings)} under MRP
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <StockPill status={item.stock_status} />
                <ExpiryPill item={item} />
              </div>
              {!item.is_available ? (
                <span className="text-meta text-ink-muted">Not listed</span>
              ) : null}
              {item.expiry_status === "expired" ? (
                <span className="text-meta font-semibold text-danger">Hidden from customers</span>
              ) : null}
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </Button>
              {confirmRemove ? (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove.mutate(item.id)}
                    isLoading={remove.isPending}
                  >
                    Confirm
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRemove(true)}
                  aria-label={`Remove ${product.name} from your inventory`}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-4 rounded-card border border-line bg-canvas p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold text-ink-soft">Your price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                {...field("selling_price")}
                className="rounded-control border border-line bg-surface px-3 py-2 text-[0.9375rem] text-ink tabular-nums focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold text-ink-soft">Stock</span>
              <select
                value={draft.stock_status}
                onChange={changeStockStatus}
                className="rounded-control border border-line bg-surface px-3 py-2 text-[0.9375rem] text-ink focus:border-primary focus:outline-none"
              >
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Sold out</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold text-ink-soft">
                Quantity <span className="font-normal text-ink-muted">(optional)</span>
              </span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="Not tracked"
                {...field("quantity_available")}
                className="rounded-control border border-line bg-surface px-3 py-2 text-[0.9375rem] text-ink tabular-nums focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold text-ink-soft">Offer %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputMode="decimal"
                {...field("discount_percentage")}
                className="rounded-control border border-line bg-surface px-3 py-2 text-[0.9375rem] text-ink tabular-nums focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold text-ink-soft">
                Best before <span className="font-normal text-ink-muted">(optional)</span>
              </span>
              <input
                type="date"
                {...field("expiry_date")}
                className="rounded-control border border-line bg-surface px-3 py-2 text-[0.9375rem] text-ink focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          {draft.expiry_date && draft.expiry_date < todayIsoDate() ? (
            <p className="mt-3 text-meta font-medium text-warning">
              This date has already passed. The product will be hidden from customers.
            </p>
          ) : null}

          <label className="mt-4 inline-flex items-center gap-2 text-meta text-ink-soft">
            <input
              type="checkbox"
              checked={draft.is_available}
              disabled={draft.stock_status === "out_of_stock"}
              onChange={(event) => setDraft({ ...draft, is_available: event.target.checked })}
              className="size-4 accent-[var(--color-primary)]"
            />
            Show this product to customers
            {draft.stock_status === "out_of_stock" ? (
              <span className="text-ink-muted">(sold out items are always hidden)</span>
            ) : null}
          </label>

          {update.isError ? (
            <p role="alert" className="mt-3 text-meta font-medium text-danger">
              {update.error?.message ?? "Could not save. Please try again."}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={save} isLoading={update.isPending}>
              <Check className="size-3.5" aria-hidden="true" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="size-3.5" aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {remove.isError ? (
        <p role="alert" className="mt-2 text-meta font-medium text-danger">
          {remove.error?.message ?? "Could not remove that product."}
        </p>
      ) : null}

      {!isEditing ? (
        <p className="mt-2 text-meta text-ink-muted">
          Stock updated {formatRelativeTime(item.last_stock_update)}
        </p>
      ) : null}
    </li>
  );
}
