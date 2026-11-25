import { useEffect, useRef, useState } from 'react';
import Threads from './bits/Threads/Threads';
import DarkVeil from './bits/DarkVeil/DarkVeil';
import SpotlightCard from './bits/SpotlightCard/SpotlightCard';
import Magnet from './bits/Magnet/Magnet';
import ScrollReveal from './bits/ScrollReveal/ScrollReveal';
import { Waitlist } from './Waitlist';
import { EMAIL, LINKEDIN, faqs, previews, principles, steps, type PreviewKey } from './content';
import { EASE, gsap, revealLines, ScrollTrigger, useGsap, useSmoothScroll } from './motion';

const Arrow = () => <span className="btn-arrow" aria-hidden="true">→</span>;

const Header = () => {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = ref.current!;
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY;
      header.classList.toggle('is-scrolled', y > 24);
      header.classList.toggle('is-hidden', y > 480 && y > last + 2);
      if (y < last - 2) header.classList.remove('is-hidden');
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className="site-header" ref={ref}>
      <a className="skip" href="#main">Skip to content</a>
      <div className="nav">
        <a className="brand" href="/" aria-label="Prospect home"><img src="/assets/prospect-lockup-dark.png" width="138" height="32" alt="Prospect" /></a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#about">About</a><a href={`mailto:${EMAIL}`}>Contact</a>
        </nav>
        <Magnet padding={40} magnetStrength={4} maxOffset={8} wrapperClassName="nav-cta-wrap">
          <a className="btn btn-solid btn-sm" href="#waitlist">Join waitlist <Arrow /></a>
        </Magnet>
      </div>
    </header>
  );
};

const Hero = () => {
  const ref = useRef<HTMLElement>(null);
  useGsap(ref, root => {
    const intro = gsap.timeline({ defaults: { ease: EASE } });
    intro.from('.hero-bg', { opacity: 0, duration: 2.4, ease: 'power2.out' }, 0)
      .add(revealLines('.hero h1', { duration: 1.5, stagger: 0.12 }), 0.15)
      .from('.hero .reveal', { y: 24, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.55);
    gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero-inner', { yPercent: -18, opacity: 0, ease: 'none' }, 0)
      .to('.hero-bg', { scale: 1.18, yPercent: 10, ease: 'none' }, 0);
  });
  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden="true">
        <Threads color="#8a8f93" accentColor="#2bc48a" lineCount={46} amplitude={1.1} distance={0.25} speed={0.35} angle={-12} parting={0.35} taper={0.9} brightness={1.1} fade={0.45} opacity={0.85} enableMouseInteraction />
      </div>
      <div className="hero-inner wrap">
        <p className="pill reveal"><span className="dot" aria-hidden="true" />Pre-launch · Waitlist open</p>
        <h1 id="hero-title">AI for{' '}<br />the trader.</h1>
        <p className="lede reveal">Develop strategies, question the evidence and understand your risk across every strategy you run. AI-assisted trading research, being built for independent traders.</p>
        <div className="reveal hero-form"><Waitlist /></div>
      </div>
      <div className="hero-foot wrap reveal">
        <span>Built for independent minds</span>
        <div className="marquee"><span className="sr-only">Retail traders, prop traders, systematic thinkers</span>
          <div className="marquee-track" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => <span key={i}>Retail traders <i>/</i> Prop traders <i>/</i> Systematic thinkers <i>/</i> </span>)}
          </div>
        </div>
        <a className="scroll-cue" href="#manifesto" aria-label="Scroll to learn more"><span /></a>
      </div>
    </section>
  );
};

const Manifesto = () => (
  <section className="manifesto wrap" id="manifesto" aria-label="Our principles">
    <p className="eyebrow">Our position</p>
    <ScrollReveal textClassName="manifesto-text" baseOpacity={0.12} enableBlur blurStrength={6} baseRotation={0} stagger={0.04}>
      Retail traders have been sold signals, bots and screenshots. Prospect is being built around process, evidence and risk.
    </ScrollReveal>
  </section>
);

