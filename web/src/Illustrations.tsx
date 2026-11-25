// Conceptual step illustrations. Deterministic shapes, no market data. `.draw` paths animate in via GSAP.
import type { ReactNode } from 'react';

const Frame = ({ label, children }: { label: string; children: ReactNode }) => (
  <figure className="ill">
    <svg viewBox="0 0 400 300" role="img" aria-label={label}>{children}</svg>
    <figcaption>Concept illustration · no market data</figcaption>
  </figure>
);

const wave = (n: number, f: (i: number) => number, x0 = 30, x1 = 370) =>
  Array.from({ length: n }, (_, i) => `${i ? 'L' : 'M'}${(x0 + (i * (x1 - x0)) / (n - 1)).toFixed(1)} ${f(i).toFixed(1)}`).join('');

const Build = () => (
  <Frame label="You describe an idea in plain language; Prospect drafts the full rule set for you to review.">
    <rect className="ill-card" x="30" y="28" width="220" height="44" rx="22" />
    <text className="ill-text" x="52" y="55">“Trend after a breakout”</text>
    <path className="ill-accent draw" pathLength={1} d="M140 76 C140 104 200 100 200 128" />
    <circle className="ill-dot pop" cx="200" cy="128" r="4" />
    <rect className="ill-card ill-card-strong" x="90" y="140" width="280" height="132" rx="16" />
    <text className="ill-label" x="112" y="168">PROSPECT DRAFTS</text>
    {['Rules', 'Sizing', 'Risk limits'].map((t, i) => (
      <g key={t} className="pop">
        <circle className="ill-tick" cx="120" cy={194 + i * 26} r="8" />
        <path className="ill-tick-mark" d={`M116 ${194 + i * 26}l3 3 5-6`} />
        <text className="ill-text" x="138" y={199 + i * 26}>{t}</text>
        <rect className="ill-skeleton" x="240" y={190 + i * 26} width={90 - i * 18} height="8" rx="4" />
      </g>
    ))}
  </Frame>
);

const research = (i: number) => 168 - Math.sin(i * 0.9) * 16 - Math.sin(i * 0.37) * 24;

const Research = () => (
  <Frame label="Historical behaviour shown with a cost band and a hold-out period kept back for checking.">
    <path className="ill-grid" d="M30 250H370M30 190H370M30 130H370M30 70H370" />
    <path className="ill-band draw-fill" d={wave(24, i => research(i) - 14) + wave(24, i => research(23 - i) + 14, 370, 30).replace('M', 'L') + 'Z'} />
    <path className="ill-line draw" pathLength={1} d={wave(24, research)} />
    <path className="ill-divider" d="M280 40V262" />
    <text className="ill-label" x="292" y="56">HOLD-OUT</text>
    <text className="ill-label" x="40" y="56">AFTER COSTS &amp; SLIPPAGE</text>
  </Frame>
);

const Understand = () => (
  <Frame label="Three robustness questions: sample size, dependence on market conditions and sensitivity to small changes.">
    {[['Enough trades?', 0.78], ['Needs one regime?', 0.42], ['Survives small changes?', 0.61]].map(([t, v], i) => (
      <g key={t as string}>
        <text className="ill-text" x="40" y={76 + i * 78}>{t}</text>
        <rect className="ill-track" x="40" y={92 + i * 78} width="320" height="10" rx="5" />
        <rect className={`ill-fill grow${i === 1 ? ' ill-warn' : ''}`} x="40" y={92 + i * 78} width={320 * (v as number)} height="10" rx="5" />
      </g>
    ))}
  </Frame>
);

const Monitor = () => {
  const expected = (i: number) => 140 - Math.sin(i * 0.5) * 18;
  const observed = (i: number) => expected(i) + (i > 19 ? (i - 19) ** 1.5 * 2.6 : Math.sin(i * 1.7) * 9);
  const flagX = 30 + (26 * 340) / 29, flagY = observed(26);
  return (
    <Frame label="Live behaviour drifting outside the expected range, flagged for review.">
      <path className="ill-band" d={wave(30, i => expected(i) - 26) + wave(30, i => expected(29 - i) + 26, 370, 30).replace('M', 'L') + 'Z'} />
      <path className="ill-grid-dash" d={wave(30, expected)} />
      <path className="ill-line draw" pathLength={1} d={wave(30, observed)} />
      <circle className="ill-ring pop" cx={flagX} cy={flagY} r="13" />
      <circle className="ill-dot pop" cx={flagX} cy={flagY} r="4" />
      <rect className="ill-card ill-card-strong pop" x={flagX - 172} y={flagY + 22} width="134" height="34" rx="17" />
      <text className="ill-text pop" x={flagX - 154} y={flagY + 44}>Flag for review</text>
      <text className="ill-label" x="40" y="62">EXPECTED RANGE</text>
    </Frame>
  );
};

const corr = [
  [1, 0.8, 0.7, 0.1, 0.2], [0.8, 1, 0.75, 0.15, 0.1], [0.7, 0.75, 1, 0.2, 0.25], [0.1, 0.15, 0.2, 1, 0.3], [0.2, 0.1, 0.25, 0.3, 1]
];
const Manage = () => (
  <Frame label="A correlation grid across five strategies, highlighting three that share the same exposure.">
    {corr.flatMap((row, r) => row.map((v, c) => (
      <rect key={`${r}-${c}`} className="cell pop" x={50 + c * 46} y={36 + r * 46} width="42" height="42" rx="8" fillOpacity={0.08 + v * 0.75} />
    )))}
    <rect className="ill-outline draw-box" x="46" y="32" width="146" height="146" rx="11" />
    <path className="ill-accent draw" pathLength={1} d="M196 105 H286" />
    <text className="ill-label" x="296" y="101">SHARED</text>
    <text className="ill-label" x="296" y="119">EXPOSURE</text>
  </Frame>
);

export const illustrations = [Build, Research, Understand, Monitor, Manage];
