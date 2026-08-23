import { cn } from "../lib/cn.js";

const TONES = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-surface-sunken text-ink-muted",
  danger: "bg-danger-soft text-danger",
};

export default function StatusPill({ tone = "neutral", children }) {
  return (
    <span className={cn("inline-flex rounded-pill px-2.5 py-1 text-meta font-semibold", TONES[tone])}>
      {children}
    </span>
  );
}
