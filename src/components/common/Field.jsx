import { useId } from "react";
import { cn } from "../../lib/cn.js";

export default function Field({ label, required = false, error, hint, children }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <label className="grid min-w-0 gap-1.5 text-meta font-semibold text-ink-soft">
      <span>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })}
      {hint ? (
        <span id={hintId} className="text-meta font-normal text-ink-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="text-meta font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function TextInput({ className, invalid, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full min-w-0 rounded-control border bg-surface px-3 text-body text-ink transition-colors placeholder:text-ink-muted focus:border-primary focus:outline-none",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  );
}
