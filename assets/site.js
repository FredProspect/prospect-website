const themeButton = document.querySelector('.theme');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton?.setAttribute('aria-pressed', String(theme === 'dark'));
  themeButton?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
}
let saved;
try { saved = localStorage.getItem('prospect-theme'); } catch { /* Storage is optional. */ }
setTheme(saved === 'light' || saved === 'dark' ? saved : 'light');
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
