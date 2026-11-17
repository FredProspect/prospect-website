// An original parametric sculpture: woven ideas, ordered research, connected risk.
// Geometry is conceptual. It contains no market data or simulated product results.
const visual = document.querySelector('.reactive-visual');
if (visual) {
  const canvas = visual.querySelector('canvas');
  const stage = visual.querySelector('.visual-stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const notes = [
    'Start with a question about the markets.',
    'Give your idea clear rules and questions to investigate.',
    'Explore how strategies could interact and share risk.'
  ];
  let renderer;
  let frame = 0, previous = 0, lastDraw = 0, visible = false, phase = 0;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  let weights = [1, 0, 0], targetWeights = [1, 0, 0];
  let interval = 1000 / 60, contextLost = false, slowFrames = 0;
  const fallback = visual.querySelector('.sculpture-fallback');
  canvas.dataset.renderer = 'compositor';

  const add = (a, b) => a.map((v, i) => v + b[i]);
  const scale = (a, s) => a.map(v => v * s);
  const unit = a => scale(a, 1 / (Math.hypot(...a) || 1));
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const turn = (p, x, y, z) => {
    const a = [p[0], p[1] * Math.cos(x) - p[2] * Math.sin(x), p[1] * Math.sin(x) + p[2] * Math.cos(x)];
    const b = [a[0] * Math.cos(y) + a[2] * Math.sin(y), a[1], -a[0] * Math.sin(y) + a[2] * Math.cos(y)];
    return [b[0] * Math.cos(z) - b[1] * Math.sin(z), b[0] * Math.sin(z) + b[1] * Math.cos(z), b[2]];
  };
  function centre(t, scene, group) {
    if (scene === 0) {
      const radius = 1.02 + .34 * Math.cos(3 * t);
      return [radius * Math.cos(2 * t), radius * Math.sin(2 * t), .43 * Math.sin(3 * t)];
    }
    if (scene === 1) return [1.26 * Math.cos(t), .92 * Math.sin(t), .34 * Math.sin(2 * t)];
    const angle = group * Math.PI * 2 / 3;
    return add(turn([.82 * Math.cos(t), .82 * Math.sin(t), 0], .65, group * .72, angle), [.53 * Math.cos(angle), .53 * Math.sin(angle), (group - 1) * .18]);
  }
  function geometry(segments) {
    const strands = 24, sides = 8, count = strands * (segments + 1) * sides;
    const positions = [0, 1, 2].map(() => new Float32Array(count * 3));
    const normals = [0, 1, 2].map(() => new Float32Array(count * 3));
    const materials = new Float32Array(count);
    const indices = [];
    for (let strand = 0; strand < strands; strand++) {
      const group = Math.floor(strand / 8);
      for (let segment = 0; segment <= segments; segment++) {
        const t = segment / segments * Math.PI * 2;
        for (let scene = 0; scene < 3; scene++) {
          const c = centre(t, scene, group);
          const tangent = unit(add(centre(t + .001, scene, group), scale(centre(t - .001, scene, group), -1)));
          const normal = unit(cross(tangent, scene === 2 ? [0, 1, .3] : [0, 0, 1]));
          const binormal = unit(cross(tangent, normal));
          const twist = scene === 0 ? t + .45 * Math.sin(3 * t) : scene === 1 ? 2 * t + .35 : t * 2;
          const direction = add(scale(normal, Math.cos(twist)), scale(binormal, Math.sin(twist)));
          const offset = scene === 2 ? (strand % 8 - 3.5) * .033 : (strand - 11.5) * .026;
          const path = add(c, scale(direction, offset));
          // Round filaments give the twisted band fine ridges and real self-occlusion.
          for (let side = 0; side < sides; side++) {
            const theta = side / sides * Math.PI * 2;
            const n = add(scale(normal, Math.cos(theta)), scale(binormal, Math.sin(theta)));
            const p = add(path, scale(n, scene === 2 ? .014 : .0125));
            const index = (strand * (segments + 1) * sides + segment * sides + side);
            positions[scene].set(p, index * 3); normals[scene].set(n, index * 3);
            materials[index] = strand / (strands - 1);
            if (scene === 0 && segment < segments) {
              const next = strand * (segments + 1) * sides + segment * sides + (side + 1) % sides;
              indices.push(index, next, index + sides, next, next + sides, index + sides);
            }
          }
        }
      }
    }
    return { positions, normals, materials, indices: new Uint16Array(indices), triangles: indices.length / 3 };
  }
  function createRenderer() {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!gl) return null;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
    // Software rasterisers and memory-constrained devices keep the exact artwork,
    // with inexpensive compositor motion instead of a continuously drawn mesh.
    if (/swiftshader|llvmpipe|software|microsoft basic/i.test(gpu) || navigator.deviceMemory <= 2) return null;
    const vertex = `#version 300 es
      precision highp float;
      in vec3 p0; in vec3 p1; in vec3 p2;
      in vec3 n0; in vec3 n1; in vec3 n2; in float strand;
      uniform vec3 weights; uniform vec3 rotation; uniform float aspect;
      out vec3 position; out vec3 normal; out float filament;
      vec3 rotate(vec3 p) {
        p.xy=mat2(cos(rotation.z),sin(rotation.z),-sin(rotation.z),cos(rotation.z))*p.xy;
        p.yz=mat2(cos(rotation.x),sin(rotation.x),-sin(rotation.x),cos(rotation.x))*p.yz;
        p.xz=mat2(cos(rotation.y),-sin(rotation.y),sin(rotation.y),cos(rotation.y))*p.xz;
        return p;
      }
      void main() {
        position=rotate(p0*weights.x+p1*weights.y+p2*weights.z);
        normal=rotate(n0*weights.x+n1*weights.y+n2*weights.z);
        filament=strand;
        float distance=5.25-position.z;
        gl_Position=vec4(position.x*2.72/aspect,position.y*2.72,((20.0+0.1)/(20.0-0.1))*distance-2.0*20.0*0.1/(20.0-0.1),distance);
      }`;
    const fragment = `#version 300 es
      precision highp float;
      in vec3 position; in vec3 normal; in float filament;
      uniform float dark;
      out vec4 colour;
      void main() {
        vec3 n=normalize(normal);
        vec3 v=normalize(vec3(0.,0.,5.25)-position);
        if(!gl_FrontFacing) n=-n;
        vec3 reflected=reflect(-v,n);
        vec3 light=normalize(vec3(-.55,1.,1.1));
        float diffuse=max(dot(n,light),0.);
        float fresnel=pow(1.-max(dot(n,v),0.),3.);
        float variation=.5+.5*sin(filament*21.7);
        vec3 pigment=mix(vec3(.012,.12,.075),vec3(.055,.40,.24),variation*.6+.2);
        vec3 ambient=mix(vec3(.23,.40,.32),vec3(.62,.88,.74),n.y*.5+.5);
        vec3 base=pigment*(.44+diffuse*.8+ambient*.5);
        // Broad and narrow studio reflections accentuate every individual ridge.
        float panel=pow(max(dot(reflected,normalize(vec3(-.65,.7,1.))),0.),24.);
        float strip=pow(max(dot(reflected,normalize(vec3(.9,.35,.6))),0.),70.);
        float top=pow(max(dot(reflected,normalize(vec3(.1,1.,-.2))),0.),36.);
        base+=vec3(.70,.97,.82)*panel*.95+vec3(.94,1.,.96)*strip*.85;
        base+=vec3(.22,.60,.41)*top*.7+vec3(.13,.39,.26)*fresnel;
        base*=mix(.94,1.25,dark);
        colour=vec4(pow(base,vec3(.78)),1.);
      }`;
    const compile = (type, source) => {
      const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;
    const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const mesh = geometry(innerWidth < 720 ? 144 : 240);
    const attribute = (name, data, size) => {
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, name); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    };
    mesh.positions.forEach((data, i) => attribute(`p${i}`, data, 3));
    mesh.normals.forEach((data, i) => attribute(`n${i}`, data, 3));
    attribute('strand', mesh.materials, 1);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    const uniforms = Object.fromEntries(['weights', 'rotation', 'aspect', 'dark'].map(key => [key, gl.getUniformLocation(program, key)]));
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
    canvas.dataset.renderer = 'webgl2'; canvas.dataset.triangles = mesh.triangles;
    return () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform3fv(uniforms.weights, weights);
      gl.uniform3f(uniforms.rotation, .42 + pointerY * .3 + Math.sin(phase * .6) * .035, -.22 + pointerX * .5 + Math.sin(phase) * .16, -.28 + Math.cos(phase * .4) * .05);
      gl.uniform1f(uniforms.aspect, canvas.width / canvas.height);
      gl.uniform1f(uniforms.dark, Number(document.documentElement.dataset.theme === 'dark'));
      gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      visual.classList.add('visual-ready');
    };
  }
  function draw() {
    if (renderer && !contextLost) renderer();
    else {
      fallback.style.transform = `perspective(850px) rotateX(${-pointerY * 10}deg) rotateY(${pointerX * 16}deg) translateY(${Math.sin(phase) * 6}px) rotate(${Math.sin(phase * .6) * 1.5}deg)`;
    }
  }
  function useComposite() {
    renderer = null; canvas.dataset.renderer = 'compositor';
    visual.classList.remove('visual-ready');
    fallback.src = `/assets/intelligence-sculpture-${visual.dataset.scene}.webp`;
    canvas.style.opacity = '0';
  }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0; lastDraw = 0; }
  function animate(stamp) {
    if (!visible || reduced.matches || document.hidden) { stop(); return; }
    const delta = previous ? Math.min(stamp - previous, 60) : 0;
    previous = stamp; phase += delta * .00022;
    if (renderer && delta > 48) slowFrames++; else slowFrames = Math.max(0, slowFrames - .25);
    if (slowFrames > 10) useComposite();
    const blend = 1 - Math.exp(-delta / 380);
    pointerX += (targetX - pointerX) * blend; pointerY += (targetY - pointerY) * blend;
    weights = weights.map((weight, i) => weight + (targetWeights[i] - weight) * blend);
    if (stamp - lastDraw >= interval - .6) { draw(); lastDraw = stamp; }
    frame = requestAnimationFrame(animate);
  }
  function start() { if (visible && !reduced.matches && !document.hidden && !frame) frame = requestAnimationFrame(animate); }
  function resize() {
    const rect = stage.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    interval = 1000 / (rect.width < 420 || navigator.hardwareConcurrency <= 4 ? 30 : 60);
    draw();
  }
  for (const button of visual.querySelectorAll('[data-visual-step]')) button.addEventListener('click', () => {
    const scene = Number(button.dataset.visualStep);
    visual.dataset.scene = String(scene);
    targetWeights = [0, 1, 2].map(index => Number(index === scene));
    visual.querySelector('.workflow-note').textContent = notes[scene];
    if (!renderer || contextLost) {
      const next = `/assets/intelligence-sculpture-${scene}.webp`;
      const image = new Image(); image.src = next;
      image.decode().then(() => {
        if (Number(visual.dataset.scene) !== scene) return;
        fallback.src = next;
        if (!reduced.matches) fallback.animate([{ opacity: .3, scale: '.97' }, { opacity: 1, scale: '1' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
      }).catch(() => { /* Keep the previous valid illustration if loading fails. */ });
    }
    visual.querySelectorAll('[data-visual-step]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    if (reduced.matches) { weights = [...targetWeights]; draw(); } else start();
  });
  stage.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches) return;
    const rect = stage.getBoundingClientRect(); targetX = (event.clientX - rect.left) / rect.width - .5; targetY = (event.clientY - rect.top) / rect.height - .5;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { targetX = targetY = 0; }, { passive: true });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); contextLost = true; useComposite(); start(); });
  canvas.addEventListener('webglcontextrestored', () => { contextLost = false; renderer = createRenderer(); canvas.style.opacity = renderer ? '1' : '0'; resize(); start(); });
  // The same rendered artwork remains when WebGL is unavailable or disabled.
  renderer = createRenderer();
  if (!renderer) useComposite();
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: .05 }).observe(stage);
  new MutationObserver(() => { if (!frame) draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  reduced.addEventListener('change', () => { if (reduced.matches) { stop(); weights = [...targetWeights]; pointerX = pointerY = targetX = targetY = 0; phase = 0; fallback.getAnimations().forEach(animation => animation.cancel()); draw(); } else start(); });
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
