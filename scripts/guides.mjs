// Long-form guides and core pages for the retail-first positioning (Nov 2026).
// Educational, plain English, no performance claims. Prospect features are described as "being built".
// Each section: [id, heading, html]. FAQs feed FAQPage structured data.

const disclaimer = 'This guide is general education, not financial advice. Trading involves risk of loss, and historical testing does not predict future results.';

export const guides = {
  'ai-trading-strategy-builder': {
    kind: 'guide',
    eyebrow: 'Build',
    h1: 'AI trading strategy builder: from idea to testable rules',
    lede: 'Most trading ideas start as a sentence, like “buy strength after a breakout”. An AI trading strategy builder turns that sentence into precise rules a computer can test. Here is how that works, what a good builder should and shouldn’t do, and how to keep your own judgement in charge.',
    updated: '2026-11-25',
    readMinutes: 7,
    sections: [
      ['what-it-is', 'What an AI trading strategy builder actually does', `<p>A trading strategy is a set of rules: when to enter, when to exit, how much to risk and which markets to trade. Writing those rules precisely enough to test has traditionally meant learning a programming language or a platform’s scripting syntax.</p><p>An AI strategy builder removes that barrier. You describe the idea in everyday language and the builder drafts the full rule set for you, covering entries, exits, position sizing and the conditions that would make you abandon the idea. You then read, question and edit those rules before anything is tested.</p><p>The value isn’t that the AI has better ideas than you. It’s that it makes <em>your</em> ideas explicit, fast, so you can find out whether they hold up.</p>`],
      ['from-idea-to-rules', 'From a sentence to a rule set: a worked example', `<p>Take the idea <strong>“trend after a breakout”</strong>. On its own it is too vague to test. A builder turns it into something like:</p><ul><li><strong>Market and timeframe:</strong> large, liquid stocks or indices, on daily bars.</li><li><strong>Entry:</strong> a close above the highest close of the previous 20 days.</li><li><strong>Exit:</strong> a close below the lowest close of the previous 10 days.</li><li><strong>Sizing:</strong> a fixed fraction of the account at risk per trade, based on recent volatility.</li><li><strong>Invalidation:</strong> what would tell you the idea is broken, for example a long run of failed breakouts in a sideways market.</li></ul><p>Every one of those choices is an assumption. A good builder shows them to you plainly so you can change them, rather than hiding them inside generated code.</p>`],
      ['what-good-looks-like', 'What a good AI strategy builder should do', `<ul><li><strong>Show the rules in plain English.</strong> If you can’t read and explain a rule, you can’t trust a test of it.</li><li><strong>Ask clarifying questions.</strong> Ambiguity (“strong momentum”) should be turned into a definition, not guessed silently.</li><li><strong>Separate idea from evidence.</strong> Drafting rules is not the same as showing they work. The next step is honest testing.</li><li><strong>Include costs from the start.</strong> Spreads, commissions and slippage belong in the rules, not as an afterthought.</li><li><strong>Leave the decision with you.</strong> The builder proposes; you decide what to test and whether to trade.</li></ul>`],
      ['red-flags', 'Red flags to watch for', `<p>Be wary of any tool that promises a “profitable strategy” on demand, shows only its best-looking results, or encourages you to keep regenerating rules until a backtest looks good. That last habit is a fast route to overfitting, where a strategy is accidentally tuned to past noise and fails on new data. Our <a href="/trading-strategy-backtesting/">backtesting guide</a> covers how to avoid it.</p>`],
      ['no-code', 'Do you need to know how to code?', `<p>No. Natural language lowers the barrier to <em>expressing</em> an idea. It doesn’t remove the need for judgement. You still need to understand what each rule does, what it assumes about the market, and what could go wrong. If you can explain your strategy to a friend in a few sentences, you have what you need to start.</p>`],
      ['prospect', 'How Prospect approaches it', `<p>Prospect is being built for independent traders who want to explore ideas without starting from code. You describe the idea; Prospect drafts the complete rule set, including entries, exits and sizing, and lays it out for you to read, question and edit before anything is tested. From there the same idea flows into <a href="/trading-strategy-backtesting/">honest backtesting</a>, <a href="/strategy-monitoring/">live monitoring</a> and <a href="/portfolio-risk-management/">portfolio risk</a>.</p><p>Prospect is pre-launch. AI drafting is not connected in the current prototype, and nothing here is a promise of results.</p>`]
    ],
    faqs: [
      ['Can AI create a profitable trading strategy?', 'No tool can promise that. AI can turn your idea into precise, testable rules quickly, but whether a strategy has an edge can only be investigated with careful testing, and even then past results do not guarantee future performance.'],
      ['What is the difference between a strategy builder and a trading bot?', 'A strategy builder helps you define and research rules. A trading bot executes trades automatically. Prospect is a research tool: it does not place trades or move your money.'],
      ['Do I need programming skills to build a trading strategy?', 'Not with a natural-language builder. You do need to understand what each rule does and what it assumes, which is why rules should always be shown in plain English.']
    ],
    related: ['trading-strategy-backtesting', 'systematic-trading', 'strategy-monitoring']
  },

  'trading-strategy-backtesting': {
    kind: 'guide',
    eyebrow: 'Research',
    h1: 'How to backtest a trading strategy (without fooling yourself)',
    lede: 'Backtesting means running your strategy’s rules over historical data to see how they would have behaved. Done well, it is the best evidence you can get before risking money. Done badly, it produces beautiful charts that mean nothing. This guide walks through a careful process step by step.',
    updated: '2026-11-25',
    readMinutes: 9,
    sections: [
      ['what-is-backtesting', 'What is backtesting?', `<p>A backtest applies a fixed set of trading rules to past market data and records every trade the rules would have taken. The output is a history of hypothetical trades and summary statistics such as total return, drawdown, win rate and number of trades.</p><p>The key word is <em>hypothetical</em>. A backtest tells you how rules interacted with one particular stretch of history, under the assumptions you gave it. It is evidence to investigate, not a forecast.</p>`],
      ['step-by-step', 'How to backtest a trading strategy: step by step', `<ol><li><strong>Write the rules down first.</strong> Entry, exit, sizing, markets and timeframe, decided <em>before</em> you look at results. If you can’t write a rule precisely, you can’t test it.</li><li><strong>Choose clean, appropriate data.</strong> Use data that matches what you’d actually trade, adjusted for splits and dividends where relevant, and long enough to include different market conditions.</li><li><strong>Hold some data back.</strong> Split history into a development period and a separate “out-of-sample” period you don’t look at until the end.</li><li><strong>Model real-world costs.</strong> Include spreads, commissions and slippage. Many strategies that trade often look good only because costs were ignored.</li><li><strong>Run the test on the development period.</strong> Record the results, including the bad parts: the worst drawdown, the longest losing streak.</li><li><strong>Check robustness.</strong> Nudge the parameters (a 20-day breakout becomes 18 or 22). If results collapse, the edge may be an accident of the exact settings.</li><li><strong>Test once on the held-back data.</strong> This is your most honest estimate. If it looks very different from development, take that seriously.</li><li><strong>Write down what you learned.</strong> Including what would make you stop trading it.</li></ol>`],
      ['costs', 'Costs, spreads and slippage', `<p>A historical price isn’t a guarantee you could have traded at that price. Every trade pays a spread and usually a commission, and fast markets add slippage: the gap between the price you expected and the price you got. A strategy making many small trades can see a large share of its theoretical edge disappear once realistic costs are included. Model costs conservatively; it is better to be pleasantly surprised than the reverse.</p>`],
      ['overfitting', 'Overfitting: the most common backtesting mistake', `<p>Overfitting happens when a strategy is tuned so closely to past data that it captures noise instead of a genuine pattern. It usually creeps in gradually: you test, tweak a parameter, test again, add a filter, test again. Each change improves the backtest a little, until the rules describe the past perfectly and the future not at all.</p><p>Warning signs:</p><ul><li>Many parameters or filters relative to the number of trades.</li><li>Results that depend on very specific settings.</li><li>A smooth equity curve with few trades.</li><li>Strong development results that fade sharply out of sample.</li></ul><p>The defences are simple but require discipline: fewer rules, held-back data, robustness checks and a written record of every change you made.</p>`],
      ['other-biases', 'Other biases to watch for', `<ul><li><strong>Look-ahead bias:</strong> using information that wouldn’t have been available at the time, for example today’s close to make a decision at today’s open.</li><li><strong>Survivorship bias:</strong> testing only on companies that still exist today, which quietly removes the failures.</li><li><strong>Small samples:</strong> 30 trades can look impressive by luck alone. More trades across different conditions give more reliable evidence.</li><li><strong>Regime dependence:</strong> a strategy that only worked in one kind of market (say, a long bull run) may not survive a change.</li></ul>`],
      ['reading-results', 'How to read backtest results', `<p>Look past total return. Ask: how deep was the worst drawdown, and could you have lived through it? How many trades are there? How much of the result comes from a handful of outliers? What were costs as a share of profit? Did it behave similarly in different periods and markets? A modest, robust result is usually more useful than a spectacular, fragile one.</p>`],
      ['prospect', 'How Prospect approaches backtesting', `<p>Prospect is being built to make careful backtesting the default for independent traders: costs and slippage modelled from the start, data held back for checking, robustness and sample-size questions surfaced next to every result, and limitations kept visible. It is designed to help you <em>question</em> results, not to sell them to you.</p><p>Prospect is pre-launch, and this website doesn’t run backtests or show performance results.</p>`]
    ],
    faqs: [
      ['Does a good backtest mean a strategy will make money?', 'No. A backtest shows how rules behaved on past data under your assumptions. Markets change, costs vary and overfitting can make noise look like an edge. Past performance is not a reliable indicator of future results.'],
      ['How much data do I need to backtest a strategy?', 'Enough to produce a meaningful number of trades across different market conditions. There is no single rule, but a few dozen trades from one market phase is rarely enough to draw firm conclusions.'],
      ['What is out-of-sample testing?', 'It means keeping part of your historical data untouched while you develop a strategy, then testing on it once at the end. It is one of the best checks against overfitting.'],
      ['Can I backtest without coding?', 'Yes. Natural-language and visual tools let you define rules without writing code. You still need to understand the rules and the assumptions behind the test.']
    ],
    related: ['ai-trading-strategy-builder', 'systematic-trading', 'portfolio-risk-management']
  },

  'systematic-trading': {
    kind: 'guide',
    eyebrow: 'Foundations',
    h1: 'Systematic trading: a practical guide for independent traders',
    lede: 'Systematic trading means making trading decisions with predefined rules rather than in-the-moment judgement. It was once the domain of funds with research teams; today independent traders can work the same way. Here is what it involves, why people do it, and how to start carefully.',
    updated: '2026-11-25',
    readMinutes: 8,
    sections: [
      ['what-is-it', 'What is systematic trading?', `<p>A systematic trader follows a written set of rules that decide what to trade, when to enter and exit, and how much to risk. The rules are fixed in advance and applied consistently. Discretionary trading, by contrast, relies on judgement made trade by trade.</p><p>Systematic doesn’t have to mean fully automated. Many independent traders use rules to generate decisions and still place the orders themselves. What matters is that the decision process is explicit and repeatable.</p>`],
      ['why', 'Why traders go systematic', `<ul><li><strong>Consistency:</strong> the same situation leads to the same decision, regardless of mood or recent wins and losses.</li><li><strong>Testability:</strong> explicit rules can be <a href="/trading-strategy-backtesting/">backtested</a>; gut feel can’t.</li><li><strong>Accountability:</strong> when results disappoint, you can see which rule or assumption failed.</li><li><strong>Scale:</strong> rules let you run several strategies or markets without watching every screen.</li></ul>`],
      ['common-types', 'Common types of systematic strategy', `<ul><li><strong>Trend following:</strong> buying assets that have been rising and selling those falling, on the idea that moves persist.</li><li><strong>Mean reversion:</strong> betting that unusually large moves partly reverse.</li><li><strong>Breakout:</strong> entering when price moves beyond a recent range.</li><li><strong>Carry and seasonal ideas:</strong> rules built around yield differences or calendar patterns.</li></ul><p>None of these is reliably profitable on its own. Each behaves differently across market conditions, which is why understanding <em>when</em> a strategy struggles matters as much as when it works.</p>`],
      ['the-process', 'The systematic trading process', `<ol><li><strong>Idea:</strong> a hypothesis about market behaviour, stated in a sentence.</li><li><strong>Rules:</strong> turn the idea into precise entries, exits and sizing. An <a href="/ai-trading-strategy-builder/">AI strategy builder</a> can help here.</li><li><strong>Research:</strong> backtest with realistic costs and held-back data.</li><li><strong>Small, careful start:</strong> trade small or on paper while you compare live behaviour with expectations.</li><li><strong>Monitoring:</strong> watch for <a href="/strategy-monitoring/">drift</a> between live results and the research.</li><li><strong>Portfolio view:</strong> as you add strategies, manage <a href="/portfolio-risk-management/">risk across all of them</a>, not one at a time.</li></ol>`],
      ['pitfalls', 'Pitfalls to avoid', `<ul><li><strong>Overfitting</strong> rules to the past until they describe noise.</li><li><strong>Ignoring costs</strong>, especially for strategies that trade often.</li><li><strong>Abandoning rules</strong> during a normal losing streak, or overriding them after a winning one.</li><li><strong>Hidden concentration:</strong> several “different” strategies that all depend on the same market move.</li><li><strong>Position sizing</strong> that risks too much on any single trade.</li></ul>`],
      ['getting-started', 'Getting started without a quant team', `<p>Start with one simple idea you understand, written in plain English. Define the rules completely, test them honestly, and decide in advance what would make you stop. Keep a research log of every change. Complexity can come later; clarity can’t be added afterwards.</p>`],
      ['prospect', 'Where Prospect fits', `<p>Prospect is being built to give independent traders the systematic workflow that used to need a research team, without needing to code: describe an idea, get explicit rules, test them honestly, monitor live behaviour and see risk across every strategy. It is pre-launch, and it is a research tool. It doesn’t trade for you.</p>`]
    ],
    faqs: [
      ['Is systematic trading the same as algorithmic trading?', 'They overlap. Systematic trading means following predefined rules; algorithmic trading usually means a computer also executes the orders. You can be systematic and still place trades manually.'],
      ['Can retail traders do systematic trading?', 'Yes. Data, testing tools and brokers are now accessible to individuals. The main requirements are clear rules, honest testing and disciplined risk management.'],
      ['Is systematic trading less risky than discretionary trading?', 'Not inherently. Rules make risk more visible and consistent, but a systematic strategy can still lose money, especially if it is overfitted or sized too aggressively.']
    ],
    related: ['ai-trading-strategy-builder', 'trading-strategy-backtesting', 'portfolio-risk-management']
  },

  'strategy-monitoring': {
    kind: 'guide',
    eyebrow: 'Monitor',
    h1: 'Trading strategy monitoring: how to spot drift before it costs you',
    lede: 'Every strategy goes through losing periods. The hard question is whether a bad run is normal variation or a sign that something has changed. Strategy monitoring gives you a way to answer that calmly, with evidence rather than emotion.',
    updated: '2026-11-25',
    readMinutes: 7,
    sections: [
      ['why-monitor', 'Why live strategies drift', `<p>A strategy that tested well can stop behaving like its backtest for several reasons. Market conditions change, so a trend strategy struggles in a sideways market. Costs rise as spreads widen or liquidity thins. Other traders crowd the same idea. Or the original edge was partly overfitting all along. Monitoring is how you notice which of these is happening.</p>`],
      ['define-expectations', 'Step 1: write down what you expect', `<p>Before going live, record the strategy’s thesis and its expected behaviour from research: typical win rate, average trade, trade frequency, normal and worst drawdowns, and how long losing streaks usually last. Without this baseline, every bad week feels like a crisis and every good week feels like proof.</p>`],
      ['what-to-watch', 'Step 2: what to watch', `<ul><li><strong>Drawdown versus history:</strong> is the current drawdown within the range seen in testing, or beyond it?</li><li><strong>Trade frequency:</strong> a strategy suddenly trading far more or less often may be meeting different conditions.</li><li><strong>Average trade and costs:</strong> rising costs or slippage can quietly erode results.</li><li><strong>Win rate and payoff:</strong> a shift in either can signal that the pattern has weakened.</li><li><strong>Exposure:</strong> is the strategy holding the positions you’d expect?</li></ul>`],
      ['normal-vs-broken', 'Step 3: normal variation or a broken strategy?', `<p>Compare live behaviour with the range you recorded, not with the backtest’s average. A drawdown deeper than anything seen in testing, combined with a change in how the strategy trades, deserves a closer look. A loss within the normal range usually doesn’t. Decide your review triggers <em>in advance</em> so you’re not deciding under pressure.</p>`],
      ['what-to-do', 'Step 4: what to do when a flag appears', `<p>A flag is a prompt to investigate, not an instruction to act. Check data and execution first; many apparent problems are operational. Then ask whether market conditions have shifted and whether the original thesis still makes sense. Options include reducing size, pausing, or continuing unchanged. What matters is that the decision is deliberate and recorded.</p>`],
      ['prospect', 'How Prospect approaches monitoring', `<p>Prospect is being built to compare each live strategy with the expectations you recorded, and to flag behaviour that drifts outside its normal range so you can review it. Alerts can’t prove an edge has gone or tell you what to trade; the decision stays with you. Monitoring is in development.</p>`]
    ],
    faqs: [
      ['How do I know if my trading strategy has stopped working?', 'Compare live results with the ranges you recorded from research. A drawdown beyond historical norms, combined with changes in trade frequency or behaviour, is a reason to investigate. A loss within the normal range usually is not.'],
      ['What is strategy drift?', 'Strategy drift is when a live strategy’s behaviour moves away from what its research suggested, for example trading more often, paying higher costs or suffering deeper drawdowns.'],
      ['Should I stop a strategy after a losing streak?', 'Not automatically. Decide your review rules in advance, check for operational problems, and compare the streak with what testing showed was normal before acting.']
    ],
    related: ['trading-strategy-backtesting', 'portfolio-risk-management', 'systematic-trading']
  },

  'portfolio-risk-management': {
    kind: 'guide',
    eyebrow: 'Manage',
    h1: 'Portfolio risk management for traders running several strategies',
    lede: 'Running more than one strategy can make your results steadier, or it can quietly stack the same risk several times over. Portfolio risk management is about seeing how your strategies interact, so diversification is real rather than assumed.',
    updated: '2026-11-25',
    readMinutes: 8,
    sections: [
      ['why-portfolio', 'Why look beyond individual strategies?', `<p>Each strategy can look sensible on its own and still combine badly. Three strategies that all profit from rising stock markets are, in a sell-off, really one strategy with three times the size. Portfolio risk management looks at the whole picture: what you are exposed to, how strategies move together and where losses could cluster.</p>`],
      ['correlation', 'Correlation: useful, but only a starting point', `<p>Correlation measures how closely two return streams move together, from +1 (in lockstep) to −1 (opposite). Low correlation between strategies is generally helpful. But correlations change, and they often rise sharply in stressful markets, exactly when you need diversification most. Treat historical correlation as a clue, not a guarantee.</p>`],
      ['concentration', 'Hidden concentration', `<p>Concentration hides in shared dependencies: the same market, the same sector, the same direction, the same holding period or the same liquidity conditions. Ask of each strategy: what has to happen in the market for this to make money, and for it to lose? If several answers are the same, you are more concentrated than the number of strategies suggests.</p>`],
      ['sizing', 'Position sizing across strategies', `<p>Sizing is where portfolio risk becomes real. Common approaches include risking a fixed fraction of the account per trade, scaling positions by volatility so each strategy contributes similar risk, and setting an overall limit on total exposure. Whatever you choose, decide it in advance and check how much you could lose if several strategies hit their worst days together.</p>`],
      ['checklist', 'A simple portfolio risk checklist', `<ul><li>List what each strategy depends on to make money.</li><li>Group strategies by shared exposure: market, direction and timeframe.</li><li>Check correlations over calm <em>and</em> stressful periods.</li><li>Estimate the combined worst-case drawdown, not just each one separately.</li><li>Set a total risk limit and review it when you add a strategy.</li></ul>`],
      ['prospect', 'How Prospect approaches portfolio risk', `<p>Prospect is being built to show correlation, concentration and overlap across every strategy you run in one view, so you can see where risk is stacked before it shows up as losses. It is designed to help you investigate, not to guarantee lower risk. Portfolio intelligence is in development.</p>`]
    ],
    faqs: [
      ['What is portfolio risk management in trading?', 'It is managing the combined risk of all your positions and strategies, including how they move together, shared exposures and total potential loss, rather than judging each one in isolation.'],
      ['Does running more strategies reduce risk?', 'Only if the strategies are genuinely different. Strategies that depend on the same market moves can add concentration rather than diversification.'],
      ['Why do correlations rise in a market crash?', 'In stressful markets many assets are sold together as traders reduce risk, so relationships that looked independent in calm periods can converge.']
    ],
    related: ['strategy-monitoring', 'systematic-trading', 'trading-strategy-backtesting']
  },

  'product': {
    kind: 'page',
    eyebrow: 'The product',
    h1: 'Prospect: AI-assisted trading research for independent traders',
    lede: 'Prospect is being built so independent traders can do the kind of strategy research that used to need a quant team: describe an idea, get clear rules, test them honestly, watch them live and see risk across everything you run.',
    updated: '2026-11-25',
    sections: [
      ['who', 'Who it’s for', `<p>Retail traders, prop traders and systematic thinkers who have ideas but not a research department. You don’t need to write code. You do need to want evidence over hype.</p>`],
      ['workflow', 'One connected workflow', `<ol><li><strong>Build:</strong> describe a strategy in plain English and Prospect drafts the full rules for you to review. <a href="/ai-trading-strategy-builder/">Learn more</a>.</li><li><strong>Research:</strong> backtest with costs, slippage and held-back data. <a href="/trading-strategy-backtesting/">Learn more</a>.</li><li><strong>Understand:</strong> see whether there are enough trades, which conditions results depend on and how fragile they are.</li><li><strong>Monitor:</strong> get flagged when live behaviour drifts from what you expected. <a href="/strategy-monitoring/">Learn more</a>.</li><li><strong>Manage:</strong> see correlation, concentration and overlap across your whole portfolio. <a href="/portfolio-risk-management/">Learn more</a>.</li></ol>`],
      ['principles', 'What Prospect will and won’t do', `<ul><li>It shows rules you can read and edit, not black-box signals.</li><li>It shows evidence with its limitations, not backtests sold as proof.</li><li>It looks at risk across your whole portfolio, not one trade at a time.</li><li>It assists your decisions. It does not execute trades, manage money or promise returns.</li></ul>`],
      ['status', 'Where it is today', `<p>Prospect is pre-launch. The screens on the homepage are genuine prototype captures; AI drafting is not yet connected. <a href="/#waitlist">Join the waitlist</a> for launch news and a chance to be selected as a beta tester. Referring friends moves you up the list.</p>`]
    ],
    faqs: [],
    related: ['ai-trading-strategy-builder', 'trading-strategy-backtesting', 'systematic-trading']
  },

  'about': {
    kind: 'page',
    eyebrow: 'About',
    h1: 'About Prospect',
    lede: 'Prospect is a UK startup building AI-assisted trading research tools for independent traders. It was founded by Fred Boxer, a systematic trader who wanted better tools for people without a research team behind them.',
    updated: '2026-11-25',
    sections: [
      ['story', 'Why Prospect exists', `<p>Fred founded Prospect after independently building and running systematic trading systems with AI-assisted development. The tools that make careful research possible (precise rules, honest testing, monitoring and portfolio risk) were either locked inside institutions or required serious programming. Meanwhile, retail traders were being sold signals, bots and screenshots.</p><p>Prospect’s ambition is simple: make sophisticated strategy research accessible to independent traders, built around process, evidence and risk rather than hype.</p>`],
      ['today', 'Where we are', `<p>Prospect is pre-launch and in active development. Product screens on this site are prototypes, and there is no confirmed public launch date. The waitlist is open, and some members will be selected as beta testers.</p>`],
      ['company', 'Company details', `<p>Prospect Partnership Ltd, Company No. 15277481, registered in England &amp; Wales. Connect with Fred on <a href="https://www.linkedin.com/in/fred-boxer-93025a388/" rel="noopener noreferrer">LinkedIn</a>.</p>`]
    ],
    faqs: [],
    related: ['systematic-trading', 'ai-trading-strategy-builder', 'trading-strategy-backtesting']
  }
};

export const guideDisclaimer = disclaimer;
// Order for the Insights hub.
export const guideOrder = ['systematic-trading', 'ai-trading-strategy-builder', 'trading-strategy-backtesting', 'strategy-monitoring', 'portfolio-risk-management'];
