import { cn } from "../lib/cn.js";

const VARIANTS = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  secondary: "border border-line bg-surface text-ink hover:border-ink-muted",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-sunken hover:text-ink",
  danger: "border border-danger/25 bg-danger-soft text-danger hover:bg-danger-soft/70",
};

const SIZES = {
  sm: "h-9 gap-1.5 px-3 text-meta",
  md: "h-10 gap-2 px-4 text-[0.9375rem]",
  lg: "h-11 gap-2 px-5 text-[1rem]",
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
