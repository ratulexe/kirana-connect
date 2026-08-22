import { cn } from "../../lib/cn.js";

/**
 * Shown when a region has nothing to display, including the error case.
 * An icon plus a plain sentence, never an illustration or an emoji.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}) {
  const isError = tone === "error";

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed px-6 py-12 text-center",
        isError ? "border-danger/35 bg-danger-soft/40" : "border-line bg-surface/60",
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "mb-4 inline-flex size-11 items-center justify-center rounded-pill",
            isError ? "bg-danger-soft text-danger" : "bg-surface-sunken text-ink-muted",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}

      <p className="text-card text-ink">{title}</p>

      {description ? (
        <p className="mt-1.5 max-w-sm text-body text-ink-muted">{description}</p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
