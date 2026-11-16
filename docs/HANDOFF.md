# Prospect website — visual rebuild and release

## Design

The second implementation replaces the basic first pass with a cinematic emerald hero, an animated mathematical landscape, an illuminated brand instrument, editorial typography, a grid-backed product stage, an illustrated research note, shared-exposure graphics, animated intelligence paths, portrait-led founder story, framed signup form and oversized outline footer lettering. Native canvas and CSS provide the graphics without a rendering dependency. The landscape is expressly a concept, never market data or trading results.

The canvas caps resolution and frame rate, stops when offscreen or the tab is hidden, and renders a static composition for reduced-motion users. Reveal animations run once. All meaningful content remains available without graphics or animation. Light and dark themes have deliberate colour choices; the hero and closing sections retain the cinematic dark treatment in both.

Official complete logo lockups and marks are copied unchanged from the Living UI brand pack (`frontend/public/brand/Prospect_{lockup,mark}_{light,dark}.png`). The former typed wordmark and CSS inversion are removed. Fred's authentic headshot is extracted unchanged from the existing *Prospect - Founder Profile - Investor Ready 2026.pdf*, image 17 / 509×637, visually verified to match the photograph supplied in this conversation. It replaces the monogram placeholder. No generated face, quotation, bio or achievement was added.

## Architecture and routes

Static HTML remains crawlable, generated from `scripts/pages.mjs` and `scripts/build.mjs`; `assets/site.css`, `site.js` and `field.js` implement the experience. The entire prior route inventory remains reachable. Current pages are `/`, `/product/`, `/about/`, `/insights/`, `/ai-trading-strategy-builder/`, `/trading-strategy-backtesting/`, `/strategy-monitoring/`, `/portfolio-risk-management/`, `/privacy/`, `/terms/`, `/cookies/`, `/accessibility/`, plus 404, robots, sitemap and llms.txt. Previous institutional topic/investor routes carry non-indexed transition notices and links to current destinations.

The existing domain remains the canonical public site. GitHub Pages serves its static root. A separate Railway service serves the same site and its waitlist collector; `deployment.json` declares the public collector URL. The browser uses an explicit HTTPS endpoint with exact-origin CORS preflight checks. Only the canonical public origin and the dedicated Railway site origin are accepted. No wildcard or credentialed cross-origin access is enabled. The separate trading application and its two existing Railway services are unchanged.

## Waitlist and privacy

A dependency-free Node 24 server stores registrations in SQLite on a private 500 MB Railway volume. Unique normalised email, signup time, versioned consent and consent time, and limited sanitised source attribution are retained. No trading details or unnecessary names are collected. Success follows committed persistence; duplicates receive the same response without changing original consent. Failures never report a successful signup.

Protection includes browser/server validation, explicit unchecked consent, honeypot, 2 KiB body limit, request timeout, exact allowed origins, JSON-only requests and a durable eight-attempt/15-minute rate limit. Railway's documented `X-Real-IP` header identifies the network address when `TRUST_PROXY=1`; raw addresses are HMAC-hashed before entering the rate-limit table. Expired hashes are removed on the next request. Operational logging records only a saved/duplicate event, never addresses or request payloads. Use provider-level controls if distributed abuse emerges.

The runtime initialises the mounted directory and drops to UID/GID 1000 before serving traffic. Database permissions are 0600; directory permissions 0700. Only `dist/` is served. There is no public admin/export route and no client-side database secret. Source and Docker context exclude runtime data and secrets. Signup uses POST even without JavaScript, avoiding emails in URLs; submission requires JavaScript and the page offers an email alternative.

No automatic marketing email, confirmation email or double opt-in is represented as configured. Handle consent withdrawal at the founder's email; review retention annually and remove records when no longer needed or consent is withdrawn. Privacy names GitHub Pages/Railway and identifies potential international processing. The operator remains responsible for provider agreements, backup/access controls and the actual communication process.

### Authorised export

From an authorised Railway service shell (or a restricted copy/restore of its database):

```sh
umask 077
WAITLIST_DB=/var/lib/prospect/waitlist.sqlite node scripts/export-waitlist.mjs > /private/path/waitlist.csv
```

