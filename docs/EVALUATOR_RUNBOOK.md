# Kirana Connect — Evaluator Runbook

A 7–10 minute walkthrough for demonstrating Kirana Connect to SIH evaluators. No credentials are
included in this document — see "Pre-demo checklist" for how to get them.

## 30-second elevator pitch

Kirana Connect helps a customer find which nearby kirana stores actually stock a product, compare
real prices, and reserve an item for pickup — no delivery, no cart, no payment. Every consumer
search becomes first-party demand evidence. That evidence, combined with participating-store
supply, mapped competitors, and observed local prices, feeds a deterministic financial engine
built directly from the SIH scheme parameters (Micro Finance and Term Loan), so a first-time
entrepreneur gets a grounded market and financing report — explained in plain language, in
English, Bengali, or Hindi, by an AI advisor that is only allowed to talk about numbers the
deterministic engines already calculated.

## Recommended browser tabs (open before the demo starts)

1. **Consumer app** — the shopper-facing site.
2. **Store Portal** — signed in as the demo store account.
3. **Business Portal (Gateway)** — the entrepreneur advisory tool.
4. **Admin Portal** — signed in as the demo admin account (open, but only needed if a judge asks
   about catalogue governance).

Use whichever URL your deployment currently points to for each app — see the README's
"Applications" table for the current production domains, and confirm they're live before the demo
(see pre-demo checklist).

## Demo sequence

### Part 1 — Consumer discovery and reservation (≈3 min)

1. On the Consumer homepage, search for a real stocked product (e.g. "toothpaste" or "milk").
   **Expected**: results appear with per-store price, distance, and stock state; no page reload
   between typing and results.
2. Open a product with 2+ store offers. **Expected**: side-by-side price comparison, "Go to
   store" (opens directions), and a "Reserve" button on stores that track exact stock.
3. Click **Reserve** on an offer while signed out. **Expected**: a sign-in prompt opens, not a
   dead end — after signing in, you land back on the exact same product page.
4. Sign in, click Reserve again, choose a pickup window (e.g. today, a 2-hour window).
   **Expected**: a success panel with an animated checkmark, a `KC-####` code, the store, pickup
   window, and a "valid until" time (pickup end + 1 hour, computed server-side — never trust a
   client-supplied expiry).
5. Open **My Reservations** (nav bar). **Expected**: the reservation appears as Active, with
   Directions and a "Can't make it? Release" option.

**What this proves**: the reservation is a real inventory hold, not a fake frontend toggle — the
next store visitor genuinely sees reduced availability.

### Part 2 — Store Portal collection (≈2 min)

6. Switch to the Store Portal tab, already signed in as the store that owns the reservation you
   just created. Open **Reservations**. **Expected**: the active reservation appears, but the
   `KC-####` code is **not shown** — only the product and pickup window.
7. Explain: the code is a pickup-verification secret the *customer* states out loud at the
   counter — it's deliberately hidden from the list so staff can't just tap "collected" without
   asking. Click "Verify & mark collected," type the code you noted in step 4.
   **Expected**: collection succeeds, physical stock decrements by exactly one unit, the
   reservation disappears from the Active list.

**What this proves**: last-unit safety and pickup-code verification are enforced by the backend,
not just displayed by the UI.

### Part 3 — Business Portal / Entrepreneur Advisory (≈4 min)

8. Go to the Business Portal Gateway, choose **Entrepreneur**. Enter a real place (e.g. "Singur,
   West Bengal"), pick a business category, enter an available margin (e.g. ₹14,000 — this lands
   exactly on the ₹1.40 lakh Micro Finance boundary, a good number to demo the scheme-routing
   logic with). Submit.
