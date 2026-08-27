# Problem Statement Traceability Matrix

Audit date: 2026-08-27. Produced as part of the final release-candidate audit. Every row was
checked against the actual code and, where practical, verified by running the deterministic
engines directly or exercising the live API — not inferred from documentation or UI screenshots
alone. See `docs/FINAL_EVALUATION_REPORT.md` for the executed test log.

Status values: **PASS** (implemented and verified), **PARTIAL** (implemented but with a real gap),
**NOT IMPLEMENTED**, **NOT REQUIRED** (out of scope for this prototype milestone).

---

## Entrepreneur inputs

| # | Requirement | Status | Implementation | Evidence | Demo route | Data source | Limitation |
|---|---|---|---|---|---|---|---|
| 1 | Location input (Village/Block/District or equivalent) | PASS | Free-text location field with geocoded autocomplete | `apps/portal/src/pages/entrepreneur/EntrepreneurHome.jsx`, `server/src/routes/entrepreneur.routes.js` (`GET /entrepreneur/location-suggestions`) | `/entrepreneur` | Geoapify (autocomplete) + free text fallback | Suggestions depend on Geoapify; manual text entry still works if unavailable (see #38 in report) |
| 2 | Margin input | PASS | `availableMargin` field, Zod-validated `.positive()`, capped at ₹10 crore | `apps/portal/src/features/entrepreneur/schemas.js:34-40` | `/entrepreneur` | User input | — |
| 3 | Business category input | PASS | Live dropdown from `business_categories` table, with a documented static fallback list if the fetch fails | `apps/portal/src/features/entrepreneur/schemas.js:15-23`, `server/src/routes/businessCategories.routes.js` | `/entrepreneur` | First-party `business_categories` table | Fallback list only used if the live fetch fails |

## Financial engine (Module 2)

| # | Requirement | Status | Implementation | Evidence | Demo route | Data source | Limitation |
|---|---|---|---|---|---|---|---|
| 4 | Micro Finance scheme calculation | PASS | Deterministic `calculateFinancialPlan()` | `apps/portal/src/features/entrepreneur/financialEngine.js:26-35` | `/entrepreneur/analysis?tab=finance` | Pure function, no external data | — |
| 5 | Term Loan scheme calculation | PASS | Same engine, second scheme entry | `financialEngine.js:36-44` | same | same | — |
| 6 | Exact ₹1.40 lakh boundary | PASS — verified by direct execution | `margin=14,000` → projectCost=₹1,40,000 (Micro); `margin=14,000.10` → projectCost=₹1,40,001 (Term Loan) | Boundary test run this audit, see report | same | — | — |
| 7 | 90% agency contribution | PASS | `AGENCY_SHARE_PERCENTAGE = 90` | `financialEngine.js:19,81,104` | same | — | — |
| 8 | ₹1.25 lakh Micro cap | PASS — verified | `margin=14,000` → potential 90% = ₹1,26,000, capped `eligibleLoan` = ₹1,25,000, `fundingGap` = ₹1,000 | Boundary test run this audit | same | — | — |
| 9 | ₹45 lakh Term Loan cap | PASS | `maxLoanAmount: 4_500_000` | `financialEngine.js:43` | same | — | — |
| 10 | 6.5% Micro rate | PASS | `interestRateAnnual: 6.5` | `financialEngine.js:30` | same | — | — |
| 11 | 8% Term Loan rate | PASS | `interestRateAnnual: 8` | `financialEngine.js:39` | same | — | — |
| 12 | 3-year Micro tenure incl. moratorium | PASS — verified | `calculateRepaymentPlan()` produced exactly 12 total quarters | Repayment test run this audit | same | — | — |
| 13 | 7-year Term tenure incl. moratorium | PASS — verified | Produced exactly 28 total quarters | Repayment test run this audit | same | — | — |
| 14 | 3-month Micro moratorium | PASS — verified | 1 moratorium quarter, 11 repayment quarters | Repayment test run this audit | same | — | — |
| 15 | 6-month Term moratorium | PASS — verified | 2 moratorium quarters, 26 repayment quarters | Repayment test run this audit | same | — | — |
| 16 | Quarterly repayment schedule | PASS | Full quarter-by-quarter schedule table with opening/closing balance, interest, principal | `repaymentEngine.js`, `RepaymentSchedule.jsx` | same | — | Moratorium-interest treatment (capitalized, reducing-balance) is the problem statement's one genuinely unspecified detail — see limitation below |
| 17 | Funding gap calculation | PASS — verified | `fundingGap = max(projectCost - margin - eligibleLoan, 0)` | `financialEngine.js:107` | same | — | — |
| 18 | Operational cost planner | NOT IMPLEMENTED | No operational-cost-planning module found in the codebase | — | — | — | Working Capital Planner (#19) is a distinct, narrower tool; a general operating-cost planner is not built |
| 19 | Working capital planner | PASS | User-entered monthly rent/staff/utilities/other + initial inventory, plus a reserve-months multiplier | `apps/portal/src/features/entrepreneur/WorkingCapitalPlanner.jsx` | `/entrepreneur/analysis?tab=finance` | User input, arithmetic only | Explicitly not a profitability analysis (own copy states this) |

## Market intelligence (Module 1)

| # | Requirement | Status | Implementation | Evidence | Demo route | Data source | Limitation |
|---|---|---|---|---|---|---|---|
| 20 | Market Reach | PARTIAL | Geographic reach (radius, area) is real and computed; population estimate is a permanent stub | `server/src/services/marketReach.service.js`, `population.service.js:33-42` | `/entrepreneur/analysis?tab=market` | Geographic math (first-party) + population (unavailable) | Population is never fabricated — always reports `status: "unavailable"` with a documented reason (no reliable India-covering radius-queryable free source exists) |
| 21 | Demand/supply evidence | PASS | Category-linked Consumer search activity vs. participating-store catalogue coverage | `server/src/services/demandSupply.service.js` | `/entrepreneur/analysis?tab=market` | First-party `consumer_search_events` + `store_products` | This is prototype-observed platform search activity, not audited external market research — see #36 |
| 22 | Opportunity Analysis / score | PASS | `computeOpportunity()`, weighted 4-component score | `apps/portal/src/features/entrepreneur/feasibilityEngine.js:22-27` | `/entrepreneur/analysis?tab=overview` | Derived from #21, #24, #25, financial engine | Withheld entirely (not partially computed) when any component's underlying data is missing — see #23 |
| 23 | Opportunity Score methodology transparency | PASS | Exact weights (40/25/20/15) and every component's formula are documented in-code and restated verbatim in the Overview tab's methodology panel; a missing component withholds the whole score rather than being treated as zero or being silently renormalized | `feasibilityEngine.js:9-13,152-157,202-227`, `OverviewTab.jsx` methodology bullets | `/entrepreneur/analysis?tab=overview` | — | — |
| 24 | Competitor mapping | PASS | First-party Kirana Connect stores + OpenStreetMap (Overpass) businesses, deduplicated (first-party wins on a match) | `server/src/services/competitors.service.js:110-174` | `/entrepreneur/analysis?tab=market` | First-party `stores` + OpenStreetMap via Overpass | Mapped competitors, not a verified census of every real competitor — coverage depends on OSM data quality in the area (see #24 distinction below) |
| 25 | Local price intelligence / Product Market Value | PASS | Min/max/median/spread computed only from real participating-store listings; a 1-store observation is explicitly labeled "(1 store observed, not a range)", never presented as a market range | `server/src/services/priceIntelligence.service.js`, `LocalProductMarketValue.jsx:40-48` | `/entrepreneur/analysis?tab=market` | First-party `store_products.selling_price` | Never infers procurement cost, margin, or profitability — explicitly disclaimed in the UI |
| 26 | Threats | PASS | Every threat item traces to one real computed condition; no severity rating is invented (severity stays `null`, documented as "no defensible methodology yet") | `apps/portal/src/features/entrepreneur/threatEngine.js` | `/entrepreneur/analysis?tab=risks` | Demand/supply, price, financial data | — |
| 27 | SWOT | PASS | Every strength/weakness/opportunity item traces to one real `if` condition with a named evidence source; threats quadrant reuses threatEngine's output verbatim (never re-derived, so it can't disagree) | `apps/portal/src/features/entrepreneur/swotEngine.js` | `/entrepreneur/analysis?tab=risks` | Same as #22/#24/#25/financial engine | Empty quadrant shows "No supported conclusion yet" rather than generic advice |

## AI Advisor

| # | Requirement | Status | Implementation | Evidence | Demo route | Data source | Limitation |
|---|---|---|---|---|---|---|---|
| 28 | Multilingual AI advisor | PASS | Server-enforced language whitelist, three full languages | `server/src/utils/validateAdvisorContext.js:253,281` | `/entrepreneur/analysis?tab=advisor` | Gemini (google-genai), server-side key | — |
| 29 | English | PASS — verified live | 5 adversarial prompts answered correctly this audit (see report) | — | same | — | — |
| 30 | Bengali | PASS (code-verified) | `bn` in the language whitelist, full localized system-instruction template | `advisor.service.js` `LANGUAGE_NAMES`, `apps/portal/.../advisorLanguages.js` | same | — | Not live-tested with a Bengali prompt this audit pass (English-only red-team was run); language routing itself is identical code for all three languages |
| 31 | Hindi | PASS (code-verified) | `hi` in the language whitelist | same | same | — | Same as #30 |
| 32 | Grounded AI safeguards | PASS — verified live | 5/5 adversarial prompts (guarantee success, invent population, invent supplier costs, claim 80% success rate, "ignore the report") were correctly refused with citations to real report fields | `server/src/services/advisor.service.js` system-instruction guardrails | same | — | — |
| 33 | Explainability / evidence labels | PASS | Every deterministic section has a named "Source:" label; AI answers cite the same section names | swotEngine.js, threatEngine.js, advisor.service.js `formatReportContext` | throughout Business Portal | — | — |

## Data source honesty

| # | Requirement | Status | Implementation | Evidence | Demo route | Data source | Limitation |
|---|---|---|---|---|---|---|---|
| 34 | Government / open-data claims | NOT REQUIRED | No government dataset is integrated, and none is claimed anywhere in code or copy (verified by full-repo search) | — | — | — | If a judge asks "do you use government data," the honest answer is no — only OpenStreetMap (community-maintained, not a government source) |
| 35 | First-party store data | PASS | `stores`, `store_products` tables, populated by real Store Portal onboarding + inventory management | `supabase/migrations/20260822102000_initial_schema.sql` | Store Portal | First-party | — |
| 36 | First-party demand/search data | PASS | `consumer_search_events`, one row per distinct debounced search term, no PII (no `user_id` column), coordinates coarsened to ~111 m | `supabase/migrations/20260825140000_consumer_search_events.sql` | Consumer app search | First-party | This is prototype-scale platform usage, not audited third-party market research — the UI and this document both call it "prototype-observed search activity," never "market demand" |
| 37 | Scalable district-first architecture | PARTIAL | The data model (business categories, product-category mappings, radius-based queries) is district/locality-agnostic and works today at any scale of participating stores; there is no district-level rollout tooling, no seeded multi-district dataset, and no capacity/load testing performed | Schema design throughout `supabase/migrations/` | — | — | Architecture supports it; operational scaling to a real district rollout is unproven, not benchmarked |

## Claims explicitly audited and found NOT overstated

| Claim | Finding |
|---|---|
| Voice | **NOT IMPLEMENTED.** No voice/speech code found anywhere in the repo. Not claimed anywhere in the UI or README. |
| RAG | **NOT RAG.** No vector store, embedding index, or runtime document retrieval exists. The AI receives a fixed, whitelisted block of already-computed report fields (structured context) plus the user's question — a prompt-engineering pattern, not retrieval-augmented generation. This document and the README describe it as "structured grounded context + Gemini," never as RAG. |
| Government data | **Not integrated.** No government dataset is read anywhere in the code. |
| Population | **Unavailable**, honestly labeled everywhere it would otherwise appear (see #20). |
| Purchasing power | **Not measured anywhere in this system** — this exact sentence appears in the AI's own system prompt and in the Overview tab's methodology text, so the AI is instructed to say so if asked rather than invent a figure (verified live in the red-team pass). |
| Demand vs. audited market demand | Distinguished consistently: UI and code comments call it "prototype observed Consumer Platform search activity... not audited historical market demand" (`DemandSupplyGap.jsx:83-85`). |
| Supply vs. total market supply | Distinguished: "participating Kirana Connect stores," never "all local supply." |
| Competitors vs. verified stocking competitors | Distinguished: "mapped competitors" (OpenStreetMap coverage), with an explicit UI caveat when external map coverage was unavailable at analysis time. |
