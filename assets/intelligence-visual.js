// An illustrative research landscape, not market data or simulated performance.
const visual = document.querySelector('.reactive-visual');
if (visual) {
  const canvas = visual.querySelector('canvas');
  const context = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const note = visual.querySelector('.workflow-note');
  const notes = [
    'Start with a question about the markets.',
    'Give your idea clear rules and questions to investigate.',
    'Explore how strategies could interact and share risk.'
  ];
  let width = 0, height = 0, columns = 0, rows = 0, positions;
  let frame = 0, previous = 0, lastDraw = 0, visible = false, phase = 0, interval = 1000 / 60;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0, cost = 0;
  let weights = [1, 0, 0], targetWeights = [1, 0, 0];
  let appliedX = 0, appliedY = 0;
  function draw() {
    if (!context || !positions) return;
    const start = performance.now();
    const dark = document.documentElement.dataset.theme === 'dark';
    const rgb = dark ? '140,235,181' : '18,103,71';
    context.clearRect(0, 0, width, height);
    const angle = -.5 + pointerX * .12, cosine = Math.cos(angle), sine = Math.sin(angle);
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= columns; c++) {
      const x = (c / columns - .5) * 2.8, z = (r / rows - .5) * 2.4;
      const ripple = Math.sin(x * 2.6 + z * 2 + phase) * .035;
      const idea = Math.exp(-(x * x + z * z) * 1.6) * .9 + ripple;
      const strategy = Math.exp(-Math.pow(z - x * .25, 2) * 4) * .66 + Math.sin(x * 2 + phase * .4) * .06;
      const portfolio = (Math.exp(-((x + .7) ** 2 + (z + .35) ** 2) * 4) + Math.exp(-((x - .65) ** 2 + (z + .4) ** 2) * 4) + Math.exp(-((x - .1) ** 2 + (z - .7) ** 2) * 4)) * .66;
      const elevation = weights[0] * idea + weights[1] * strategy + weights[2] * portfolio;
      const rx = x * cosine - z * sine, rz = x * sine + z * cosine;
      const perspective = 1 / (1 + rz * .15), i = (r * (columns + 1) + c) * 2;
      positions[i] = width * .5 + rx * width * .28 * perspective + pointerX * 12;
      positions[i + 1] = height * .59 + (rz * .2 - elevation * .5) * height * perspective + pointerY * 8;
    }
    // Batch line and point paints to keep the visual light on CPU and GPU.
    for (let band = 0; band < 4; band++) {
      context.beginPath();
      for (let r = 0; r <= rows; r++) {
        if (Math.min(3, Math.floor(Math.sin(r / rows * Math.PI) * 4)) !== band) continue;
        for (let c = 0; c <= columns; c++) {
          const i = (r * (columns + 1) + c) * 2;
          if (!c) context.moveTo(positions[i], positions[i + 1]); else context.lineTo(positions[i], positions[i + 1]);
        }
      }
      context.strokeStyle = `rgba(${rgb},${.07 + band * .055})`; context.lineWidth = .8; context.stroke();
    }
    context.beginPath();
    for (let c = 0; c <= columns; c++) for (let r = 0; r <= rows; r++) {
      const i = (r * (columns + 1) + c) * 2;
      if (!r) context.moveTo(positions[i], positions[i + 1]); else context.lineTo(positions[i], positions[i + 1]);
    }
    context.strokeStyle = `rgba(${rgb},.10)`; context.lineWidth = .6; context.stroke();
    context.beginPath();
    for (let r = 0; r <= rows; r += 3) for (let c = 0; c <= columns; c += 3) {
      const i = (r * (columns + 1) + c) * 2; context.rect(positions[i], positions[i + 1], 1.5, 1.5);
    }
    context.fillStyle = `rgba(${rgb},.45)`; context.fill();
    cost = cost * .9 + (performance.now() - start) * .1;
    if (cost > 8) interval = 1000 / 30;
  }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0; lastDraw = 0; }
  function animate(stamp) {
    if (!visible || reduced.matches || document.hidden) { stop(); return; }
    const delta = previous ? Math.min(stamp - previous, 50) : 0;
    previous = stamp; phase += delta * .00018;
    const blend = 1 - Math.exp(-delta / 220);
    pointerX += (targetX - pointerX) * blend; pointerY += (targetY - pointerY) * blend;
    weights = weights.map((weight, index) => weight + (targetWeights[index] - weight) * blend);
    if (Math.abs(pointerX - appliedX) + Math.abs(pointerY - appliedY) > .005) {
      visual.style.setProperty('--tilt-x', `${pointerX * 12}deg`); visual.style.setProperty('--tilt-y', `${-pointerY * 10}deg`);
      appliedX = pointerX; appliedY = pointerY;
    }
    if (stamp - lastDraw >= interval - .6) { draw(); lastDraw = stamp; }
    frame = requestAnimationFrame(animate);
  }
  function start() { if (context && visible && !reduced.matches && !document.hidden && !frame) frame = requestAnimationFrame(animate); }
  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    columns = width < 420 ? 44 : 64; rows = width < 420 ? 26 : 36;
    positions = new Float32Array((columns + 1) * (rows + 1) * 2);
    interval = 1000 / (width < 420 || navigator.hardwareConcurrency <= 4 ? 30 : 60);
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
  }
  for (const button of visual.querySelectorAll('[data-visual-step]')) button.addEventListener('click', () => {
    const scene = Number(button.dataset.visualStep);
    visual.dataset.scene = String(scene);
    targetWeights = [0, 1, 2].map(index => Number(index === scene));
    note.textContent = notes[scene];
    visual.querySelectorAll('[data-visual-step]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    if (reduced.matches) { weights = [...targetWeights]; draw(); } else start();
  });
  const stage = visual.querySelector('.visual-stage');
  stage.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches) return;
    const rect = stage.getBoundingClientRect(); targetX = (event.clientX - rect.left) / rect.width - .5; targetY = (event.clientY - rect.top) / rect.height - .5;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { targetX = targetY = 0; }, { passive: true });
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: .05 }).observe(stage);
  new MutationObserver(() => { if (!frame) draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  reduced.addEventListener('change', () => { if (reduced.matches) { stop(); weights = [...targetWeights]; pointerX = pointerY = targetX = targetY = 0; phase = 0; draw(); } else start(); });
  resize();
}
// Supporting SVG motion pauses outside the viewport and when the tab is hidden.
const supportingVisuals = [...document.querySelectorAll('.relationship-graphic,.workflow-ribbon')];
const supportingObserver = new IntersectionObserver(entries => {
  for (const entry of entries) entry.target.classList.toggle('is-inview', entry.isIntersecting && !document.hidden);
}, { threshold: .1 });
supportingVisuals.forEach(node => supportingObserver.observe(node));
document.addEventListener('visibilitychange', () => supportingVisuals.forEach(node => {
  const rect = node.getBoundingClientRect(); node.classList.toggle('is-inview', !document.hidden && rect.bottom > 0 && rect.top < innerHeight);
}));
