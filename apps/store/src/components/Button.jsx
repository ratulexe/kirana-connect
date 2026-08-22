import { cn } from "../lib/cn.js";

const VARIANTS = {
  primary:
    "bg-primary text-primary-fg shadow-subtle hover:bg-primary-hover active:translate-y-px",
  secondary:
    "bg-surface text-ink border border-line hover:border-ink-muted active:translate-y-px",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-sunken hover:text-ink",
  danger: "bg-danger-soft text-danger border border-danger/25 hover:bg-danger-soft/70",
};

const SIZES = {
  sm: "h-9 gap-1.5 px-3.5 text-meta",
  md: "h-11 gap-2 px-5 text-[0.9375rem]",
  lg: "h-12 gap-2 px-6 text-[1rem]",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  className,
  type,
  disabled,
  children,
  ...props
}) {
  return (
    <Tag
      type={Tag === "button" ? (type ?? "button") : type}
      disabled={Tag === "button" ? (disabled ?? isLoading) : undefined}
      aria-busy={isLoading || undefined}
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