const Product = () => {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<PreviewKey>('home');
  const preview = previews[active];
  useGsap(ref, root => {
    revealLines(root.querySelector('h2')!, { scrollTrigger: { trigger: root, start: 'top 70%' } });
    gsap.fromTo('.frame', { rotateX: 18, scale: 0.86, yPercent: 6 }, { rotateX: 0, scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.frame-stage', start: 'top 95%', end: 'top 15%', scrub: true } });
  });
  const select = (key: PreviewKey) => {
    if (key === active) return;
    const shot = ref.current?.querySelector('.frame-shot');
    if (shot && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(shot, { opacity: 0.2, scale: 1.02 }, { opacity: 1, scale: 1, duration: 0.9, ease: EASE });
    setActive(key);
  };
  return (
    <section id="product" className="section product" ref={ref}>
      <div className="wrap section-head">
        <div><p className="eyebrow">The platform</p><h2>A first look at what we’re building.</h2></div>
        <p>These are genuine prototype screens from the Prospect workspace. Waitlist members are first to see what comes next.</p>
      </div>
      <div className="wrap frame-stage">
        <div className="frame">
          <div className="frame-bar"><span className="frame-dots" aria-hidden="true"><i /><i /><i /></span><span>Product preview</span><span className="tag">In development</span></div>
          <img id="product-screen" className="frame-shot" src={preview.image} width={1440} height={preview.height} loading="lazy" alt={preview.alt} />
        </div>
      </div>
      <div className="wrap preview-controls">
        <div className="seg" role="group" aria-label="Select a product preview">
          {(Object.keys(previews) as PreviewKey[]).map(key => (
            <button key={key} type="button" data-preview={key} aria-pressed={active === key} onClick={() => select(key)}>{previews[key].label}</button>
          ))}
        </div>
        <div className="preview-copy" aria-live="polite"><h3 id="preview-title">{preview.title}</h3><p id="preview-copy">{preview.copy}</p></div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const ref = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  useGsap(ref, root => {
    revealLines(root.querySelector('h2')!, { scrollTrigger: { trigger: root, start: 'top 70%' } });
    gsap.matchMedia().add('(min-width: 900px)', () => {
      const cards = gsap.utils.toArray<HTMLElement>('.step-card', root);
      gsap.set(cards.slice(1), { yPercent: 115 });
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
        trigger: '.steps-pin', start: 'top top+=96', end: () => `+=${innerHeight * (cards.length - 1) * 0.85}`, pin: true, scrub: 0.6,
        snap: { snapTo: 1 / (cards.length - 1), duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut' },
        onUpdate: self => setCurrent(Math.round(self.progress * (cards.length - 1)))
      } });
      cards.slice(1).forEach((card, i) => {
        tl.to(card, { yPercent: 0 }, i).to(cards[i], { scale: 0.92, opacity: 0.35, filter: 'blur(2px)' }, i);
      });
    });
  });
  return (
    <section id="how-it-works" className="section how" ref={ref}>
      <div className="wrap section-head">
        <div><p className="eyebrow">How it works</p><h2>From first idea to the whole portfolio.</h2></div>
        <p>One connected workflow, with AI at each step and your judgement at the end of it. <a className="text-link" href="/trading-strategy-backtesting/">What a backtest can tell you →</a></p>
      </div>
      <div className="wrap steps-pin">
        <ol className="step-rail" aria-hidden="true">
          {steps.map((step, i) => <li key={step.name} className={i === current ? 'is-active' : i < current ? 'is-done' : ''}><span>0{i + 1}</span>{step.name}</li>)}
        </ol>
        <div className="step-stack">
          {steps.map((step, i) => (
            <article className="step-card" key={step.name}>
              <div className="step-copy">
                <p className="kicker"><span>0{i + 1}</span> {step.name}</p>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
                <p className="tag">In development</p>
              </div>
              <div className="spec">
                <p className="spec-head"><span>{step.name}</span><span>Illustrative example</span></p>
                <dl aria-label={`Illustrative ${step.name.toLowerCase()} example`}>
                  {step.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                </dl>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const Principles = () => {
  const ref = useRef<HTMLElement>(null);
  useGsap(ref, root => {
    revealLines(root.querySelector('h2')!, { scrollTrigger: { trigger: root, start: 'top 70%' } });
    gsap.from('.principle', { y: 60, opacity: 0, duration: 1.2, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: '.principles-grid', start: 'top 80%' } });
    gsap.utils.toArray<HTMLElement>('.strike', root).forEach(line => {
      gsap.from(line, { scaleX: 0, duration: 1, ease: 'power3.inOut', scrollTrigger: { trigger: line, start: 'top 75%' } });
    });
  });
  return (
    <section className="section principles" ref={ref} aria-labelledby="principles-title">
      <div className="wrap section-head">
        <div><p className="eyebrow">Our principles</p><h2 id="principles-title">Built against the noise.</h2></div>
        <p>Prospect is being built around process, evidence and risk. <a className="text-link" href="/portfolio-risk-management/">Explore portfolio risk →</a></p>
      </div>
      <div className="wrap principles-grid">
        {principles.map(([topic, them, us]) => (
          <SpotlightCard key={topic} className="principle" spotlightColor="rgba(43, 196, 138, 0.16)" intensity={0.8} spotlightSize={420} borderGlow={0.5} theme="dark">
            <p className="principle-topic">{topic}</p>
            <p className="them"><span className="sr-only">Common in retail trading tools: </span>{them}<span className="strike" aria-hidden="true" /></p>
            <p className="us"><span className="sr-only">What Prospect is being built for: </span>{us}</p>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
};

const Founder = () => {
  const ref = useRef<HTMLElement>(null);
  useGsap(ref, root => {
    gsap.fromTo('.portrait', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.portrait', start: 'top 80%' } });
    gsap.fromTo('.portrait img', { yPercent: -8, scale: 1.15 }, { yPercent: 8, scale: 1.05, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } });
    revealLines(root.querySelector('h2')!, { scrollTrigger: { trigger: root, start: 'top 65%' } });
    gsap.from('.founder-copy .reveal', { y: 30, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: '.founder-copy', start: 'top 60%' } });
  });
  return (
    <section id="about" className="section founder" ref={ref}>
      <div className="wrap founder-grid">
        <figure className="portrait-wrap">
          <div className="portrait"><img src="/assets/fred-boxer.jpg" width={509} height={637} loading="lazy" alt="Fred Boxer, founder of Prospect" /></div>
          <figcaption><span>Fred Boxer</span><span>Founder, Prospect</span></figcaption>
        </figure>
        <div className="founder-copy">
          <p className="eyebrow">From the founder</p>
          <h2>Better tools for independent minds.</h2>
          <p className="reveal big">Fred Boxer founded Prospect after independently building and operating systematic trading systems with AI-assisted development.</p>
          <p className="reveal">Prospect is being built around a simple ambition: make sophisticated strategy development and trading intelligence accessible to independent traders. Exploring an idea should not begin with a wall of technical complexity.</p>
          <p className="reveal">We’re still building. If that’s a future you’d like to help shape, join the waitlist and come along.</p>
          <div className="signature reveal"><div>Fred Boxer<span>Founder · Prospect</span></div><a className="text-link" href={LINKEDIN} target="_blank" rel="noopener noreferrer">Connect on LinkedIn →</a></div>
        </div>
      </div>
    </section>
  );
};

const Faq = () => {
  const ref = useRef<HTMLElement>(null);
  useGsap(ref, root => {
    revealLines(root.querySelector('h2')!, { scrollTrigger: { trigger: root, start: 'top 70%' } });
    gsap.from('.faq details', { y: 30, opacity: 0, duration: 1, ease: EASE, stagger: 0.07, scrollTrigger: { trigger: '.faq', start: 'top 80%' } });
  });
  return (
    <section className="section faq-section" ref={ref} aria-labelledby="faq-title">
      <div className="wrap faq-grid">
        <div><p className="eyebrow">FAQ</p><h2 id="faq-title">A few good questions.</h2><p className="faq-contact">Something else? <a className="text-link" href={`mailto:${EMAIL}`}>Email the founder →</a></p></div>
        <div className="faq">
          {faqs.map(([q, a]) => (
            <details key={q}><summary>{q}<span className="plus" aria-hidden="true" /></summary><div className="answer"><p>{a}</p></div></details>
          ))}
        </div>
      </div>
    </section>
  );
};

const Closing = () => {
  const ref = useRef<HTMLElement>(null);
  useGsap(ref, root => {
    gsap.fromTo('.closing-card', { clipPath: 'inset(12% 8% 12% 8% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 25%', scrub: true } });
    revealLines(root.querySelector('h2')!, { scrollTrigger: { trigger: root, start: 'top 55%' } });
  });
  return (
    <section id="waitlist" className="closing" ref={ref}>
      <div className="wrap">
        <div className="closing-card">
          <div className="closing-bg" aria-hidden="true"><DarkVeil color="#1f8f66" speed={0.25} scale={1.3} flow={0.8} brightness={0.85} glow={0.35} grain={0.04} fade={0.3} mouseInteraction={false} /></div>
          <div className="closing-copy">
            <p className="eyebrow">The waitlist</p>
            <h2>Be part of what comes next.</h2>
            <p>Join the Prospect waitlist for launch and early-access news. No account. No trading credentials.</p>
          </div>
          <Waitlist suffix="-end" />
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const ref = useRef<HTMLElement>(null);
  useGsap(ref, () => {
    gsap.from('.wordmark span', { yPercent: 100, duration: 1.4, ease: EASE, stagger: 0.04, scrollTrigger: { trigger: '.wordmark', start: 'top 95%' } });
  });
  return (
    <footer className="site-footer" ref={ref}>
      <div className="wrap">
        <div className="footer-top">
          <p className="footer-tag">Sophisticated trading intelligence, made accessible.</p>
          <nav className="footer-col" aria-label="Explore"><p className="footer-label">Explore</p><a href="#product">The product</a><a href="#how-it-works">How it works</a><a href="#about">Meet the founder</a><a href="/insights/">Research essentials</a><a href="#waitlist">Join the waitlist</a></nav>
          <nav className="footer-col" aria-label="Company"><p className="footer-label">Company</p><a href={`mailto:${EMAIL}`}>Email Prospect</a><a href={LINKEDIN} rel="noopener noreferrer" target="_blank">Fred Boxer on LinkedIn</a><a href="/privacy/">Privacy notice</a><a href="/terms/">Website terms</a><a href="/accessibility/">Accessibility</a><a href="/cookies/">Cookies</a></nav>
        </div>
        <p className="wordmark" aria-hidden="true">{'Prospect'.split('').map((c, i) => <span key={i}>{c}</span>)}</p>
        <div className="legal">
          <p>© 2026 Prospect Partnership Ltd · Company No. 15277481 · England &amp; Wales</p>
          <p>Prospect is pre-launch and under development. Product previews show the current prototype, not a released service. Trading involves risk of loss. Historical testing does not predict future results. Nothing on this website is investment advice. Prospect does not execute trades or move your funds.</p>
        </div>
      </div>
    </footer>
  );
};

export const App = () => {
  useSmoothScroll();
  useEffect(() => {
    document.documentElement.classList.add('js');
    const refresh = () => ScrollTrigger.refresh();
    addEventListener('load', refresh);
    return () => removeEventListener('load', refresh);
  }, []);
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Manifesto />
        <Product />
        <HowItWorks />
        <Principles />
        <Founder />
        <Faq />
        <Closing />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </>
  );
};
