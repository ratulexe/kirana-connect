export const ANALYSIS_TABS = [
  { id: "overview", label: "Overview" },
  { id: "market", label: "Market" },
  { id: "finance", label: "Finance" },
  { id: "risks", label: "Risks & SWOT" },
  { id: "advisor", label: "AI Advisor" },
];

export const DEFAULT_ANALYSIS_TAB = "overview";

// Shared id builders so the tab button (role="tab") and its panel
// (role="tabpanel") reference each other consistently -- one source of
// truth for both AnalysisHeader.jsx and EntrepreneurAnalysis.jsx.
export const analysisTabId = (tabId) => `analysis-tab-${tabId}`;
export const analysisPanelId = (tabId) => `analysis-panel-${tabId}`;
