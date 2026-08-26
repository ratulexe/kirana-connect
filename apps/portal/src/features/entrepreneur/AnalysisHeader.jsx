import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import { cn } from "../../lib/cn.js";
import { ANALYSIS_TABS, analysisTabId, analysisPanelId } from "./analysisTabsConfig.js";

/**
 * Real WAI-ARIA tabs, not decorated links: content stays mounted and only
 * visibility toggles (see EntrepreneurAnalysis.jsx), which is exactly the
 * show/hide-panel model the tabs pattern describes -- so tablist/tab/
 * tabpanel with a roving tabindex and arrow-key activation is the correct
 * fit here, not a set of navigation links to five different pages.
 */
function handleTabListKeyDown(event, currentIndex, onTabChange) {
  const lastIndex = ANALYSIS_TABS.length - 1;
  let nextIndex = null;

  if (event.key === "ArrowRight") nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
  else if (event.key === "ArrowLeft") nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = lastIndex;
  else return;

  event.preventDefault();
  const nextTab = ANALYSIS_TABS[nextIndex];
  onTabChange(nextTab.id);
  // Move focus to the newly active tab once it re-renders with tabIndex 0.
  // A plain timer, not requestAnimationFrame: rAF is tied to the paint/
  // compositor pipeline, which stalls indefinitely on a backgrounded or
  // non-compositing tab (confirmed during testing) -- a 0ms timer only
  // needs the JS event loop to have a free tick, which the DOM update from
  // onTabChange above already guarantees by the time it runs.
  setTimeout(() => document.getElementById(analysisTabId(nextTab.id))?.focus(), 0);
}

/**
 * The analysis workspace's own sticky sub-header: business/location summary
 * plus tab navigation. Sits right below EntrepreneurHeader (which is
 * sticky top-0 h-16), so this docks at top-16. Full-bleed background via its
 * own wrapper outside the page's Container, with an inner Container so the
 * content lines up with everything else on the page.
 *
 * Switching tabs never refetches anything -- see EntrepreneurAnalysis.jsx,
 * which calls every data hook unconditionally regardless of which tab is
 * active. onTabChange is expected to update the ?tab= query param while
 * preserving router state, not to trigger new work itself.
 */
export default function AnalysisHeader({ businessCategory, location, radiusKm, activeTab, onTabChange }) {
  return (
    <div className="print-hide sticky top-16 z-30 border-b border-line bg-surface/95 backdrop-blur-xl">
      <Container className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {/*
            Wraps rather than truncates: a resolved address like "Agarpara,
            Nilgunj Road, Sodepur, Kamarhati - 700058, WB, India" is the
            entrepreneur's own confirmation of what is being analysed, so
            clipping it mid-word hides the thing they most need to verify.
          */}
          <p className="min-w-0 text-meta break-words text-ink-muted">
            <span className="font-semibold text-ink">Kirana Connect Business Advisory</span>
            {" · "}
            {businessCategory?.name ?? "Business"}
            {" · "}
            {location?.label ?? location?.query ?? "Location"} · {radiusKm} km
          </p>
          <Link
            to="/entrepreneur"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-control py-1 text-meta font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Edit details
          </Link>
        </div>

        <div
          role="tablist"
          aria-label="Analysis sections"
          className="mt-2.5 -mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ANALYSIS_TABS.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              id={analysisTabId(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={analysisPanelId(tab.id)}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleTabListKeyDown(event, index, onTabChange)}
              className={cn(
                "shrink-0 rounded-control px-3.5 py-2 text-meta font-semibold whitespace-nowrap transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                activeTab === tab.id
                  ? "bg-primary text-primary-fg"
                  : "text-ink-soft hover:bg-surface-sunken hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Container>
    </div>
  );
}
