// A mathematical research landscape, never market prices or simulated returns.
const canvas = document.querySelector('#intelligence-field');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0, height = 0, active = false, frame = 0, last = 0, time = 0;
  const pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
  function resize() {
    const box = canvas.getBoundingClientRect(); width = box.width; height = box.height;
    canvas.width = width * pixelRatio; canvas.height = height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0); draw(time);
  }
  function point(u, v, t) {
    const x = (u - .5) * 2.8;
    const z = (v - .5) * 2.2;
    const wave = Math.sin(x * 2 + t) * .17 + Math.cos(z * 3 - x * 1.6 + t * .6) * .17;
    const fold = Math.exp(-Math.pow(x - .35, 2) * 3) * .7;
    const y = wave + fold;
    const turn = -.36;
    const rx = x * Math.cos(turn) - z * Math.sin(turn), rz = x * Math.sin(turn) + z * Math.cos(turn);
    const perspective = 1 / (1 + rz * .17);
    return [width * .72 + rx * width * .32 * perspective, height * .53 + (rz * .25 - y) * height * .64 * perspective, perspective];
  }
  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    const cols = width < 600 ? 48 : 70, rows = width < 600 ? 28 : 40;
    for (let r = 0; r <= rows; r++) {
      const v = r / rows;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) { const p = point(c / cols, v, t); if (!c) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
      ctx.strokeStyle = `rgba(120,225,162,${.07 + Math.sin(v * Math.PI) * .17})`; ctx.lineWidth = .6; ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) { const p = point(c / cols, r / rows, t); if (!r) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }
      ctx.strokeStyle = 'rgba(136,238,176,.08)'; ctx.lineWidth = .5; ctx.stroke();
    }
    for (let r = 0; r <= rows; r += 2) for (let c = 0; c <= cols; c += 2) {
      const p = point(c / cols, r / rows, t), alpha = .18 + Math.max(0, Math.sin(c * .31 + r * .19 + t)) * .5;
      ctx.fillStyle = `rgba(175,255,198,${alpha})`; ctx.fillRect(p[0], p[1], 1.15, 1.15);
    }
  }
  function animate(stamp) {
    if (!active || reduced.matches || document.hidden) { frame = 0; return; }
    if (stamp - last > 40) { time += .008; draw(time); last = stamp; }
    frame = requestAnimationFrame(animate);
  }
  function start() { if (active && !reduced.matches && !document.hidden && !frame) frame = requestAnimationFrame(animate); }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => { active = entries[0].isIntersecting; start(); }, { threshold: .05 }).observe(canvas);
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener('change', () => { if (reduced.matches) draw(0); else start(); });
  resize();
}
// Reveal once as content enters view; content is visible without JavaScript.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('reveal'); observer.unobserve(entry.target); }
  }, { threshold: .12 });
  document.querySelectorAll('.section-head,.chapter,.founder-copy,.founder-portrait,.waitlist-grid').forEach(node => observer.observe(node));
}
