import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { cn } from "../lib/cn.js";

/**
 * A searchable dropdown for option lists too long to scan as a plain
 * <select> -- brands and categories grow over time as sellers add new ones,
 * and a native select with 50+ entries has no way to filter.
 *
 * `onCreate` is optional: when passed, typing a name that doesn't already
 * exist offers to create it inline instead of forcing the admin out to a
 * separate page and back. Left unset (as for categories, which are more
 * curated) the dropdown is select-only, same as before.
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Search...",
  emptyLabel = "None",
  invalid,
  id,
  "aria-describedby": describedBy,
  onCreate,
  createLabel = "item",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listboxId = useId();

  const selected = useMemo(() => options.find((option) => option.id === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.name.toLowerCase().includes(term));
  }, [options, query]);

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some((option) => option.name.toLowerCase() === trimmedQuery.toLowerCase());
  const canCreate = Boolean(onCreate) && trimmedQuery.length > 0 && !hasExactMatch;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    // Autofocus the search box the moment the dropdown opens.
    searchRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const choose = (optionId) => {
    onChange(optionId);
    setOpen(false);
  };

  const handleCreate = async () => {
    setCreateError("");
    setCreating(true);
    try {
      const created = await onCreate(trimmedQuery);
      choose(created.id);
    } catch (error) {
      setCreateError(error?.message ?? `Could not add this ${createLabel}.`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-control border bg-surface px-3 py-2.5 text-left text-[0.9375rem] text-ink",
          "focus:border-primary focus:outline-none",
          invalid ? "border-danger" : "border-line",
        )}
      >
        <span className={cn("truncate", selected ? "text-ink" : "text-ink-muted")}>
          {selected ? selected.name : emptyLabel}
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-control border border-line bg-surface shadow-float">
          <div className="flex items-center gap-2 border-b border-line-soft px-3 py-2">
            <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCreateError("");
              }}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ink-muted"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-ink-muted hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <ul id={listboxId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            <li role="option" aria-selected={!value}>
              <button
                type="button"
                onClick={() => choose("")}
                className={cn(
                  "block w-full px-3 py-2 text-left text-[0.9375rem] hover:bg-surface-sunken",
                  !value ? "font-semibold text-primary" : "text-ink-muted",
                )}
              >
                {emptyLabel}
              </button>
            </li>
            {filtered.length === 0 && !canCreate ? (
              <li className="px-3 py-2 text-meta text-ink-muted">No matches</li>
            ) : (
              filtered.map((option) => (
                <li key={option.id} role="option" aria-selected={option.id === value}>
                  <button
                    type="button"
                    onClick={() => choose(option.id)}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-[0.9375rem] hover:bg-surface-sunken",
                      option.id === value ? "font-semibold text-primary" : "text-ink",
                    )}
                  >
                    {option.name}
                  </button>
                </li>
              ))
            )}

            {canCreate ? (
              <li className={filtered.length > 0 ? "border-t border-line-soft" : undefined}>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[0.9375rem] font-semibold text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="size-4 shrink-0" aria-hidden="true" />
                  {creating ? `Adding "${trimmedQuery}"...` : `Add "${trimmedQuery}" as a new ${createLabel}`}
                </button>
                {createError ? (
                  <p role="alert" className="px-3 pb-2 text-meta text-danger">
                    {createError}
                  </p>
                ) : null}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
