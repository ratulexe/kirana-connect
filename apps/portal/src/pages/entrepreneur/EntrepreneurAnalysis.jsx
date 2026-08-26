import { useEffect } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import Container from "../../components/common/Container.jsx";
import { calculateFinancialPlan } from "../../features/entrepreneur/financialEngine.js";
import { useDemandSupply } from "../../features/entrepreneur/useDemandSupply.js";
import { useMarketReach } from "../../features/entrepreneur/useMarketReach.js";
import { usePriceIntelligence } from "../../features/entrepreneur/usePriceIntelligence.js";
import { identifyBusinessThreats } from "../../features/entrepreneur/threatEngine.js";
import { buildSwotAnalysis } from "../../features/entrepreneur/swotEngine.js";
import { buildAdvisorContext } from "../../features/entrepreneur/buildAdvisorContext.js";
import AnalysisHeader from "../../features/entrepreneur/AnalysisHeader.jsx";
import AnalysisErrorBoundary from "../../components/common/AnalysisErrorBoundary.jsx";
import { ANALYSIS_TABS, DEFAULT_ANALYSIS_TAB, analysisTabId, analysisPanelId } from "../../features/entrepreneur/analysisTabsConfig.js";
import OverviewTab from "../../features/entrepreneur/analysisTabs/OverviewTab.jsx";
import MarketTab from "../../features/entrepreneur/analysisTabs/MarketTab.jsx";
import FinanceTab from "../../features/entrepreneur/analysisTabs/FinanceTab.jsx";
import RisksSwotTab from "../../features/entrepreneur/analysisTabs/RisksSwotTab.jsx";
import AdvisorTab from "../../features/entrepreneur/analysisTabs/AdvisorTab.jsx";
import { loadAnalysisInput } from "../../features/entrepreneur/analysisSessionState.js";

const FALLBACK_LOCATION = { latitude: 0, longitude: 0 };
const FALLBACK_CATEGORY = { slug: "" };
const VALID_TAB_IDS = new Set(ANALYSIS_TABS.map((tab) => tab.id));

