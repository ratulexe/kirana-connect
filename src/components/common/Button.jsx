import { cn } from "../../lib/cn.js";

const VARIANTS = {
  primary:
    "bg-primary text-primary-fg shadow-subtle hover:bg-primary-hover active:bg-primary-hover active:translate-y-px",
  secondary:
    "bg-surface text-ink border border-line hover:border-ink-muted hover:bg-surface active:translate-y-px",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-sunken hover:text-ink active:translate-y-px",
};

const SIZES = {
  sm: "h-9 gap-1.5 px-3.5 text-meta",
  md: "h-11 gap-2 px-5 text-[0.9375rem]",
  lg: "h-13 gap-2.5 px-7 text-[1rem]",
};

/**
 * The single button primitive. `as` lets a link render with button styling
 * without giving up the correct element, which keeps keyboard and screen
 * reader behaviour intact.
 */
export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  type,
  children,
  ...props
}) {
  return (
    <Tag
      type={Tag === "button" ? (type ?? "button") : type}
      className={cn(
        "inline-flex items-center justify-center rounded-control font-semibold whitespace-nowrap",
        "transition-[background-color,border-color,color,transform] duration-150 ease-brand",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
