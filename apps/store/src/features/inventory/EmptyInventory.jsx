import { PackagePlus } from "lucide-react";
import Button from "../../components/Button.jsx";

export default function EmptyInventory({ onAdd }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
      <span className="mb-4 inline-flex size-11 items-center justify-center rounded-pill bg-surface-sunken text-ink-muted">
        <PackagePlus className="size-5" aria-hidden="true" />
      </span>
      <p className="text-card text-ink">No products listed yet</p>
      <p className="mt-1.5 max-w-sm text-body text-ink-muted">
        Customers can only find your shop for products you have listed. Add the items
        you keep in stock and set your own price for each.
      </p>
      <Button className="mt-5" onClick={onAdd}>
        Add your first product
      </Button>
    </div>
  );
}
