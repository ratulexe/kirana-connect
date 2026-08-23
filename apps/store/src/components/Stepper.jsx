/**
 * Wizard progress. An ordered list rather than decorative divs, with
 * aria-current marking the active step.
 */
export default function Stepper({ steps, currentIndex }) {
  return (
    <nav aria-label="Registration progress">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {steps.map((label, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-meta font-semibold",
                  isCurrent
                    ? "bg-primary text-primary-fg"
                    : isDone
                      ? "bg-primary-soft text-primary"
                      : "bg-surface-sunken text-ink-muted",
                ].join(" ")}
              >
                <span className="tabular-nums">{index + 1}</span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
              </span>
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className="h-px w-3 bg-line sm:w-5" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
