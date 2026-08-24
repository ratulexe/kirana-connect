import { AlertTriangle, Trash2 } from "lucide-react";
import Button from "./Button.jsx";

export default function DeleteProductDialog({ product, onClose, onConfirm, isPending, error }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 text-error">
          <AlertTriangle className="size-6" aria-hidden="true" />
          <h2 id="delete-title" className="text-lg font-bold">
            Delete product?
          </h2>
        </div>

        <p className="mt-4 text-body font-semibold text-ink">
          &quot;{product.name}&quot;
        </p>
        <p className="mt-2 text-body text-ink-muted">
          This action may affect stores that currently use this product.
        </p>

        {error && (
          <div className="mt-4 rounded bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button 
            className="bg-error text-white hover:bg-error/90" 
            onClick={() => onConfirm(product.id)}
            isLoading={isPending}
          >
            <Trash2 className="mr-2 size-4" />
            Delete product
          </Button>
        </div>
      </div>
    </div>
  );
}
