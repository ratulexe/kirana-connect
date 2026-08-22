import { cn } from "../../lib/cn.js";

const VARIANTS = {
  solid: "bg-primary text-primary-fg hover:bg-primary-hover",
  outline: "border border-line bg-surface text-ink-soft hover:text-ink hover:border-ink-muted",
  ghost: "text-ink-soft hover:bg-surface-sunken hover:text-ink",
};

const SIZES = {
  sm: "size-9",
  md: "size-11",
};

/**
 * Icon-only control. `label` is required and becomes the accessible name,
 * because an icon alone tells a screen reader nothing.
 */
export default function IconButton({
  label,
  icon: Icon,
  variant = "ghost",
  size = "md",
  className,
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-control",
        "transition-colors duration-150 ease-brand",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      <Icon className={size === "sm" ? "size-4" : "size-5"} aria-hidden="true" />
    </button>
  );
}
