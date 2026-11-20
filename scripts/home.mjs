// Homepage: single-purpose landing page that builds demand and drives early-access signups.
// Every chart and number-like visual is a labelled synthetic example. No returns, balances or user counts.

const consent = id => `<label class="j-consent" for="${id}-consent"><input type="checkbox" id="${id}-consent" name="consent" required><span>Email me about Prospect’s launch and early access. I can withdraw consent at any time. <a href="/privacy/">Privacy notice</a>.</span></label>`;
const honeypot = id => `<div class="honeypot" aria-hidden="true"><label for="${id}-website">Leave this field empty</label><input id="${id}-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>`;
const joinForm = (formId, emailId, label, extra = '') => `<form class="join-form" id="${formId}" method="post" action="/api/waitlist" data-join><div class="j-row"><label class="sr-only" for="${emailId}">Email address</label><input type="email" id="${emailId}" name="email" autocomplete="email" required maxlength="254" placeholder="you@email.com" aria-describedby="${formId}-status"><button type="submit" class="j-btn submit">${label} <span aria-hidden="true">→</span></button></div>${honeypot(formId)}${consent(formId)}<p class="j-status" id="${formId}-status" role="status" aria-live="polite" tabindex="-1"></p>${extra}<noscript><p class="j-fine">JavaScript is needed to submit. You can also <a href="mailto:founder@prospectpartnership.co.uk">email the founder</a>.</p></noscript></form>`;

// Synthetic equity path, generated once at build time from a fixed seed (illustrative only).
function syntheticPath() {
  let seed = 7, value = 0; const pts = [];
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i <= 60; i++) {
    const regime = i < 18 ? 0.55 : i < 30 ? -0.35 : i < 46 ? 0.7 : 0.15;
    value += regime + (rand() - 0.5) * 1.6;
    pts.push([Math.round(i * (560 / 60) * 10) / 10, value]);
  }
  const min = Math.min(...pts.map(p => p[1])), max = Math.max(...pts.map(p => p[1]));
  const y = v => Math.round((150 - ((v - min) / (max - min)) * 130) * 10) / 10;
  const line = pts.map(([x, v], i) => `${i ? 'L' : 'M'}${x} ${y(v)}`).join(' ');
  return { line, area: `${line} L560 170 L0 170 Z` };
}
const curve = syntheticPath();

const studio = `<figure class="studio" data-studio aria-label="Animated synthetic example of the planned Prospect workflow: an idea in plain English becomes rules, a test and an explanation.">
  <div class="studio-bar"><span class="studio-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="studio-title">Strategy studio</span><span class="tag">Synthetic example</span></div>
  <div class="studio-steps" role="group" aria-label="Demo steps">
    <button type="button" data-step="0" aria-pressed="true">Describe</button><button type="button" data-step="1" aria-pressed="false">Rules</button><button type="button" data-step="2" aria-pressed="false">Test</button><button type="button" data-step="3" aria-pressed="false">Understand</button>
  </div>
  <div class="studio-body">
    <div class="pane pane-prompt" data-pane="0"><span class="pane-label">Your idea</span><p class="prompt"><span class="prompt-text" data-type="Buy the FTSE 100 when it breaks a 20-day high. Exit if it closes below the 10-day low. Risk 1% per trade.">Buy the FTSE 100 when it breaks a 20-day high. Exit if it closes below the 10-day low. Risk 1% per trade.</span><span class="caret" aria-hidden="true"></span></p></div>
    <div class="pane pane-rules" data-pane="1"><span class="pane-label">Explicit rules</span><ul class="rules">
      <li><b>Market</b><span>FTSE 100 · daily</span></li><li><b>Entry</b><span>Close &gt; 20-day high</span></li><li><b>Exit</b><span>Close &lt; 10-day low</span></li><li><b>Sizing</b><span>1% risk per trade</span></li><li><b>Costs</b><span>Spread + slippage included</span></li>
    </ul></div>
    <div class="pane pane-chart" data-pane="2"><span class="pane-label">Historical test <em>· illustrative shape, no real results</em></span>
      <svg viewBox="0 0 560 175" class="chart" aria-hidden="true"><g class="grid"><path d="M0 20H560M0 62H560M0 104H560M0 146H560"/></g><rect class="regime" x="168" y="0" width="112" height="170"/><path class="area" d="${curve.area}"/><path class="line" d="${curve.line}" pathLength="1"/></svg>
      <div class="chart-key"><span><i class="k-line"></i>Strategy (synthetic)</span><span><i class="k-regime"></i>Choppy regime</span></div></div>
    <div class="pane pane-insight" data-pane="3"><span class="pane-label">What drives the result</span>
      <div class="drivers"><div><span>Trending markets</span><i class="bar b1"></i></div><div><span>Choppy markets</span><i class="bar b2 neg"></i></div><div><span>Trading costs</span><i class="bar b3 neg"></i></div></div>
      <div class="insight"><span class="pill watch">Watch</span><p>Most of the edge comes from trending periods. In choppy markets false breakouts give it back. Consider a regime filter, then re-test out of sample.</p></div></div>
  </div>
  <figcaption>Synthetic example of the planned workflow. Not a real strategy, backtest or result.</figcaption>
</figure>`;

