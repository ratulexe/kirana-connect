import { useEffect, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import Button from "../../components/Button.jsx";
import Alert from "../../components/Alert.jsx";
import Skeleton from "../../components/Skeleton.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import { formatPrice } from "../../utils/format.js";
import { useAddInventoryItem, useCatalogueSearch } from "./useInventory.js";

/**
 * Adds a catalogue product to the store.
 *
 * Owners pick from the shared catalogue rather than typing free text, which is
 * what keeps one canonical product comparable across every shop. Creating new
 * catalogue entries is deliberately not possible here; that is curation.
 */
export default function AddProductPanel({ existingProductIds, onClose }) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    selling_price: "",
    stock_status: "in_stock",
    quantity_available: "",
    discount_percentage: "0",
  });

  const add = useAddInventoryItem();
  const { data, isFetching, isError, isSuccess, error } = useCatalogueSearch(debounced);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(timer);
  }, [term]);

  const choose = (product) => {
    setSelected(product);
    // Prefill with MRP: most shops start there and discount from it.
    setForm({
      selling_price: String(product.mrp),
      stock_status: "in_stock",
      quantity_available: "",
      discount_percentage: "0",
    });
  };

  const submit = (event) => {
    event.preventDefault();
    add.mutate(
      {
        product_id: selected.id,
        selling_price: form.selling_price,
        stock_status: form.stock_status,
        quantity_available: form.quantity_available === "" ? null : form.quantity_available,
        discount_percentage: form.discount_percentage,
      },
      {
        onSuccess: () => {
          setSelected(null);
          setTerm("");
          setDebounced("");
        },
      },
    );
  };

  const results = data ?? [];

  return (
    <section
      aria-labelledby="add-product-heading"
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="add-product-heading" className="text-section text-ink">
            Add a product
          </h2>
          <p className="mt-1 text-meta text-ink-muted">
            Search the shared catalogue, then set your own price.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close add product">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {!selected ? (
        <div className="mt-5">
          <label htmlFor="catalogue-search" className="sr-only">
            Search the product catalogue
          </label>
          <div className="flex items-center gap-2 rounded-control border border-line bg-canvas px-3.5 focus-within:border-primary">
            <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              id="catalogue-search"
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search milk, atta, tea..."
              autoComplete="off"
              className="h-11 min-w-0 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ink-muted"
            />
          </div>

          <div className="mt-4" aria-live="polite">
            {debounced.length < 2 ? (
              <p className="text-meta text-ink-muted">
                Type at least two characters to search.
              </p>
            ) : isError ? (
              /* A failed search is not an empty catalogue. Saying "nothing
                 matches" when the request never succeeded sends the owner off
                 to look for a product that is sitting right there. */
              <Alert tone="error" title="Could not search the catalogue">
                {error?.status === 0
                  ? "Kirana Connect could not be reached. Check that the API is running, then try again."
                  : (error?.message ?? "Please try again in a moment.")}
              </Alert>
            ) : !isSuccess || isFetching ? (
              /* Anything that is not a settled success shows as loading. The
                 empty message is gated on isSuccess so it can never stand in
                 for a request that failed, was cancelled, or never ran. */
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-card" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <Alert tone="info">
                Nothing in the catalogue matches &ldquo;{debounced}&rdquo;. Only products
                already in the shared catalogue can be listed.
              </Alert>
            ) : (
              <ul className="divide-y divide-line-soft rounded-card border border-line">
                {results.map((product) => {
                  const alreadyListed = existingProductIds.has(product.id);
                  return (
                    <li
                      key={product.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductImage src={product.image_url} name={product.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[0.9375rem] font-semibold text-ink">
                            {product.name}
                          </p>
                          <p className="text-meta text-ink-muted">
                            {product.unit_label}
                            {product.brand ? ` · ${product.brand.name}` : ""}
                            {` · MRP ${formatPrice(product.mrp)}`}
                          </p>
                        </div>
                      </div>
                      {alreadyListed ? (
                        <span className="inline-flex items-center gap-1 text-meta font-semibold text-success">
                          <Check className="size-3.5" aria-hidden="true" />
                          Already listed
                        </span>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => choose(product)}>
                          <Plus className="size-3.5" aria-hidden="true" />
                          Select
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5">
          <div className="flex items-center gap-3 rounded-card border border-line bg-canvas p-4">
            <ProductImage src={selected.image_url} name={selected.name} size="md" />
            <div>
              <p className="text-card text-ink">{selected.name}</p>
              <p className="mt-0.5 text-meta text-ink-muted">
                {selected.unit_label} · MRP {formatPrice(selected.mrp)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold text-ink-soft">Your price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                inputMode="decimal"
                value={form.selling_price}
                onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                className="rounded-control border border-line bg-surface px-3 py-2 text-[0.9375rem] text-ink tabular-nums focus:border-primary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-meta font-semibold text-ink-soft">Stock</span>
              <select
                value={form.stock_status}
                onChange={(e) => setForm({ ...form, stock_status: e.target.value })}
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
                value={form.quantity_available}
                onChange={(e) => setForm({ ...form, quantity_available: e.target.value })}
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
                value={form.discount_percentage}
                onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })}
                className="rounded-control border border-line bg-surface px-3 py-2 text-[0.9375rem] text-ink tabular-nums focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          {add.isError ? (
            <Alert tone="error" className="mt-4">
              {add.error?.message ?? "Could not add that product."}
            </Alert>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" isLoading={add.isPending}>
              Add to my store
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
              Choose a different product
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
