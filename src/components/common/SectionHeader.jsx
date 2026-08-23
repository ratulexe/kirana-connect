import { cn } from "../../lib/cn.js";

/**
 * Consistent heading block for page sections. `action` takes a link or button
 * rendered opposite the title.
 */
export default function SectionHeader({ title, description, action, className, id }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-2", className)}>
      <div className="max-w-2xl">
        <h2 id={id} className="text-section text-ink">
          {title}
        </h2>
        {description ? <p className="mt-1.5 text-body text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
