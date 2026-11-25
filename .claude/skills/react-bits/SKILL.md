---
name: react-bits
description: Library of 200+ React Bits animated components (TypeScript + plain CSS) — text animations, cursor/hover effects, WebGL backgrounds, interactive components and micro-interactions. Use when building or redesigning the landing page and you want a premium animated effect (headline reveals, shader backgrounds, magnetic buttons, spotlight cards, scroll-driven text, counters). Triggers on: react bits, animated background, text reveal, shader, spotlight card, magnetic, scroll reveal, count up, living UI.
---

# React Bits

Source of truth: `components/<Category>/<Name>/<Name>.tsx` (+ `<Name>.css` when present). Vendored from github.com/DavidHDev/react-bits (MIT). Full catalogue with each component's npm dependencies: `INDEX.md`.

## How to use a component

1. Look it up in `INDEX.md`; note its deps.
2. Read the `.tsx` to learn its props (exported prop type at top of file) — never guess props.
3. Copy the folder into the app (`web/src/bits/<Name>/`), install its deps, import the `.css` beside it.
4. Restyle to the site's tokens: replace hard-coded colours/fonts with CSS variables. Never ship a component with its demo colours.

## Fit with this site's stack

- **Animation engine is GSAP.** Prefer components whose deps are `gsap` or `none`. Components on `motion/react` are acceptable only when no GSAP equivalent exists; don't mix two engines in one section. Register plugins once (`gsap.registerPlugin(ScrollTrigger, SplitText)`) at app entry.
- **Smooth scroll is Lenis.** ScrollTrigger-based components (ScrollReveal, ScrollFloat, FoldText, ScrollStack, ScrollVelocity) must run against the Lenis-synced ScrollTrigger: `lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0)`.
- **WebGL** (`ogl`, `three`): at most ONE live WebGL canvas per viewport. Pause when offscreen (IntersectionObserver) and give a static CSS-gradient fallback for `prefers-reduced-motion` and no-WebGL.
- Skip `@hugeicons` components unless icons are actually wanted; swap for inline SVG.

## Restraint rules (what makes it look designed, not vibe-coded)

- One signature effect per section, max. Hero gets the boldest; everything else is quiet.
- Avoid the tells: rainbow gradients, glitch/neon/ASCII effects, cursor trails, Ballpit, Hyperspeed, SplashCursor, StarBorder, ElectricBorder on a finance product.
- Motion is slow and eased (`power3.out`/`expo.out`, 0.8–1.4s), staggered 0.03–0.08s per word/line. Respect `prefers-reduced-motion` — render final state instantly.
- Animate only `transform`, `opacity`, `filter`, `clip-path`.

## Curated shortlist for a premium fintech/quant landing page

| Need | Pick | Deps |
|---|---|---|
| Hero headline reveal | SplitText, MaskedHeading, BlurText | gsap / gsap / motion |
| Scroll-scrubbed paragraph | ScrollReveal, ScrollFloat | gsap |
| Living hero background | Silk, DarkVeil, Grainient, LineWaves, FloatingLines, Threads, DotGrid, Iridescence (tone down) | ogl / none |
| Data feel | CountUp, DecryptedText (subtle), RotatingText | motion |
| Cards | SpotlightCard, BorderGlow, MagicBento, TiltedCard (small tilt) | none / gsap |
| Stacked feature scroll | ScrollStack, CardSwap | lenis / gsap |
| CTA polish | Magnet, GlareHover, ShinyText | none |
| Logos / marquee | LogoLoop | none |
| Section edges | GradualBlur, Noise (grain overlay) | none |

Verify a component's deps in `INDEX.md` before committing to it.
