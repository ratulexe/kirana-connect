import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn.js";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A generic accessible dialog: the one modal primitive the app builds on,
 * rather than each feature hand-rolling its own overlay.
 *
 * Deliberately plain -- a backdrop fade and a small scale-in via CSS, no
 * animation library -- since this is chrome around a message, not something
 * worth spending motion budget on.
 */
export default function Modal({ open, onClose, title, icon: Icon, children, className }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    lastFocusedRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? dialog)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const nodes = dialog?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!nodes || nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (lastFocusedRef.current instanceof HTMLElement) lastFocusedRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] motion-safe:animate-[modal-fade-in_150ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-sm rounded-panel border border-line bg-surface p-5 shadow-float",
          "outline-none motion-safe:animate-[modal-in_150ms_ease-out] sm:p-6",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          {Icon ? (
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          ) : null}
          <h2 id={titleId} className="mt-1.5 text-card text-ink">
            {title}
          </h2>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
