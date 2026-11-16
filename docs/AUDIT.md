# Audit and design decisions — 16 November 2026

## Existing implementation

- Website: `FredProspect/prospect-website`, main at `a82d3d0c017c69ae67a84da48a92cadd6de69df8`. Static HTML, inline CSS, no package manifest, API, database, auth or signup form. `CNAME` identifies `prospectpartnership.co.uk`; deployment-provider configuration is absent. This resembles a Pages deployment but its active hosting was not verified.
- Homepage, product, architecture, company, investor and topic routes presented institutional portfolio/capital-allocation positioning. Existing positioning doctrine conflicts with the current user brief and has been replaced.
- Existing logo, legal entity, founder identity, email and personal LinkedIn were retained from repository sources. No approved founder photo or official company LinkedIn URL was found. No verified launch date, live feature availability, user counts or return statistics.
- Existing HTML was crawlable with canonicals, social metadata, schema, sitemap and robots. Its subject matter was stale. Privacy incorrectly stated no lead-capture forms. No waitlist infrastructure existed in the website repository.
- Trading app reference: `FredProspect/Prospect---MVP`, main `5c5cb78434f4285da9612a19bad5f858fd7c111f`, newer Living UI on staging `30c914652c6c6d6e4f3828cf1d4c14bdcc3611b0`. Read-only inspection; no application, infrastructure or backend edits.
- Living UI frontend uses React/Vite/TypeScript. `frontend/src/design/tokens.css` supplies Geist, emerald `#126747`, light `#F6FAF7`, dark `#091613`, dark accent `#91E6B8`. First-run and builder prototype explicitly state no account connected and AI drafting not connected.

## Reuse and boundaries

Reuse the official logo, two locally hosted Geist weights and their licence, semantic Living UI colours, and two inspected, empty-workspace prototype captures from `ops/evidence/p-lui-15/before/`. Captures show no personal details, positions, return series or connected account. Do not embed the authenticated application or attach the marketing form to trading accounts. Screenshot attribution and exact source paths are in the handoff.

Keep static HTML for an exceptionally small, crawlable marketing surface. Add a separate dependency-free Node 24 server and SQLite store; sharing the app database/auth would unnecessarily couple marketing traffic and trading workflows. Shipping Node hosting is a deployment requirement, not a change to the trading platform. Static-only hosting cannot persist registrations.

## Design direction

A light-first editorial experience with an equally deliberate emerald-dark theme. Oversized language, quiet structural rules, a finite concept animation, real product imagery, a research note, a portfolio-context illustration, one connected intelligence explanation and a text-led founder section. Avoid performance charts and invented numerical results. Hero, sticky navigation and final form all lead to the same signup.

The screenshot controls switch between real prototype screens and accompanying limitations. They are not strategy-generation controls. All capabilities are framed as development aims. The founder monogram is typography, not a fabricated photograph; authentic photography can replace the monogram without changing the surrounding layout.

## Content/keyword plan

Qualitative intent mapping, not search-volume research or a claim of ranking demand:

| Intent | Destination | Treatment |
| --- | --- | --- |
| AI/no-code trading strategy builder; trading strategy software | `/`, `/product/`, `/ai-trading-strategy-builder/` | Describe planned natural-language development and review limitations |
| AI-assisted trading research; backtesting | `/trading-strategy-backtesting/` | Explain costs, data quality and overfitting without implying working tests |
| Strategy monitoring software | `/strategy-monitoring/` | Define evidence and changing behaviour; mark product in development |
| Trading portfolio risk analysis | `/portfolio-risk-management/` | Explain correlation, concentration and common exposure |

No external keyword-volume service or competitor data was used. Informative pages, natural phrasing, transparent availability, real company identity and risk context are the trust strategy. Old institutional routes are retired in place, `noindex,follow`, excluded from the sitemap and linked to the current relevant destination. They do not silently advertise the previous product.