const monitor = `<div class="monitor" aria-label="Synthetic example of strategy monitoring with stable, watch and review states.">
  <div class="monitor-head"><b>Your strategies</b><span class="tag">Synthetic example</span></div>
  <div class="m-row"><div><b>Breakout · FTSE 100</b><span>Behaving as expected</span></div><span class="pill stable">Stable</span></div>
  <div class="m-row"><div><b>Mean reversion · EUR/USD</b><span>Holding time drifting longer</span></div><span class="pill watch">Watch</span></div>
  <div class="m-row"><div><b>Momentum · Nasdaq</b><span>Overlaps heavily with Breakout</span></div><span class="pill review">Review</span></div>
  <div class="m-note"><b>Plain-English summary</b><p>Two strategies now react to the same moves. Your portfolio is more concentrated than it looks.</p></div>
</div>`;

const step = (n, title, copy, art) => `<article class="step"><div class="step-art" aria-hidden="true">${art}</div><span class="step-n">0${n}</span><h3>${title}</h3><p>${copy}</p></article>`;
const artDescribe = `<svg viewBox="0 0 200 110"><rect x="12" y="20" width="176" height="70" rx="12" class="s-card"/><path d="M30 44H150M30 58H170M30 72H110" class="s-text"/><rect x="112" y="66" width="2" height="12" class="s-accent"/></svg>`;
const artTest = `<svg viewBox="0 0 200 110"><path d="M14 92H186" class="s-axis"/><path d="M14 80 L40 72 L62 76 L88 58 L108 64 L130 44 L152 48 L186 26" class="s-line"/><circle cx="186" cy="26" r="4" class="s-dot"/></svg>`;
const artUnderstand = `<svg viewBox="0 0 200 110"><rect x="20" y="22" width="120" height="12" rx="6" class="s-bar-g"/><rect x="20" y="48" width="70" height="12" rx="6" class="s-bar"/><rect x="20" y="74" width="40" height="12" rx="6" class="s-bar"/><circle cx="168" cy="28" r="7" class="s-dot"/></svg>`;

