import { AlertTriangle, ShieldAlert, ThumbsUp, TrendingUp } from "lucide-react";

const QUADRANTS = [
  { key: "strengths", title: "Strengths", icon: ThumbsUp, accent: "text-success" },
  { key: "weaknesses", title: "Weaknesses", icon: ShieldAlert, accent: "text-warning" },
  { key: "opportunities", title: "Opportunities", icon: TrendingUp, accent: "text-primary" },
  { key: "threats", title: "Threats", icon: AlertTriangle, accent: "text-danger" },
];

/**
 * Every bullet here is {title, evidence, source} from swotEngine.js -- an
 * empty quadrant says so plainly rather than being padded with generic
 * business advice, per this milestone's own instruction.
 */
export default function EvidenceBasedSwot({ swot }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {QUADRANTS.map(({ key, title, icon: Icon, accent }) => {
        const items = swot[key];
        return (
          <div key={key} className="rounded-card border border-line bg-surface p-4">
            <p className={`flex items-center gap-2 text-meta font-semibold ${accent}`}>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {title}
            </p>
            {items.length > 0 ? (
              <ul className="mt-2.5 grid gap-2.5">
                {items.map((entry) => (
                  <li key={entry.title} className="text-meta">
                    <p className="font-semibold text-ink">{entry.title}</p>
                    <p className="mt-0.5 text-ink-soft">{entry.evidence}</p>
                    <p className="mt-0.5 text-ink-muted">Source: {entry.source}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2.5 text-meta text-ink-muted">
                {key === "opportunities" ? "No supported opportunity signal identified yet." : "No supported conclusion yet."}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
