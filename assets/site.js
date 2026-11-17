const themeButton = document.querySelector('.theme');
const preference = window.matchMedia('(prefers-color-scheme: dark)');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton?.setAttribute('aria-pressed', String(theme === 'dark'));
  themeButton?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
}
let saved;
try { saved = localStorage.getItem('prospect-theme'); } catch { /* Storage is optional. */ }
setTheme(saved === 'light' || saved === 'dark' ? saved : preference.matches ? 'dark' : 'light');
let themeTransition;
themeButton?.addEventListener('click', () => {
  const current = saved || document.documentElement.dataset.theme;
  saved = current === 'dark' ? 'light' : 'dark';
  const target = saved;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduced) {
    themeTransition?.skipTransition();
    const rect = themeButton.getBoundingClientRect();
    document.documentElement.style.setProperty('--theme-x', `${rect.left + rect.width / 2}px`);
    document.documentElement.style.setProperty('--theme-y', `${rect.top + rect.height / 2}px`);
    themeTransition = document.startViewTransition(() => setTheme(target));
    themeTransition.ready.catch(() => { /* A newer theme request may skip this snapshot. */ });
  } else setTheme(target);
  try { localStorage.setItem('prospect-theme', saved); } catch { /* Preference only, never lead data. */ }
});
preference.addEventListener('change', () => { if (!saved) setTheme(preference.matches ? 'dark' : 'light'); });
const previews = {
  home: { image: 'workspace.jpg', height: 971, alt: 'Prospect prototype home. Create or import a strategy, with no portfolio connected.', title: 'A workspace for what’s next.', copy: 'Start with a strategy idea or bring existing research. This is a genuine prototype capture with no account connected, no holdings and no performance claims.' },
  builder: { image: 'strategy-builder.jpg', height: 922, alt: 'Prospect Strategy Builder prototype: describe, understand, prepare, review, continue. The screen states AI drafting is not connected.', title: 'One thought is enough.', copy: 'The prototype builder begins with your idea, then guides you through a structured workflow. AI drafting is not connected in this captured version. This preview does not run a strategy or produce test results.' }
};
let previewRequest = 0;
let previewAnimations = [];
const previewMotion = matchMedia('(prefers-reduced-motion: reduce)');
function clearPreviewMotion() {
  previewAnimations.forEach(animation => animation.cancel());
  previewAnimations = [];
  document.querySelectorAll('.preview-outgoing').forEach(node => node.remove());
}
previewMotion.addEventListener('change', () => { if (previewMotion.matches) clearPreviewMotion(); });
for (const button of document.querySelectorAll('[data-preview]')) button.addEventListener('click', async () => {
  const request = ++previewRequest;
  const preview = previews[button.dataset.preview];
  const image = document.querySelector('#product-screen');
  const stage = document.querySelector('.demo');
  stage.setAttribute('aria-busy', 'true');
  const next = new Image();
  next.src = `/assets/product/${preview.image}`;
  try { await next.decode(); }
  catch { if (request === previewRequest) { stage.removeAttribute('aria-busy'); document.querySelector('#preview-copy').textContent = 'This preview could not load. Please try again.'; } return; }
  if (request !== previewRequest) return;
  clearPreviewMotion();
  if (!previewMotion.matches && image.src !== next.src) {
    const previous = image.cloneNode();
    previous.removeAttribute('id'); previous.alt = ''; previous.setAttribute('aria-hidden', 'true');
    previous.className = 'preview-outgoing';
    previous.style.top = `${image.offsetTop}px`;
    previous.style.left = `${image.offsetLeft}px`;
    previous.style.width = `${image.offsetWidth}px`;
    previous.style.height = `${image.offsetHeight}px`;
    stage.append(previous);
    const exit = previous.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out', fill: 'forwards' });
    exit.addEventListener('finish', () => previous.remove(), { once: true });
    previewAnimations.push(exit);
    previewAnimations.push(image.animate([{ opacity: .3, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' }));
  }
  image.src = next.src;
  image.style.aspectRatio = '1440 / 971';
  image.style.objectFit = 'contain';
  image.alt = preview.alt;
  document.querySelector('#preview-title').textContent = preview.title;
  document.querySelector('#preview-copy').textContent = preview.copy;
  document.querySelectorAll('[data-preview]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  stage.removeAttribute('aria-busy');
});
const form = document.querySelector('#waitlist-form');
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const status = document.querySelector('#form-status');
  const submit = form.querySelector('button[type=submit]');
  submit.disabled = true;
  form.setAttribute('aria-busy', 'true');
  status.classList.remove('error');
  status.textContent = 'Saving your registration…';
  try {
    const response = await fetch(document.querySelector('meta[name=waitlist-endpoint]')?.content || '/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.value, consent: form.consent.checked, website: form.website.value, source: new URLSearchParams(location.search).get('utm_source') || 'homepage' }), signal: AbortSignal.timeout(12000) });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Registration unavailable. Please try again later.');
    status.textContent = result.message;
    form.reset();
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.name === 'TimeoutError' ? 'The request timed out. Please retry; duplicate registrations are handled safely.' : error.message === 'Failed to fetch' ? 'Could not connect. Please try again later.' : error.message;
  } finally {
    submit.disabled = false;
    form.removeAttribute('aria-busy');
    status.focus();
  }
});
