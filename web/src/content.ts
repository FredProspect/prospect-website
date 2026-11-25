export const EMAIL = 'founder@prospectpartnership.co.uk';
export const LINKEDIN = 'https://www.linkedin.com/in/fred-boxer-93025a388/';

export type Step = { name: string; title: string; copy: string };

export const steps: Step[] = [
  { name: 'Build', title: 'Describe it. Prospect drafts the rules.', copy: 'Explain a strategy in plain language. Prospect is being designed to work out the rules itself — when to get in, when to get out, how much to risk — and lay them out for you to read and question.' },
  { name: 'Research', title: 'Question the evidence.', copy: 'Explore historical behaviour with costs, spreads and slippage in view, and data held back for checking. A backtest is evidence to investigate, never a promise of future returns.' },
  { name: 'Understand', title: 'See what a result can really tell you.', copy: 'Enough trades? Which market conditions did it need? Does it survive small changes? Prospect is being built to surface the questions that matter before you trust a number.' },
  { name: 'Monitor', title: 'Notice when behaviour changes.', copy: 'Record what you expect before the market answers. Prospect is being built to flag when live behaviour drifts from your thesis, so you can take a closer look.' },
  { name: 'Manage', title: 'See risk across every strategy.', copy: 'Strategies that look different can share the same exposure. See correlation, concentration and overlap across your whole portfolio in one view.' }
];

export const perks = ['Early-access invitations before launch', 'Help shape the product with the founder', 'Launch news only. No spam, no trading credentials'];

export const previews = {
  home: { label: 'Your workspace', image: '/assets/product/workspace.jpg', width: 1440, height: 971, alt: 'Prospect prototype home. Create or import a strategy, with no portfolio connected.', title: 'A workspace for what’s next.', copy: 'Start with a strategy idea or bring your existing research. This is a prototype preview, not the released product.' },
  builder: { label: 'Strategy Builder', image: '/assets/product/strategy-builder.jpg', width: 1440, height: 922, alt: 'Prospect Strategy Builder prototype: describe, understand, prepare, review, continue. The screen states AI drafting is not connected.', title: 'One thought is enough.', copy: 'The prototype builder begins with your idea, then guides you through a structured workflow. AI drafting is not connected in this captured version. This preview does not run a strategy or produce test results.' }
} as const;
export type PreviewKey = keyof typeof previews;

export const faqs: [string, string][] = [
  ['Can I use Prospect today?', 'Prospect is pre-launch. The screens on this page are prototype previews. Join the waitlist to receive launch and early-access information; registration does not guarantee beta access or a launch date.'],
  ['Will Prospect trade for me?', 'No. Prospect is being developed for strategy research and trading intelligence. This website does not offer autonomous trading, brokerage execution or fund management.'],
  ['Do I need to know how to code?', 'The AI-assisted builder aims to make strategy development accessible through natural language. It is still in development; supported workflows and their limitations will be explained at launch.'],
  ['Does backtesting prove a strategy will work?', 'No. Historical tests depend on data quality, costs and assumptions. Overfitting and changing market conditions can make results misleading. Trading can result in losses.'],
  ['What do I get by joining the waitlist?', 'Emails about Prospect’s launch and early access, and nothing else. We never ask for trading credentials, holdings or financial information, and you can withdraw consent at any time.']
];
