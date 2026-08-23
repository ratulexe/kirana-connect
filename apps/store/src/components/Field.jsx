import { useId } from "react";
import { cn } from "../lib/cn.js";

/**
 * Label, control, hint and error as one unit.
 *
 * Every control gets a real <label for>, and the error is wired through
 * aria-describedby with role="alert" so it is announced rather than merely
 * turning red. `children` is a render function so the field owns the ids.
 */
export default function Field({ label, hint, error, required, className, children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-meta font-semibold text-ink-soft">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 font-normal text-ink-muted">(optional)</span>
        )}
      </label>

      {children({
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })}

      {hint && !error ? (
        <p id={hintId} className="text-meta text-ink-muted">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-meta font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL_BASE =
  "w-full rounded-control border bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink " +
  "placeholder:text-ink-muted transition-[border-color,box-shadow] duration-150 ease-brand " +
  "focus:border-primary focus:outline-none disabled:opacity-60";

export function TextInput({ invalid, className, ...props }) {
  return (
    <input
      className={cn(CONTROL_BASE, invalid ? "border-danger" : "border-line", className)}
      {...props}
    />
  );
}

export function TextArea({ invalid, className, ...props }) {
  return (
    <textarea
      className={cn(
        CONTROL_BASE,
        "min-h-24 resize-y",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  );
}
