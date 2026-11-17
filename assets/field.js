// Mathematical geometry only. No market data, simulated prices or returns.
const canvas = document.querySelector('#intelligence-field');
if (canvas && canvas.getContext('2d')) {
  const ctx = canvas.getContext('2d');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let width = 0, height = 0, columns = 0, rows = 0, positions;
  let visible = false, frame = 0, previous = 0, lastDraw = 0, phase = 0;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0, averageCost = 0;
  let interval = 1000 / 60;
  const hero = canvas.closest('.hero');
  function draw() {
    const started = performance.now();
    ctx.clearRect(0, 0, width, height);
    const turn = -.36 + pointerX * .035;
    const cosine = Math.cos(turn), sine = Math.sin(turn);
    // Each point is computed once, then shared by both sets of grid lines.
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= columns; c++) {
      const x = (c / columns - .5) * 2.8, z = (r / rows - .5) * 2.2;
      const wave = Math.sin(x * 2 + phase) * .17 + Math.cos(z * 3 - x * 1.6 + phase * .6) * .17;
      const y = wave + Math.exp(-Math.pow(x - .35, 2) * 3) * .7;
      const rx = x * cosine - z * sine, rz = x * sine + z * cosine;
      const perspective = 1 / (1 + rz * .17), index = (r * (columns + 1) + c) * 2;
      positions[index] = width * .72 + rx * width * .32 * perspective + pointerX * 7;
      positions[index + 1] = height * .53 + (rz * .25 - y) * height * .64 * perspective + pointerY * 5;
    }
    // Batch the mesh into a handful of paint calls rather than one per line.
    for (let band = 0; band < 4; band++) {
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        if (Math.min(3, Math.floor(Math.sin(r / rows * Math.PI) * 4)) !== band) continue;
        for (let c = 0; c <= columns; c++) {
          const i = (r * (columns + 1) + c) * 2;
          if (c === 0) ctx.moveTo(positions[i], positions[i + 1]); else ctx.lineTo(positions[i], positions[i + 1]);
        }
      }
      ctx.strokeStyle = `rgba(135,232,171,${.065 + band * .045})`; ctx.lineWidth = .6; ctx.stroke();
    }
    ctx.beginPath();
    for (let c = 0; c <= columns; c++) for (let r = 0; r <= rows; r++) {
      const i = (r * (columns + 1) + c) * 2;
      if (r === 0) ctx.moveTo(positions[i], positions[i + 1]); else ctx.lineTo(positions[i], positions[i + 1]);
    }
    ctx.strokeStyle = 'rgba(140,238,179,.085)'; ctx.lineWidth = .5; ctx.stroke();
    const highlight = Math.round((Math.sin(phase * .45) * .4 + .5) * rows);
    ctx.beginPath();
    for (let c = 0; c <= columns; c++) {
      const i = (highlight * (columns + 1) + c) * 2;
      if (c === 0) ctx.moveTo(positions[i], positions[i + 1]); else ctx.lineTo(positions[i], positions[i + 1]);
    }
    ctx.strokeStyle = 'rgba(165,250,191,.24)'; ctx.lineWidth = .8; ctx.stroke();
    ctx.beginPath();
    for (let r = 0; r <= rows; r += 2) for (let c = 0; c <= columns; c += 2) {
      const i = (r * (columns + 1) + c) * 2;
      ctx.rect(positions[i], positions[i + 1], 1.15, 1.15);
    }
    ctx.fillStyle = 'rgba(185,255,207,.43)'; ctx.fill();
    averageCost = averageCost * .9 + (performance.now() - started) * .1;
    // Keep the motion light on slower devices instead of forcing a frame budget.
    if (width > 720 && averageCost > 8) interval = 1000 / 30;
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; previous = 0; lastDraw = 0;
  }
  function animate(stamp) {
    if (!visible || preference.matches || document.hidden) { stop(); return; }
    const delta = previous ? Math.min(stamp - previous, 50) : 0;
    previous = stamp;
    phase += delta * .00018;
    const smoothing = 1 - Math.exp(-delta / 180);
    pointerX += (targetX - pointerX) * smoothing;
    pointerY += (targetY - pointerY) * smoothing;
    if (stamp - lastDraw >= interval - .6) { draw(); lastDraw = stamp; }
    frame = requestAnimationFrame(animate);
  }
  function start() {
    if (visible && !preference.matches && !document.hidden && !frame) frame = requestAnimationFrame(animate);
  }
  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width; height = box.height;
    const compact = width <= 720;
    columns = compact ? 44 : 70; rows = compact ? 26 : 40;
    positions = new Float32Array((columns + 1) * (rows + 1) * 2);
    interval = 1000 / (compact || navigator.hardwareConcurrency <= 4 ? 30 : 60);
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: .02 }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  preference.addEventListener('change', () => {
    if (preference.matches) { stop(); targetX = targetY = pointerX = pointerY = 0; phase = 0; draw(); }
    else start();
  });
  hero.addEventListener('pointermove', event => {
    if (preference.matches || !finePointer.matches) return;
    const rect = hero.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width - .5;
    targetY = (event.clientY - rect.top) / rect.height - .5;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { targetX = targetY = 0; }, { passive: true });
  resize();
}
