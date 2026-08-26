import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Star, TriangleAlert } from "lucide-react";
import { fetchLocationSuggestions } from "../../services/locationAutocomplete.js";
import { POPULAR_LOCATIONS } from "../../features/entrepreneur/popularLocations.js";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;

/**
 * Accessible location search-as-you-type combobox. Purely a text/selection
 * notifier -- it never owns "the" location value; the caller decides what a
 * free-text change vs. a real selection means (see EntrepreneurHome.jsx,
 * which clears any previously selected coordinates the moment the text no
 * longer matches what was selected).
 *
 * Debounced ~350ms, minimum 2 characters, results capped by the backend.
 * Every fetch carries an AbortController AND a monotonic request id, so a
 * slow earlier response (e.g. "sa") can never overwrite a later one
 * ("salt") even if it resolves after -- both guards are cheap and this
 * field is exactly the kind of place a single one could still race.
 */
export default function LocationAutocompleteInput({
  id,
  name,
  value,
  onChange,
  onSelect,
  placeholder,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const listboxId = useId();
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const requestSeqRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function runSearch(query) {
    clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      // Below the provider's minimum: fall back to the quick-pick list
      // rather than an empty dropdown, so an untouched field still offers a
      // usable starting point.
      abortRef.current?.abort();
      setSuggestions([]);
      setStatus("popular");
      setOpen(trimmed.length === 0);
      setHighlightedIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const seq = ++requestSeqRef.current;

      setStatus("loading");
      try {
        const data = await fetchLocationSuggestions(trimmed, { signal: controller.signal });
        if (seq !== requestSeqRef.current) return; // a newer request already superseded this one

        if (data.status === "ok") {
          setSuggestions(data.suggestions);
          // A real, valid response that simply found nothing is not an
          // error -- it gets its own quiet "keep typing" message, not the
          // provider-failure banner, and not just silently closing (which
          // would make the field look unresponsive after a real keystroke).
          setStatus(data.suggestions.length > 0 ? "ok" : "empty");
          setOpen(true);
          setHighlightedIndex(-1);
        } else {
          // "not-configured" or "unavailable" -- degrade quietly, the field
          // itself stays fully usable for manual entry either way.
          setSuggestions([]);
          setStatus(data.status === "not-configured" ? "idle" : "error");
          setOpen(data.status === "unavailable");
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (seq !== requestSeqRef.current) return;
        setSuggestions([]);
        setStatus("error");
        setOpen(true);
      }
    }, DEBOUNCE_MS);
  }

  function handleInputChange(event) {
    const text = event.target.value;
    onChange(text);
    runSearch(text);
  }

  function selectSuggestion(suggestion) {
    onSelect(suggestion);
    setOpen(false);
    setSuggestions([]);
    setStatus("idle");
    setHighlightedIndex(-1);
  }

  // Whatever list is currently on screen -- live provider results while
  // searching, quick picks before anything is typed. Keyboard navigation and
  // selection are identical for both, so they share one code path.
  const showingPopular = status === "popular";
  const activeOptions = showingPopular ? POPULAR_LOCATIONS : suggestions;

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      // ArrowDown on an untouched field is how a keyboard user discovers the
      // quick picks exist, so it opens the list rather than doing nothing.
      if (!open && !value.trim()) {
        event.preventDefault();
        setStatus("popular");
        setOpen(true);
        setHighlightedIndex(0);
        return;
      }
      if (!open || activeOptions.length === 0) return;
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % activeOptions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      if (!open || activeOptions.length === 0) return;
      event.preventDefault();
      setHighlightedIndex((current) => (current <= 0 ? activeOptions.length - 1 : current - 1));
      return;
    }
    if (event.key === "Enter") {
      if (!open || highlightedIndex < 0 || !activeOptions[highlightedIndex]) return;
      event.preventDefault();
      selectSuggestion(activeOptions[highlightedIndex]);
      return;
    }
    if (event.key === "Escape") {
      // Closes the suggestion list only -- never clears the typed text and
      // never bubbles up to close anything else on the page.
      if (open) {
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    // Tab and every other key: no special handling, normal browser/RHF
    // behaviour applies.
  }

  function handleBlur(event) {
    // A click on an option fires mousedown (which selects, see below)
    // before blur -- this only needs to handle focus genuinely leaving the
    // whole combobox (e.g. Tab to the next field).
    if (containerRef.current?.contains(event.relatedTarget)) return;
    setOpen(false);
  }

  const activeDescendant =
    open && highlightedIndex >= 0 && activeOptions[highlightedIndex]
      ? `${listboxId}-option-${highlightedIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeDescendant}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        autoComplete="off"
        value={value}
        // Full resolved addresses are longer than the field is wide, so the
        // visible text is inevitably clipped -- title exposes the whole
        // thing on hover, and the confirmation line below the field renders
        // it wrapped in full.
        title={value || undefined}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          } else if (!value.trim()) {
            setStatus("popular");
            setOpen(true);
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        // w-full, not flex-1: the wrapper below is a block element (it has to
        // be, so the absolutely-positioned dropdown can anchor to it), so a
        // flex utility here is inert and the input silently collapses to its
        // default ~20-character intrinsic width -- which clipped both the
        // placeholder and any typed address.
        className="w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-ink-muted"
      />

      {status === "loading" ? (
        <Loader2
          className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 animate-spin text-ink-muted"
          aria-hidden="true"
        />
      ) : null}

      {open ? (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 z-30 max-h-72 w-full min-w-[16rem] overflow-y-auto rounded-control border border-line bg-surface shadow-float">
          {status === "error" ? (
            <p className="flex items-start gap-2 px-3.5 py-3 text-meta text-ink-soft">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              Location suggestions are temporarily unavailable. You can still enter the location manually.
            </p>
          ) : status === "empty" ? (
            <p className="px-3.5 py-3 text-meta text-ink-muted">
              No suggestions yet. Keep typing or enter the location manually.
            </p>
          ) : (
            <>
              {showingPopular ? (
                <p className="flex items-center gap-1.5 border-b border-line-soft px-3.5 py-2 text-meta font-semibold text-ink-muted">
                  <Star className="size-3 shrink-0" aria-hidden="true" />
                  Popular locations
                </p>
              ) : null}
              <ul id={listboxId} role="listbox" className="py-1">
                {activeOptions.map((option, index) => (
                  <li
                    // index-qualified: the live provider has been observed to
                    // return two distinct suggestions sharing the same id for
                    // near-duplicate addresses, which broke React's key
                    // uniqueness assumption.
                    key={`${option.id}-${index}`}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    onMouseDown={(event) => {
                      // mousedown, not click: fires before the input's blur,
                      // so selection completes before the list would close.
                      event.preventDefault();
                      selectSuggestion(option);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex cursor-pointer items-start gap-2 px-3.5 py-2.5 text-meta ${
                      index === highlightedIndex ? "bg-primary-soft text-ink" : "text-ink-soft"
                    }`}
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span>{showingPopular ? (option.shortLabel ?? option.label) : option.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {showingPopular ? (
            <p className="border-t border-line-soft px-3.5 py-2 text-meta text-ink-muted">
              Or type any Indian town, block or district to search.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
