import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "../lib/cn.js";

const TONES = {
  info: { wrap: "border-line bg-surface-sunken text-ink-soft", icon: Info, iconCls: "text-ink-muted" },
  success: { wrap: "border-success/25 bg-success-soft text-ink", icon: CircleCheck, iconCls: "text-success" },
  warning: { wrap: "border-warning/25 bg-warning-soft text-ink", icon: TriangleAlert, iconCls: "text-warning" },
  error: { wrap: "border-danger/25 bg-danger-soft text-ink", icon: CircleAlert, iconCls: "text-danger" },
};

export default function Alert({ tone = "info", title, children, className }) {
  const config = TONES[tone];
  const Icon = config.icon;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-card border px-4 py-3", config.wrap, className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", config.iconCls)} aria-hidden="true" />
      <div className="min-w-0 text-meta">
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5")}>{children}</div> : null}
      </div>
    </div>
  );
}
