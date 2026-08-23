import { forwardRef, useId } from "react";
import { cn } from "../lib/cn.js";

export default function Field({ label, required, error, children }) {
  const id = useId();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-meta font-semibold text-ink-soft">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined })}
      {error ? (
        <span id={`${id}-error`} role="alert" className="text-meta font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export const TextInput = forwardRef(function TextInput({ invalid, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-control border bg-surface px-3 py-2.5 text-[0.9375rem] text-ink",
        "focus:border-primary focus:outline-none",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  );
});

export const SelectInput = forwardRef(function SelectInput({ invalid, className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-control border bg-surface px-3 py-2.5 text-[0.9375rem] text-ink",
        "focus:border-primary focus:outline-none",
        invalid ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