The CSV quotes/escapes fields and neutralises formula prefixes. Exports contain personal data: restrict access, do not attach them to issues/logs/PRs, and delete stale copies. Use SQLite's online backup facility for consistent backups; do not copy a live database without its WAL. Apply access, erasure and withdrawal requests to appropriate exports/backups as well as the live store. Never delete the volume to roll back a visual release.

## Deployment configuration

Dedicated service: `prospect-public-website`, `c49a5ab1-2137-4b02-8153-748622558f8a`, inside the existing Prospect Staging project/environment. This is a separate public website service; the project/environment's historical name does not imply access restrictions. Volume `prospect-waitlist-data`, `4a673e5a-6d03-44e0-81bf-3fa07ba0fc21`, mounts at `/var/lib/prospect`.

Variables configured through Railway secrets/settings: `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=3000`, `WAITLIST_DB=/var/lib/prospect/waitlist.sqlite`, a generated private `WAITLIST_RATE_SECRET`, `PUBLIC_ORIGIN=https://prospectpartnership.co.uk`, `ADDITIONAL_PUBLIC_ORIGIN=https://prospect-public-website-staging.up.railway.app`, `TRUST_PROXY=1`, `LOG_WAITLIST_EVENTS=1`. Secret values are never committed. `TRUST_PROXY=1` is only for the exclusive Railway edge and uses its documented overwritten X-Real-IP header.

The Dockerfile builds static output with Node 24 and starts via `scripts/start.mjs`. Run one replica with local SQLite. Ephemeral/multi-replica deployments require a shared durable database and shared rate limits. The frontend's `deployment.json` is public routing configuration, not a credential. A static-only host must retain that collector configuration; pointing it back to `/api/waitlist` on GitHub Pages would break persistence.

For future releases: edit sources, build, lint/test, review generated HTML, push the feature branch, verify CI, deploy the website service, smoke-test storage/CORS, then publish the static site through the existing Pages branch. Keep the volume attached throughout. Verify both canonical and collector URLs after release. Updating only CSS does not require changing storage or secrets.

## SEO and contacts

Fully rendered body content, one H1 per page, semantic headings, indexed-page titles/descriptions, canonicals, social metadata, a 1200×630 sharing image, Organization/WebPage/WebSite JSON-LD, an accurate sitemap and a public-homepage-safe robots policy are retained. Private/API paths are disallowed by robots; robots is not authentication. Local Geist fonts and lazy-loaded prototype captures have reserved dimensions. Capability claims remain pre-launch, without profit promises, execution or invented results.

Repository-sourced destinations remain `mailto:founder@prospectpartnership.co.uk` and Fred's personal LinkedIn at https://www.linkedin.com/in/fred-boxer-93025a388/. An official company LinkedIn URL is still unverified; none has been invented. Genuine prototype captures retain their disclosure that AI drafting is not connected in the pictured version.

## Verification

- Build, JavaScript syntax, ESLint and whitespace checks; six Node integration tests (validation/consent, duplicates/restart persistence, rate limits, failures, malformed/oversized bodies, local links/metadata, CORS/preflight).
- Chromium: eight viewport/theme combinations at 1440, 768, 390 and 320px, with keyboard skip link, required fields, visible hero CTA, product selection, theme, persisted signup, error state and zero page errors.
- Axe WCAG A/AA automated checks: zero violations in those combinations. These are not independent accessibility certification or full screen-reader coverage.
- Local Lighthouse after visual rebuild: mobile and desktop **100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**. LCP approximately 0.91/0.90 seconds, mobile CLS 0.00115 and desktop CLS <0.00001, TBT 4.5/0ms. Full reports/JSON are in `evidence/`.
- A 120-frame local animation sample: median/p95 ~16.7ms with no >35ms frames. The mathematical canvas updates at a capped rate; rAF timing is not a guarantee of actual device FPS or battery use. Field LCP/CLS/INP remain unmeasured.
- Firefox and WebKit executables remain unavailable; cross-engine validation is explicitly blocked, not passed.
- Screenshots and an actual browser walkthrough are in `evidence/`; controlled local tests use temporary SQLite databases and example.com addresses. Live release verification is recorded separately below.

## Release verification

Release in progress. Terminal deployment state, canonical-site publication and controlled live persistence checks must be recorded before reporting deployment complete.
