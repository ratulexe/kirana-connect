import { useId, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/cn.js";
import Button from "./Button.jsx";

const SIZES = {
  md: { form: "h-12", input: "text-[0.9375rem]", icon: "size-[1.125rem]" },
  lg: { form: "h-14 sm:h-16", input: "text-[1rem] sm:text-[1.0625rem]", icon: "size-5" },
};

/**
 * Search entry point.
 *
 * A real <form> with a real <label>, so Enter submits and assistive tech gets a
 * proper accessible name. The parent owns what happens on submit; this
 * component only manages the field itself.
 */
export default function SearchBar({
  size = "md",
  placeholder = "Search for a product, brand or category",
  label = "Search products",
  defaultValue = "",
  submitLabel = "Search",
  showSubmit = true,
  onSubmit,
  className,
}) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);
  const scale = SIZES[size];

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "group flex w-full items-center gap-2 rounded-pill border border-line bg-surface",
        "pr-1.5 pl-4 shadow-subtle sm:pl-5",
        "transition-[border-color,box-shadow] duration-200 ease-brand",
        "focus-within:border-primary focus-within:shadow-raised",
        scale.form,
        className,
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      <Search
        className={cn("shrink-0 text-ink-muted transition-colors group-focus-within:text-primary", scale.icon)}
        aria-hidden="true"
      />

      <input
        id={inputId}
        type="search"
        name="q"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        className={cn(
          // h-full so the whole bar is a tap target, not just the text box.
          "h-full min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted",
          "outline-none [&::-webkit-search-cancel-button]:hidden",
          scale.input,
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="shrink-0 rounded-pill p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}

      {showSubmit ? (
        <Button
          type="submit"
          size={size === "lg" ? "md" : "sm"}
          className="hidden rounded-pill sm:inline-flex"
        >
          {submitLabel}
        </Button>
      ) : null}
    </form>
  );
}
