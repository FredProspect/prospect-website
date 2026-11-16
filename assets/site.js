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
themeButton?.addEventListener('click', () => {
  saved = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(saved);
  try { localStorage.setItem('prospect-theme', saved); } catch { /* Preference only, never lead data. */ }
});
preference.addEventListener('change', () => { if (!saved) setTheme(preference.matches ? 'dark' : 'light'); });
const previews = {
  home: { image: 'workspace.jpg', height: 971, alt: 'Prospect prototype home. Create or import a strategy, with no portfolio connected.', title: 'A clear place to begin.', copy: 'Start with a strategy idea or bring existing research. This is a genuine prototype capture with no account connected, no holdings and no performance claims.' },
  builder: { image: 'strategy-builder.jpg', height: 922, alt: 'Prospect Strategy Builder prototype: describe, understand, prepare, review, continue. The screen states AI drafting is not connected.', title: 'One thought is enough.', copy: 'The prototype builder begins with your idea, then guides you through a structured workflow. AI drafting is not connected in this captured version. This preview does not run a strategy or produce test results.' }
};
for (const button of document.querySelectorAll('[data-preview]')) button.addEventListener('click', () => {
  const preview = previews[button.dataset.preview];
  const image = document.querySelector('#product-screen');
  image.src = `/assets/product/${preview.image}`;
  // Fixed aspect ratio prevents layout shift when switching screens.
  image.style.aspectRatio = '1440 / 971';
  image.style.objectFit = 'contain';
  image.alt = preview.alt;
  document.querySelector('#preview-title').textContent = preview.title;
  document.querySelector('#preview-copy').textContent = preview.copy;
  document.querySelectorAll('[data-preview]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
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
    const response = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email.value, consent: form.consent.checked, website: form.website.value, source: new URLSearchParams(location.search).get('utm_source') || 'homepage' }), signal: AbortSignal.timeout(12000) });
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
