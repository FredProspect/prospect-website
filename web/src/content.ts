export const EMAIL = 'founder@prospectpartnership.co.uk';
export const LINKEDIN = 'https://www.linkedin.com/in/fred-boxer-93025a388/';

export type Step = { name: string; title: string; copy: string; rows: [string, string][] };

export const steps: Step[] = [
  { name: 'Build', title: 'Shape an idea into explicit rules.', copy: 'Describe a strategy in everyday language. The AI-assisted builder is being designed to turn it into rules you can read, question and edit, without starting from code.', rows: [['Idea', '“Trend after a breakout”'], ['Entry', 'Close above the 20-day high'], ['Exit', 'Close below the 10-day low'], ['Sizing', 'Fixed risk per trade']] },
  { name: 'Research', title: 'Question the evidence.', copy: 'Explore historical behaviour with costs, spreads and slippage in view. A backtest is evidence to investigate, never a promise of future returns.', rows: [['Costs', 'Spread and commission included'], ['Slippage', 'Modelled, not ignored'], ['Hold-out', 'Data kept back for checking'], ['Output', 'Evidence, not a forecast']] },
  { name: 'Understand', title: 'See what results can and cannot tell you.', copy: 'Ask whether there are enough trades, which conditions the result depends on and how fragile it is to small changes. Overfitting is the first suspect.', rows: [['Sample', 'Are there enough trades?'], ['Regime', 'Which conditions did it need?'], ['Fragility', 'Does it survive small changes?'], ['Verdict', 'Your call']] },
  { name: 'Monitor', title: 'Notice when behaviour changes.', copy: 'Record what you expect before the market answers. Prospect is being built to flag changes in live behaviour that deserve a closer look.', rows: [['Expected', 'Your documented thesis'], ['Observed', 'Live behaviour'], ['Drift', 'Flagged for review'], ['Action', 'You decide']] },
  { name: 'Manage', title: 'Consider risk across strategies together.', copy: 'Strategies that look different can share the same exposure. See correlation, concentration and overlap across the whole portfolio.', rows: [['Correlation', 'How strategies move together'], ['Concentration', 'Where risk is stacked'], ['Overlap', 'Exposures they share'], ['View', 'One portfolio']] }
];

export const principles: [string, string, string][] = [
  ['Rules', 'Signals with no explanation', 'Rules you can read and edit'],
  ['Evidence', 'Backtests sold as proof', 'Evidence shown with its limitations'],
  ['Scope', 'One trade at a time', 'Risk across your whole portfolio'],
  ['Control', 'Bots that promise to trade for you', 'AI assistance, with the decision kept in your hands']
];

export const previews = {
  home: { label: 'Your workspace', image: '/assets/product/workspace.jpg', height: 971, alt: 'Prospect prototype home. Create or import a strategy, with no portfolio connected.', title: 'A workspace for what’s next.', copy: 'Start with a strategy idea or bring your existing research. This is a prototype preview, not the released product.' },
  builder: { label: 'Strategy Builder', image: '/assets/product/strategy-builder.jpg', height: 922, alt: 'Prospect Strategy Builder prototype: describe, understand, prepare, review, continue. The screen states AI drafting is not connected.', title: 'One thought is enough.', copy: 'The prototype builder begins with your idea, then guides you through a structured workflow. AI drafting is not connected in this captured version. This preview does not run a strategy or produce test results.' }
} as const;
export type PreviewKey = keyof typeof previews;

export const faqs: [string, string][] = [
  ['Can I use Prospect today?', 'Prospect is pre-launch. The screens on this page are prototype previews. Join the waitlist to receive launch and early-access information; registration does not guarantee beta access or a launch date.'],
  ['Will Prospect trade for me?', 'No. Prospect is being developed for strategy research and trading intelligence. This website does not offer autonomous trading, brokerage execution or fund management.'],
  ['Do I need to know how to code?', 'The AI-assisted builder aims to make strategy development accessible through natural language. It is still in development; supported workflows and their limitations will be explained at launch.'],
  ['Does backtesting prove a strategy will work?', 'No. Historical tests depend on data quality, costs and assumptions. Overfitting and changing market conditions can make results misleading. Trading can result in losses.'],
  ['What do I get by joining the waitlist?', 'Emails about Prospect’s launch and early access, and nothing else. We never ask for trading credentials, holdings or financial information, and you can withdraw consent at any time.']
];