export default function EntrepreneurAnalysis() {
  const routerLocation = useLocation();
  // router state lives only in memory, EXCEPT the browser itself persists it
  // per session-history-entry -- a literal address-bar reload can still
  // hand it back (verified live: Chromium does). sessionStorage is the
  // fallback for the rarer case where it truly doesn't (an externally
  // shared link, or a browser that drops it) -- the same inputs that were
  // just submitted, validated before use, never AI chat history (see
  // analysisSessionState.js). A tab switch always re-passes real router
  // state (see handleTabChange below).
  const storedInput = loadAnalysisInput();
  const baseState = routerLocation.state ?? storedInput;
  // workingCapital is the one field that can change AFTER the initial
  // navigation (edited on the Finance tab, see WorkingCapitalPlanner.jsx) --
  // router state is captured once at submit time and never updated after,
  // so on a reload it can hand back a stale (or entirely absent)
  // workingCapital even though sessionStorage has since moved on.
  // sessionStorage is the only place this field is ever written past that
  // first navigation, so it -- not router state -- is authoritative for it.
  const state = baseState ? { ...baseState, workingCapital: storedInput?.workingCapital } : baseState;
  const [searchParams, setSearchParams] = useSearchParams();

  // Hooks must run unconditionally, so every fetch hook is called before the
  // no-state redirect below with harmless placeholder inputs; `enabled`
  // keeps each from actually fetching until real state exists, and the
  // redirect fires before anything would render off the placeholders. This
  // also means every hook here is called exactly once regardless of which
  // analysis tab is active below -- switching tabs is pure presentation
  // state and never triggers a new fetch.
  const hookInputs = {
    location: state?.location ?? FALLBACK_LOCATION,
    radiusKm: state?.radiusKm ?? 5,
    businessCategory: state?.businessCategory ?? FALLBACK_CATEGORY,
    enabled: Boolean(state),
  };
  const demandSupplyState = useDemandSupply(hookInputs);
  const marketReachState = useMarketReach(hookInputs);
  const priceIntelligenceState = usePriceIntelligence(hookInputs);

  const requestedTab = searchParams.get("tab");
  const activeTab = VALID_TAB_IDS.has(requestedTab) ? requestedTab : DEFAULT_ANALYSIS_TAB;

  // CompetitorMap (Leaflet) can mount while its tab is hidden -- every tab
  // panel stays mounted permanently (see below) so moved-in components never
  // refetch on a tab switch, but Leaflet measures its container at mount
  // time and gets 0x0 if that container is `display: none` then. A
  // synthetic resize event is what Leaflet's own trackResize listener
  // already respond to, so this nudges any map that mounted hidden into
  // recalculating its size the moment its tab actually becomes visible,
  // without touching CompetitorMap.jsx itself.
  useEffect(() => {
    if (activeTab !== "market") return;
    window.dispatchEvent(new Event("resize"));
  }, [activeTab]);

  if (!state) return <Navigate to="/entrepreneur" replace />;

  const { location, availableMargin, businessCategory, radiusKm } = state;
  const plan = calculateFinancialPlan(availableMargin);

  // Both deterministic engines run client-side over data already fetched
  // above -- no extra network call for SWOT or threats. threatEngine's
  // output is passed into buildSwotAnalysis unchanged, so the SWOT threats
  // quadrant and the Local Business Risks section can never disagree.
  const { threats, unassessableRisks } = identifyBusinessThreats({
    demandSupplyState,
    financialPlan: plan,
    priceIntelligenceState,
  });
  const swot = buildSwotAnalysis({
    demandSupplyState,
    financialPlan: plan,
    priceIntelligenceState,
    marketReachState,
    threats,
  });

  const advisorContext = buildAdvisorContext({
    location,
    businessCategory,
    radiusKm,
    availableMargin,
    financialPlan: plan,
    demandSupplyState,
    marketReachState,
    priceIntelligenceState,
    threats,
    unassessableRisks,
    swot,
  });

  // Explicitly carries the current router state forward so the report
  // input (location/margin/category/radius) is never lost on a tab switch
  // -- setSearchParams navigates, and a navigation without an explicit
  // state would otherwise drop it, forcing a redirect back to the intake
  // form the next time this page needs it (e.g. after a refresh).
  function handleTabChange(tab) {
    setSearchParams({ tab }, { state });
  }

  const entrepreneurSummary = `${businessCategory?.name ?? "Business"} · ${location?.label ?? location?.query ?? ""} · Within ${radiusKm} km`;

  return (
    <>
      <AnalysisHeader
        businessCategory={businessCategory}
        location={location}
        radiusKm={radiusKm}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <Container>
        {/*
          Every tab panel stays mounted once rendered -- only visibility
          toggles via `hidden`, never a conditional mount/unmount. Some
          moved-in components (CompetitorMapping in particular) fetch inside
          their own useEffect on mount, exactly as they did on the old
          single long page; unmounting and remounting them on every tab
          switch would silently re-trigger those fetches (a real Overpass
          refetch storm was observed and confirmed during testing). Keeping
          them mounted permanently avoids that without touching any moved
          component's internals, matching this milestone's "presentation
          restructuring only" constraint.
        */}
        <div
          id={analysisPanelId("overview")}
          role="tabpanel"
          aria-labelledby={analysisTabId("overview")}
          className={`analysis-tabpanel ${activeTab === "overview" ? "" : "hidden"}`}
        >
          <AnalysisErrorBoundary label="Overview">
            <OverviewTab
              location={location}
              businessCategory={businessCategory}
              radiusKm={radiusKm}
              availableMargin={availableMargin}
              plan={plan}
              demandSupplyState={demandSupplyState}
              onNavigateTab={handleTabChange}
            />
          </AnalysisErrorBoundary>
        </div>

        <div
          id={analysisPanelId("market")}
          role="tabpanel"
          aria-labelledby={analysisTabId("market")}
          className={`analysis-tabpanel ${activeTab === "market" ? "" : "hidden"}`}
        >
          <AnalysisErrorBoundary label="Market">
            <MarketTab
              location={location}
              radiusKm={radiusKm}
              businessCategory={businessCategory}
              marketReachState={marketReachState}
              demandSupplyState={demandSupplyState}
              priceIntelligenceState={priceIntelligenceState}
            />
          </AnalysisErrorBoundary>
        </div>

        <div
          id={analysisPanelId("finance")}
          role="tabpanel"
          aria-labelledby={analysisTabId("finance")}
          className={`analysis-tabpanel ${activeTab === "finance" ? "" : "hidden"}`}
        >
          <AnalysisErrorBoundary label="Finance">
            <FinanceTab plan={plan} analysisInput={state} />
          </AnalysisErrorBoundary>
        </div>

        <div
          id={analysisPanelId("risks")}
          role="tabpanel"
          aria-labelledby={analysisTabId("risks")}
          className={`analysis-tabpanel ${activeTab === "risks" ? "" : "hidden"}`}
        >
          <AnalysisErrorBoundary label="Risks & SWOT">
            <RisksSwotTab threats={threats} unassessableRisks={unassessableRisks} swot={swot} />
          </AnalysisErrorBoundary>
        </div>

        <div
          id={analysisPanelId("advisor")}
          role="tabpanel"
          aria-labelledby={analysisTabId("advisor")}
          className={`print-hide ${activeTab === "advisor" ? "" : "hidden"}`}
        >
          <AnalysisErrorBoundary label="AI Advisor">
            <AdvisorTab context={advisorContext} entrepreneurSummary={entrepreneurSummary} />
          </AnalysisErrorBoundary>
        </div>
      </Container>
    </>
  );
}
