import LocalBusinessRisks from "../LocalBusinessRisks.jsx";
import EvidenceBasedSwot from "../EvidenceBasedSwot.jsx";

/**
 * Presentation restructuring only -- LocalBusinessRisks and
 * EvidenceBasedSwot are unchanged components, moved here. threats/
 * unassessableRisks/swot are computed once in EntrepreneurAnalysis.jsx from
 * threatEngine.js and swotEngine.js and passed straight through, so this
 * tab can never disagree with itself.
 */
export default function RisksSwotTab({ threats, unassessableRisks, swot }) {
  return (
    <div className="py-8 sm:py-10">
      <h1 className="text-heading text-ink">Risks &amp; SWOT</h1>
      <p className="mt-2 max-w-2xl text-body text-ink-muted">
        Risks identified from structured evidence, and an evidence-based SWOT -- no AI-generated opinions, no
        severity ratings without a documented methodology.
      </p>

      <section aria-labelledby="local-risks-heading" className="mt-8">
        <h2 id="local-risks-heading" className="text-section text-ink">
          Local Business Risks
        </h2>
        <p className="mt-1.5 text-body text-ink-muted">
          Risks identified from structured evidence above -- no severity ratings, since this project has no
          documented methodology for that yet.
        </p>
        <LocalBusinessRisks threats={threats} unassessableRisks={unassessableRisks} />
      </section>

      <section aria-labelledby="swot-heading" className="mt-10">
        <h2 id="swot-heading" className="text-section text-ink">
          Evidence-based SWOT
        </h2>
        <p className="mt-1.5 text-body text-ink-muted">
          Partial evidence -- generated entirely from the structured data above, not an AI-written opinion.
        </p>
        <EvidenceBasedSwot swot={swot} />
      </section>
    </div>
  );
}
