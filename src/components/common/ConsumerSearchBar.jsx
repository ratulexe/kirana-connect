import { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/cn.js";

const SIZES = {
  md: { form: "h-12", input: "text-[0.9375rem]", icon: "size-[1.125rem]" },
  lg: { form: "h-14 sm:h-16", input: "text-[1rem] sm:text-[1.0625rem]", icon: "size-5" },
};

const ROTATING_TERMS = ["Rice", "Cold drinks", "Biscuits", "Amul Milk", "Tea", "Dettol", "Oil"];
const TYPE_MS = 65;
const DELETE_MS = 45;
const HOLD_MS = 1400;
const GAP_MS = 300;

/**
 * "Search for <word>" where only the word types/deletes itself, character by
 * character -- the "Search for" prefix never moves. The closing quote mark
 * is baked into the animated string itself (word + '"'), not a separate
 * static element after it -- so it's literally the last character typed in
 * and the first one wiped away, using the exact same mechanism as every
 * other character instead of just sitting there unanimated. Deletion runs
 * slower than typing but still visibly, not an instant clear: every
 * character is removed one at a time, same as it's typed.
 */
function useTypewriterPlaceholder(wordRef, { enabled }) {
  useEffect(() => {
    if (!enabled) return undefined;
    const wordEl = wordRef.current;
    if (!wordEl) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wordEl.textContent = `${ROTATING_TERMS[0]}"`;
      return undefined;
    }

    let cancelled = false;
    let timer;

    const step = (wordIndex, charIndex, phase) => {
      if (cancelled) return;
      const word = `${ROTATING_TERMS[wordIndex]}"`;

      if (phase === "typing") {
        wordEl.textContent = word.slice(0, charIndex);
        timer = setTimeout(
          () =>
            charIndex < word.length
              ? step(wordIndex, charIndex + 1, "typing")
              : step(wordIndex, charIndex, "deleting"),
          charIndex < word.length ? TYPE_MS : HOLD_MS,
        );
        return;
      }

      // phase === "deleting"
      wordEl.textContent = word.slice(0, charIndex);
      if (charIndex > 0) {
        timer = setTimeout(() => step(wordIndex, charIndex - 1, "deleting"), DELETE_MS);
      } else {
        const nextIndex = (wordIndex + 1) % ROTATING_TERMS.length;
        timer = setTimeout(() => step(nextIndex, 0, "typing"), GAP_MS);
      }
    };

    step(0, 0, "typing");

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [wordRef, enabled]);
}

/**
 * The one Consumer search control. Two modes:
 *
 * - "launcher" (the header, on every page except /search): renders as a
 *   button styled identically to the real field. Clicking/focusing it
 *   navigates straight to /search -- there is nothing to type here, which
 *   sidesteps every edge case a focusable-but-not-really-editable text
 *   input would create, and matches this milestone's explicit rule that
 *   focusing the home search bar navigates to /search.
 * - "live" (the /search page itself): a real controlled input. The caller
 *   (SearchResults.jsx) owns the debounce and the fetch; this component only
 *   renders the field, the rotating placeholder while empty, and the
 *   loading-dash while `isLoading`.
 */
export default function ConsumerSearchBar({
  mode = "live",
  size = "md",
  value = "",
  onChange,
  onSubmit,
  isLoading = false,
  autoFocus = false,
  className,
}) {
  const navigate = useNavigate();
  const inputId = useId();
  const inputRef = useRef(null);
  const wordRef = useRef(null);
  const scale = SIZES[size];
  const isLauncher = mode === "launcher";
  const showRotating = value.length === 0;

  useTypewriterPlaceholder(wordRef, { enabled: showRotating });

  useEffect(() => {
    if (autoFocus && !isLauncher) inputRef.current?.focus();
  }, [autoFocus, isLauncher]);

  const goToSearch = () => {
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isLauncher) {
      goToSearch();
      return;
    }
    onSubmit?.(value.trim());
  };

  const shell = (
    <div
      className={cn(
        "group relative flex w-full items-center gap-2 rounded-pill border border-line bg-surface",
        "pr-1.5 pl-4 shadow-subtle sm:pl-5",
        "transition-[border-color,box-shadow] duration-200 ease-brand",
        "focus-within:border-primary focus-within:shadow-raised",
        scale.form,
        className,
      )}
    >
      <Search
        className={cn("shrink-0 text-ink-muted transition-colors group-focus-within:text-primary", scale.icon)}
        aria-hidden="true"
      />

      <span className="relative h-full min-w-0 flex-1">
        {showRotating ? (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center gap-0.5 overflow-hidden text-ink-muted",
              scale.input,
            )}
          >
            <span className="shrink-0">Search for&nbsp;&quot;</span>
            <span ref={wordRef} className="truncate" />
          </span>
        ) : null}

        {isLauncher ? (
          <span className={cn("flex h-full min-w-0 items-center truncate text-left text-ink", scale.input)}>
            {value || null}
          </span>
        ) : (
          <input
            id={inputId}
            ref={inputRef}
            type="search"
            name="q"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            className={cn(
              "h-full w-full min-w-0 bg-transparent text-ink placeholder:text-transparent",
              "outline-none [&::-webkit-search-cancel-button]:hidden",
              scale.input,
            )}
          />
        )}
      </span>

      {value && !isLauncher ? (
        <button
          type="button"
          onClick={() => onChange?.("")}
          aria-label="Clear search"
          className="shrink-0 rounded-pill p-1.5 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}

      {/* Loading dash: its own track, deliberately outside the field's own
          box-shadow/overflow so the two never fight each other visually. */}
      {isLoading ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 -bottom-px h-[2px] overflow-hidden rounded-full"
        >
          <span className="kc-search-dash absolute inset-y-0 w-1/4 rounded-full bg-primary" />
        </span>
      ) : null}
    </div>
  );

  if (isLauncher) {
    return (
      <button
        type="button"
        onClick={goToSearch}
        aria-label="Search products"
        className="w-full text-left"
      >
        {shell}
      </button>
    );
  }

  return (
    <form role="search" aria-label="Search products" onSubmit={handleSubmit} className="w-full">
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      {shell}
    </form>
  );
}
