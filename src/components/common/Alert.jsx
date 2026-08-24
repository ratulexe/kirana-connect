import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "../../lib/cn.js";

const STYLES = {
  error: {
    icon: AlertCircle,
    className: "border-danger/35 bg-danger-soft text-danger",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-warning/35 bg-warning-soft text-warning",
  },
  success: {
    icon: CheckCircle2,
    className: "border-success/35 bg-success-soft text-success",
  },
  info: {
    icon: Info,
    className: "border-line bg-surface-sunken text-ink-soft",
  },
};

export default function Alert({ tone = "info", title, children, className }) {
  const style = STYLES[tone] ?? STYLES.info;
  const Icon = style.icon;

  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-card border px-4 py-3 text-meta", style.className, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        <div className={cn(title && "mt-0.5", tone === "info" ? "text-ink-soft" : "")}>
          {children}
        </div>
      </div>
    </div>
  );
}
