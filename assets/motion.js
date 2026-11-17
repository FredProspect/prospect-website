// Progressive enhancement: content is visible and usable before any animation.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const runningAnimations = new Set();
function enter(node, delay = 0, distance = 12, duration = 550, fade = true) {
  if (motionPreference.matches || !node) return;
  const animation = node.animate([
    { opacity: fade ? 0 : 1, translate: `0 ${distance}px` },
    { opacity: 1, translate: '0 0' }
  ], { duration, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
  runningAnimations.add(animation);
  const finish = () => runningAnimations.delete(animation);
  animation.addEventListener('finish', finish, { once: true });
  animation.addEventListener('cancel', finish, { once: true });
}
const hero = document.querySelector('.hero');
if (hero && hero.getBoundingClientRect().bottom > 0) {
  enter(hero.querySelector('.availability'), 0, 8, 500);
  hero.querySelectorAll('.headline-line').forEach((line, index) => enter(line, index * 70, 19, 850, false));
  enter(hero.querySelector('.lede'), 100, 12, 750, false);
  enter(hero.querySelector('.actions'), 60, 8, 500, false);
  enter(hero.querySelector('.fine'), 410, 8, 800);
  enter(hero.querySelector('.hero-preview'), 80, 10, 600, false);
}
// Observe small, independent surfaces so a whole section never disappears.
const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    const node = entry.target;
    if (node.matches('.section-head,.founder-copy,.waitlist-grid > div')) {
      [...node.children].forEach((child, index) => enter(child, Math.min(index * 75, 225), 18));
    } else enter(node, 0, 25, 1000);
    revealObserver.unobserve(node);
  }
}, { threshold: .13 });
document.querySelectorAll('.section-head,.chapter > div,.founder-copy,.founder-portrait,.waitlist-grid > div,.waitlist-grid > form').forEach(node => revealObserver.observe(node));
// Keep native details semantics, with a measured height transition on activation.
const disclosureAnimations = new Map();
for (const details of document.querySelectorAll('.faq details')) {
  const summary = details.querySelector('summary');
  summary.addEventListener('click', event => {
    if (motionPreference.matches) return;
    event.preventDefault();
    const old = disclosureAnimations.get(details);
    const nextOpen = old ? !old.nextOpen : !details.open;
    const from = details.getBoundingClientRect().height;
    old?.animation.cancel();
    details.open = true;
    const to = nextOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + parseFloat(getComputedStyle(details).paddingTop) + parseFloat(getComputedStyle(details).paddingBottom) + 1;
    details.style.overflow = 'hidden';
    const animation = details.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: nextOpen ? 400 : 300, easing: 'cubic-bezier(.22,.7,.2,1)' });
    const settle = () => { details.open = nextOpen; details.style.overflow = ''; disclosureAnimations.delete(details); };
    animation.addEventListener('finish', settle, { once: true });
    disclosureAnimations.set(details, { animation, nextOpen });
    if (nextOpen) enter(details.querySelector('p'), 60, 7, 450);
  });
}
motionPreference.addEventListener('change', () => {
  if (!motionPreference.matches) return;
  runningAnimations.forEach(animation => animation.cancel());
  for (const [details, { animation, nextOpen }] of disclosureAnimations) { animation.cancel(); details.open = nextOpen; details.style.overflow = ''; }
  disclosureAnimations.clear();
});