export const home = `<main id="main" class="home">
<section class="h-hero"><div class="wrap h-hero-grid">
  <div class="h-hero-copy">
    <p class="h-eyebrow"><span class="live-dot" aria-hidden="true"></span>Pre-launch · Early-access waitlist open</p>
    <h1>AI for the trader.</h1>
    <p class="h-lede">Describe a trading idea in plain English. Prospect is being built to turn it into clear rules, test it on market data and show you what really drives the result.</p>
    ${joinForm('hero-form', 'hero-email', 'Get early access')}
    <ul class="h-trust"><li>No trading credentials</li><li>No code needed</li><li>Built by a trader</li></ul>
  </div>
  ${studio}
</div></section>

<section class="h-band" aria-label="Who Prospect is for"><div class="wrap h-band-row"><span>Built for independent traders</span><b>Retail traders</b><b>Prop-firm traders</b><b>Systematic thinkers</b></div></section>

<section id="how-it-works" class="h-section"><div class="wrap">
  <div class="h-head"><p class="h-kicker">How it works</p><h2>From idea to evidence,<br>in three steps.</h2></div>
  <div class="steps">
    ${step(1, 'Describe', 'Write your idea the way you’d explain it to another trader. No code, no syntax.', artDescribe)}
    ${step(2, 'Test', 'Prospect makes the rules explicit and tests them with costs included, so you see the evidence, not a hunch.', artTest)}
    ${step(3, 'Understand', 'Find out which conditions drive the result and where it breaks, in plain English.', artUnderstand)}
  </div>
</div></section>

<section id="product" class="h-dark"><div class="wrap h-split">
  <div class="h-dark-copy"><p class="h-kicker">Beyond the backtest</p><h2>Know when a strategy needs a closer look.</h2><p>Strategies change. Prospect is being built to watch how yours behave, flag what’s drifting and show where they overlap, so concentration doesn’t hide in plain sight.</p><ul class="h-list"><li>Stable, Watch and Review states at a glance</li><li>Shared exposure across strategies</li><li>Every flag explained, never a black box</li></ul></div>
  ${monitor}
</div></section>

<section class="h-section"><div class="wrap">
  <div class="h-head h-head-row"><div><p class="h-kicker">The prototype</p><h2>A real look at what we’re building.</h2></div><p>Genuine prototype screens, captured from the version in development. Not the released product.</p></div>
  <div class="proto-tabs" role="group" aria-label="Select a prototype screen"><button type="button" data-proto="workspace" aria-pressed="true">Workspace</button><button type="button" data-proto="builder" aria-pressed="false">Strategy builder</button></div>
  <figure class="proto"><img id="proto-img" src="/assets/product/workspace.jpg" width="1440" height="971" loading="lazy" alt="Prospect prototype workspace: create or import a strategy, with no portfolio connected."><figcaption id="proto-cap">Prototype workspace. Start with an idea or bring your existing research.</figcaption></figure>
</div></section>

<section class="h-section h-soft"><div class="wrap">
  <div class="h-head"><p class="h-kicker">Our principles</p><h2>Evidence first. You decide.</h2></div>
  <div class="principles">
    <div><h3>No black boxes</h3><p>Every rule is written out and every flag comes with a reason you can check.</p></div>
    <div><h3>Honest labels</h3><p>Examples, backtests, paper and live results are always marked clearly, so you know what you’re looking at.</p></div>
    <div><h3>You keep the decision</h3><p>Prospect doesn’t trade for you or move your money. It helps you research and understand.</p></div>
    <div><h3>Costs included</h3><p>Spreads, slippage and fees belong in the test, not in the small print.</p></div>
  </div>
</div></section>

<section id="about" class="h-section"><div class="wrap founder-x">
  <img class="founder-img" src="/assets/fred-boxer.jpg" width="509" height="637" loading="lazy" alt="Fred Boxer, founder of Prospect">
  <div><p class="h-kicker">Built by a trader</p><h2>Made by a trader, for traders.</h2><p>Fred Boxer started trading at 14 and spent years building and running his own systematic strategies. Prospect turns that process into tools any independent trader can use, without starting from a wall of code.</p><p class="sig">Fred Boxer · Founder <a href="https://www.linkedin.com/in/fred-boxer-93025a388/" target="_blank" rel="noopener noreferrer">LinkedIn →</a></p></div>
</div></section>

<section class="h-section"><div class="wrap faq-x"><h2>Questions</h2>
  <details><summary>What happens when I join?</summary><p>You’ll get launch and early-access news by email. You can answer a few optional questions about how you trade, which helps us decide who to invite to the first beta groups. Joining doesn’t guarantee beta access or a launch date.</p></details>
  <details><summary>Can I use Prospect today?</summary><p>Not yet. Prospect is pre-launch and the screens on this page are prototypes or synthetic examples.</p></details>
  <details><summary>Will Prospect trade for me?</summary><p>No. Prospect is for strategy research and understanding. It doesn’t execute trades, manage funds or move your money.</p></details>
  <details><summary>Do I need to code?</summary><p>No. You describe ideas in plain English. Supported markets and workflows will be explained at launch.</p></details>
  <details><summary>Does a good backtest mean a strategy will work?</summary><p>No. Historical tests depend on data, costs and assumptions, and markets change. Trading can result in losses.</p></details>
</div></section>

<section id="waitlist" class="h-dark h-final"><div class="wrap h-final-grid">
  <div><h2>Be first to try Prospect.</h2><p>Join the early-access waitlist. It takes ten seconds.</p></div>
  ${joinForm('waitlist-form', 'email', 'Join the waitlist')}
</div></section>

<dialog class="qf" id="qf" aria-labelledby="qf-title">
  <div class="qf-top"><img class="qf-logo" src="/assets/prospect-mark-light.png" width="28" height="25" alt=""><div class="qf-progress" aria-hidden="true"><i id="qf-bar"></i></div><button type="button" class="qf-close" data-qf-close aria-label="Close questions">✕</button></div>
  <div class="qf-stage" id="qf-stage" aria-live="polite"></div>
  <p class="qf-foot">Optional · helps us shape early access · <a href="/privacy/">Privacy</a></p>
</dialog>
</main>`;
