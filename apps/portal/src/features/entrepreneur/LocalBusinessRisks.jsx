import { CircleHelp, TriangleAlert } from "lucide-react";
import EmptyState from "../../components/common/EmptyState.jsx";

function RiskCard({ risk }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-meta font-semibold text-ink-soft">
        <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
        {risk.title}
      </p>
      <p className="mt-1.5 text-body text-ink">{risk.evidence}</p>
    </div>
  );
}

/**
 * Renders threatEngine.js's output directly -- no severity colors, since
 * this project has no documented methodology for rating severity yet.
 * Evidence is the only thing shown.
 */
export default function LocalBusinessRisks({ threats, unassessableRisks }) {
  return (
    <div className="mt-5">
      {threats.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {threats.map((threat) => (
            <li key={threat.code}>
              <RiskCard risk={threat} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={CircleHelp}
          title="No supported risk evidence yet"
          description="Not enough structured evidence is currently available to identify specific local business risks."
        />
      )}

      {unassessableRisks.length > 0 ? (
        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 text-card text-ink">
            <CircleHelp className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            Risks needing more data
          </h3>
          <ul className="mt-2 grid gap-1.5">
            {unassessableRisks.map((risk) => (
              <li key={risk.code} className="flex items-start gap-2 text-meta text-ink-soft">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink-muted" aria-hidden="true" />
                {risk.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
