import { cn } from "../../lib/cn.js";

const TONES = {
  neutral: "bg-surface-sunken text-ink-soft",
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  outline: "border border-line bg-surface text-ink-soft",
};

/**
 * Small status pill. Colour and wording carry the meaning; there are no emoji
 * anywhere in this system.
 */
export default function Badge({ tone = "neutral", icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1",
        "text-meta font-semibold tracking-tight whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
