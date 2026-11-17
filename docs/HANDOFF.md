# Prospect website — visual rebuild and release

## Light-first, reactive product design — 17 November 2026

Light mode is now the standard for visitors without an explicit preference, including devices using a dark OS theme. The theme button remains available and an explicit visitor choice persists. Automatic OS theme changes do not override that choice or the light default.

The bold “AI for the trader” headline, genuine Geist and minimum 14px text are retained. A native reactive emerald landscape returns to the hero with readable Idea / Strategy / Portfolio labels. Three keyboard-operable controls change the geometry and explanatory text, expressing a planned research workflow rather than simulating product output. Fine-pointer movement gently changes perspective; smaller/slower devices receive reduced rendering work. The canvas pauses offscreen/hidden and stays static for reduced-motion users; deliberate stage selection still changes the illustration without animation.

Supporting design restores a composed brand grid/colour wash, depth and feedback around the genuine product showcase, a shared-exposure illustration, connected workflow graphics and understated portrait framing. No tiny HUD labels, financial results, invented data or promised working AI are added. The existing product screens, founder photo, pre-launch disclosures, waitlist storage and trading application are preserved.

Validation: six integration tests, eight viewport/theme combinations with zero automated axe violations, actual loaded Geist files, default-light behaviour under a dark OS setting, persisted manual dark mode, keyboard scene changes, offscreen/reduced-motion behaviour, preview/FAQ controls and no-JavaScript content. Latest local Lighthouse: 100 in Performance, Accessibility, Best Practices and SEO on both explicit mobile and desktop profiles; LCP ~1.20s mobile / 0.34s desktop, CLS 0, TBT ~40.5ms / 0ms. Field performance and unavailable Firefox/WebKit engines remain unverified. See the updated reports, screenshots and walkthrough in `evidence/`.

## Trader-first editorial pass — 17 November 2026

The homepage now says **AI for the trader**. The visual direction is deliberately simpler: bold solid Geist headlines, flat brand colours, larger reading text and a genuine product screenshot. The mathematical canvas, orbit/HUD composition, tiny section indices, glowing relationship diagrams, waveform decoration, portrait overlay stamp and oversized outline footer wordmark are removed from the rendered homepage. No background rendering script is shipped. Native preview transitions, keyboard-compatible FAQs and quieter control/theme feedback remain, with reduced-motion support.

The hero explains the planned trading-research product directly. Pre-launch status, genuine prototype labelling, the founder portrait, consent/privacy information and risk disclosures remain intact and readable. Current homepage text is at least 14px; body copy is 18–20px on desktop and 17–18px on phones. Geist 400/500/600 remains self-hosted, with bold 600 headlines. The sharing artwork and page title use the same trader-first message.

Eight viewport/theme combinations and six integration tests pass. Dedicated browser checks verify the exact headline, no leftover canvas/HUD/waveform elements, the 14px minimum, actual loaded Geist faces, preview selection, theme switching, keyboard disclosures and reduced-motion/no-JavaScript behaviour. The Lighthouse script now supplies its explicit desktop configuration rather than relying on a CLI-only preset flag. The hero preview is prioritised for discovery/loading. Latest lab scores: mobile Performance 95, desktop Performance 100; Accessibility, Best Practices and SEO 100 on both. Simulated LCP is 2.85s mobile and 0.58s desktop; field percentiles remain unmeasured. Full reports are in `evidence/`.

The waitlist server, database, consent version, company destinations and trading application are unchanged. This is a public-site presentation/content update, released through the existing website service and GitHub Pages setup.

## Geist typography and motion refinement — 17 November 2026

The current public refinement uses genuine locally hosted Geist Regular (400), Medium (500) and Semibold (600). The previous broad 600–900 declaration is corrected and synthetic font weights are disabled. Headlines now have deliberate weight contrast and line rhythm; paragraphs, labels, navigation, FAQs, consent text and disclosures have larger, clearer type, restrained tracking and comfortable line lengths. Responsive text remains readable at 320px and the hero CTA stays on the first screen. No claims, verified brand assets or founder information are changed.

