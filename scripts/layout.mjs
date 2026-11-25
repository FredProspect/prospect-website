// Shared dark layout for inner pages (guides, product, about, legal), matching the React landing page.
import { guides, guideOrder, guideDisclaimer } from './guides.mjs';

const EMAIL = 'founder@prospectpartnership.co.uk';
const LINKEDIN = 'https://www.linkedin.com/in/fred-boxer-93025a388/';
const arrow = '<span class="g-arrow" aria-hidden="true">→</span>';

export const guideHeader = `<a class="g-skip" href="#main">Skip to content</a><header class="g-header"><div class="g-nav"><a class="g-brand" href="/" aria-label="Prospect home"><img src="/assets/prospect-lockup-dark.png" width="138" height="32" alt="Prospect"></a><nav class="g-links" aria-label="Primary"><a href="/product/">Product</a><a href="/insights/">Guides</a><a href="/about/">About</a><a href="mailto:${EMAIL}">Contact</a></nav><a class="g-btn g-btn-sm" href="/#waitlist">Get early access ${arrow}</a></div></header>`;

export const guideFooter = `<footer class="g-footer"><div class="g-wrap"><div class="g-footer-top"><p class="g-footer-tag">Sophisticated trading intelligence, made accessible.</p><nav aria-label="Guides"><p class="g-label">Guides</p>${guideOrder.map(slug => `<a href="/${slug}/">${guides[slug].eyebrow}: ${shortTitle(slug)}</a>`).join('')}</nav><nav aria-label="Company"><p class="g-label">Company</p><a href="/product/">Product</a><a href="/about/">About</a><a href="mailto:${EMAIL}">Email Prospect</a><a href="${LINKEDIN}" rel="noopener noreferrer">Fred Boxer on LinkedIn</a><a href="/privacy/">Privacy notice</a><a href="/terms/">Website terms</a><a href="/accessibility/">Accessibility</a><a href="/cookies/">Cookies</a></nav></div><div class="g-legal"><p>© 2026 Prospect Partnership Ltd · Company No. 15277481 · England &amp; Wales</p><p>Prospect is pre-launch and under development. Product previews show the current prototype, not a released service. Trading involves risk of loss. Historical testing does not predict future results. Nothing on this website is investment advice. Prospect does not execute trades or move your funds.</p></div></div></footer>`;

function shortTitle(slug) {
  return { 'systematic-trading': 'Systematic trading', 'ai-trading-strategy-builder': 'AI strategy builder', 'trading-strategy-backtesting': 'Backtesting', 'strategy-monitoring': 'Strategy monitoring', 'portfolio-risk-management': 'Portfolio risk' }[slug] || guides[slug].h1;
}

const prettyDate = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const cta = `<aside class="g-cta"><p class="g-eyebrow">The waitlist</p><h2>Get in early.</h2><p>Join the Prospect waitlist for a chance to be selected as a beta tester. Refer friends to move up the list.</p><a class="g-btn" href="/#waitlist">Join the waitlist ${arrow}</a></aside>`;

const relatedCards = slugs => `<section class="g-related" aria-labelledby="related-title"><h2 id="related-title">Keep reading</h2><div class="g-cards">${slugs.map(slug => `<a class="g-card" href="/${slug}/"><span class="g-eyebrow">${guides[slug].eyebrow}</span><span class="g-card-title">${guides[slug].h1}</span><span class="g-card-more">Read guide ${arrow}</span></a>`).join('')}</div></section>`;

const breadcrumb = (slug, entry) => {
  const trail = entry.kind === 'guide' ? [['/', 'Home'], ['/insights/', 'Guides']] : [['/', 'Home']];
  return `<nav class="g-crumbs" aria-label="Breadcrumb"><ol>${trail.map(([href, name]) => `<li><a href="${href}">${name}</a></li>`).join('')}<li aria-current="page">${shortTitle(slug) === entry.h1 ? entry.eyebrow : shortTitle(slug)}</li></ol></nav>`;
};

export function renderGuide(slug) {
  const g = guides[slug];
  const toc = g.sections.length > 3 ? `<nav class="g-toc" aria-label="On this page"><p class="g-label">On this page</p><ol>${g.sections.map(([id, heading]) => `<li><a href="#${id}">${heading}</a></li>`).join('')}${g.faqs.length ? '<li><a href="#faq">Frequently asked questions</a></li>' : ''}</ol></nav>` : '';
  const meta = g.kind === 'guide' ? `<p class="g-meta">Updated ${prettyDate(g.updated)} · ${g.readMinutes} min read · By Fred Boxer</p>` : '';
  const faq = g.faqs.length ? `<section id="faq" class="g-faq"><h2>Frequently asked questions</h2>${g.faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>` : '';
  return `<main id="main" class="g-wrap g-page">${breadcrumb(slug, g)}<header class="g-hero"><p class="g-eyebrow">${g.eyebrow}</p><h1>${g.h1}</h1><p class="g-lede">${g.lede}</p>${meta}</header><div class="g-body">${toc}<article class="g-article">${g.sections.map(([id, heading, html]) => `<section id="${id}"><h2>${heading}</h2>${html}</section>`).join('')}${faq}${g.kind === 'guide' ? `<p class="g-disclaimer">${guideDisclaimer}</p>` : ''}</article></div>${cta}${relatedCards(g.related)}</main>`;
}

export function renderHub() {
  return `<main id="main" class="g-wrap g-page"><nav class="g-crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Guides</li></ol></nav><header class="g-hero"><p class="g-eyebrow">Guides</p><h1>Trading research guides for independent traders</h1><p class="g-lede">Plain-English guides to building systematic strategies, backtesting them honestly, watching them live and managing risk across everything you run. No hype, no performance promises.</p></header><div class="g-cards g-cards-hub">${guideOrder.map(slug => `<a class="g-card" href="/${slug}/"><span class="g-eyebrow">${guides[slug].eyebrow} · ${guides[slug].readMinutes} min</span><span class="g-card-title">${guides[slug].h1}</span><span class="g-card-desc">${guides[slug].lede.split('. ')[0]}.</span><span class="g-card-more">Read guide ${arrow}</span></a>`).join('')}</div>${cta}</main>`;
}

/** Legal and utility pages: same layout, simple sections. */
export function renderSimple(title, intro, sections) {
  return `<main id="main" class="g-wrap g-page g-simple"><header class="g-hero"><h1>${title}</h1><p class="g-lede">${intro}</p></header><article class="g-article">${sections.map(([heading, copy]) => `<section><h2>${heading}</h2><p>${copy}</p></section>`).join('')}</article></main>`;
}

/** Article, breadcrumb and FAQ structured data for a guide or core page. */
export function guideSchema(slug, origin) {
  const g = guides[slug];
  const url = `${origin}/${slug}/`;
  const crumbs = g.kind === 'guide' ? [['Home', `${origin}/`], ['Guides', `${origin}/insights/`], [g.h1, url]] : [['Home', `${origin}/`], [g.h1, url]];
  return [
    ...(g.kind === 'guide' ? [{ '@type': 'Article', headline: g.h1, description: g.lede.split('. ')[0] + '.', datePublished: g.updated, dateModified: g.updated, inLanguage: 'en-GB', mainEntityOfPage: url, image: `${origin}/brand/prospect-social-card.jpg`, author: { '@type': 'Person', name: 'Fred Boxer', url: LINKEDIN }, publisher: { '@id': `${origin}/#organization` } }] : []),
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
    ...(g.faqs.length ? [{ '@type': 'FAQPage', mainEntity: g.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])
  ];
}