9. Walk the tabs of the generated report:
   - **Overview** — the Opportunity Score and its methodology explanation (40% demand / 25%
     supply / 20% competition / 15% financial fit, stated plainly, never called a "success
     probability").
   - **Market** — Demand & Supply Gap (labeled as prototype-observed search activity, not
     audited market research), Competitor Mapping (a live map), Local Product Market Value.
   - **Finance** — the matched scheme (Micro Finance at this margin), the funding gap, and the
     quarterly repayment schedule (labeled "illustrative," never "official").
   - **Risks & SWOT** — every item has a one-line evidence source; empty quadrants say so
     honestly rather than being padded with generic advice.
10. Open **AI Advisor**, ask something like *"Explain my funding gap in simple terms"* in English,
    then switch the language selector to Bengali or Hindi and ask again. **Expected**: a grounded
    answer citing the same numbers already on screen, in the selected language.
11. **Optional, if a judge is technical**: ask the advisor *"Guarantee this business will
    succeed"* or *"What's the population here?"* live. **Expected**: it refuses and explains why
    (population unavailable, no guarantees given) rather than inventing an answer.

### Part 4 — Admin governance (optional, ≈1 min, only if time/interest remains)

12. Admin Portal → Stores → show a pending store application → Approve. Or Categories →
    Homepage Moments → show the image-upload workflow for the consumer homepage's mood cards.

## If something fails mid-demo

- **Backend/API unreachable**: the frontend shows an explicit "couldn't load" state, not a blank
  white screen or a raw error — say so and move to a different tab/section while it recovers, or
  fall back to describing the flow using this document's screenshots-in-words.
- **Geoapify (location autocomplete) down**: typing a location still works — autocomplete just
  won't suggest matches; you can still submit a typed location manually.
- **Overpass/OSM (competitor mapping) slow or down**: the Market tab shows an explicit "external
  map coverage unavailable" note rather than an empty map with no explanation — narrate that this
  is honest degraded-state handling, not a bug.
- **Gemini (AI Advisor) unavailable or key missing**: the Advisor tab shows "AI Business Advisor
  is not configured on this environment" — the rest of the report is completely unaffected, which
  is itself worth pointing out (the AI is decoupled from the deterministic engines by design).
- **A reservation is already collected/expired from a previous run**: just create a fresh one —
  the flow takes under a minute.

## What NOT to claim

- Do not call the AI advisor "RAG" — it is grounded structured context sent to Gemini, not a
  runtime document-retrieval pipeline.
- Do not say population or purchasing-power data is used anywhere — it isn't; say so plainly if
  asked.
- Do not call the repayment schedule "official" or "the sanctioned schedule" — it's an
  illustrative estimate based on one explicit, documented interest-treatment assumption, because
  the problem statement doesn't specify that detail.
- Do not call the Opportunity Score a success/profitability/loan-approval probability.
- Do not claim government datasets are used — none are integrated.
- Do not claim "all nearby competitors" — only mapped ones, dependent on OpenStreetMap coverage.
- Do not call this "production ready" — "working prototype" is accurate and defensible.

## Likely judge questions and concise answers

- **"Is this real inventory or a demo toggle?"** — Real. Reservations are Postgres-atomic holds
  (`SELECT ... FOR UPDATE`) against actual store stock; two simultaneous reservation attempts for
  the last unit were tested and only one ever succeeds.
- **"What happens if a reservation isn't picked up?"** — It expires automatically. Availability
  is computed live as `stock − active unexpired reservations`, so an expired hold stops counting
  the instant it passes its expiry time, even before any cleanup job has run.
- **"Where does the market data come from?"** — Two first-party sources (real Consumer searches,
  real participating-store prices) plus one external source (OpenStreetMap, for competitor
  mapping). No government dataset is integrated in this prototype.
- **"How do you know the financial numbers are correct?"** — They're a pure deterministic
  function of the two scheme parameter sets from the problem statement, tested at every stated
  boundary (₹1.40L, ₹50L, the ₹1.25L and ₹45L caps) — this was verified this same audit, not just
  asserted.
- **"Is the AI making financial decisions?"** — No. It only explains numbers the deterministic
  engines already computed; it cannot recalculate or override them, and it's whitelisted to only
  see already-computed report fields, never asked to do arithmetic itself.
- **"What's not finished?"** — Voice, a verified population/purchasing-power dataset, and a
  general operational-cost planner (the narrower Working Capital Planner exists). All stated
  explicitly in the README's Prototype Limitations section rather than hidden.

## Known limitations (say these proactively if asked, don't wait to be caught out)

- Population and purchasing-power data are not available from any integrated source.
- Competitor mapping depends on OpenStreetMap coverage, not a verified census.
- Demand evidence is prototype-scale platform search activity, not audited market research.
- Repayment moratorium-interest treatment is one explicit, labeled modeling assumption.
- Voice is not implemented.

## Backup demo data

If live location/category selection is slow or a judge wants a guaranteed result, use
**"JIS University, Agarpara, Kolkata"** as the location and **Stationery** as the business
category — a real, pre-loaded scenario with genuine local competition already in place: two
existing stores (Sodepur Super Bazar, Kamarhati Stationery House) plus a demo store, **JIS Campus
Stationery Corner**, sitting ~300m from the university with real notebooks/pens/stationery
stocked. Use a margin of exactly ₹14,000 for a clean Micro Finance boundary demonstration.

For the Consumer app, the `demo-admin@gmail.com` account already has this exact address saved
(label "JIS University, Agarpara") — selecting it instantly shows the same three-store comparison
for any stocked stationery item. One item — Camlin Eraser at JIS Campus Stationery Corner — is
deliberately left at quantity 1 for an instant, guaranteed last-unit reservation demo with no
setup needed.

## Pre-demo checklist

- [ ] Confirm each app's production URL is currently live (open each tab, check it loads, before
      evaluators arrive).
- [ ] Confirm demo credentials for Admin and Store Portal — get these from your team lead, not
      from this document or the README (neither publishes passwords, by design).
- [ ] Do one full run-through of Part 1–3 in the actual deployed environment (not just localhost)
      within the hour before the demo, to catch any environment-specific issue.
- [ ] Have a fallback product/location ready in case the first attempt hits an external-provider
      hiccup (Geoapify/Overpass/Gemini).
- [ ] Confirm `AI_ADVISOR_API_KEY` and `GEOAPIFY_API_KEY` are set in the deployed backend's
      environment — an evaluator asking about AI or location search with a missing key still
      degrades gracefully, but a working key makes a stronger demo.