Motion adds coordinated hero entrances, independently staggered content, decoded-image preview crossfades with rapid-selection protection, animated keyboard-compatible disclosures, theme transitions and refined button/link feedback. Headline and introductory copy remain visible from the first paint; animation does not delay reading. The mathematical canvas shares one geometry buffer between mesh directions and batches paint calls. It uses time-based progression with fine-pointer response, targets 60fps on capable desktops, reduces work on smaller/slower devices and stops offscreen or when the document is hidden. Schematic loops pause outside the viewport. Reduced-motion changes cancel active entrances, disclosures and crossfades and render a static field; content remains available with JavaScript disabled.

Styles/scripts receive deterministic content-hash query versions so returning visitors receive the matching release rather than a cached mix of old and new assets. The waitlist API, storage, consent requirements and existing trading services are unchanged.

Verification: eight viewport/theme combinations pass, with zero automated axe violations; six Node integration tests, syntax/build/lint and link checks pass. Additional real-browser checks verify actual loaded Geist files at all three weights, readable paragraph sizing, active/offscreen/reduced canvas behaviour, rapid preview selection, keyboard disclosures and no-JavaScript headline/CTA visibility. See `evidence/typography-motion.json`. Local Lighthouse is 100 in all four categories on mobile and desktop, LCP about 1.14/1.15s, TBT 63/70.5ms, CLS 0/<0.00011. These remain laboratory observations, not field Core Web Vitals or universal frame-rate guarantees. Firefox/WebKit verification remains unavailable.

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
- Local Lighthouse after visual rebuild: mobile and desktop **100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**. LCP approximately 1.15 seconds on both profiles, CLS 0, TBT 32/25ms. Full reports/JSON are in `evidence/`.
- A 120-frame local animation sample: median/p95 ~16.7ms with no >35ms frames. The mathematical canvas updates at a capped rate; rAF timing is not a guarantee of actual device FPS or battery use. Field LCP/CLS/INP remain unmeasured.
- Firefox and WebKit executables remain unavailable; cross-engine validation is explicitly blocked, not passed.
- Screenshots and an actual browser walkthrough are in `evidence/`; controlled local tests use temporary SQLite databases and example.com addresses. Live release verification is recorded separately below.

## Initial launch verification — 16 November 2026

The public website is live at https://prospectpartnership.co.uk/. PR #1 was merged after GitHub CI passed. The canonical domain was fetched after publication and verified to serve the new headline, canvas script, brand assets and updated robots policy.

The dedicated collector's final application deployment is `205e9ce0-d9ad-4bc6-b638-144db2d7cf85`, terminal **SUCCESS**, pinned to application commit `765ef8b832037a4356d09c601a8030639439b33d`. It replaces initial successful deployment `d9293298-91cb-4b40-8604-8ee341fe1bdc` while retaining the same private volume.

A controlled example.com signup was created through the real browser on the initial deployment. After replacement, operational logs reported **duplicate** for that exact controlled registration, verifying that its row survived replacement. These logs contain only event/result fields and no address or request payload. The final browser check submitted the published canonical homepage form successfully, exercised exact-origin cross-site persistence, and verified a 403 for an unapproved preflight origin. See `evidence/live-smoke.json` for all three release phases. The controlled record is clearly labelled `controlled-release-smoke`; no email was sent and no real customer registration was edited or deleted.

Readback of the Railway environment confirmed one replica and the attached private volume. The existing `prospect-ui-preview` and `prospect-staging` services retain their original deployment IDs; neither was modified. There are no pending staged changes.

The application collector is deliberately pinned to its tested release; future source pushes alone do not replace it. Deploy future backend updates explicitly, preserve the volume, and verify persistence before publishing dependent static frontend changes. GitHub Pages retains the existing canonical domain; no DNS change was needed.

Remaining verification limits: Firefox/WebKit executables were unavailable; real-user Core Web Vitals, independent screen-reader certification, provider agreement/backup operations and an automated email communication process were not verified or configured by this release. The official company LinkedIn URL still needs an authentic destination; Fred's personal profile remains correctly labelled.
