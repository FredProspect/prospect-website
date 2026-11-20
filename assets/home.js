// Homepage behaviour: waitlist forms, the synthetic studio demo, prototype tabs and the optional questionnaire.
// Content and forms remain usable before this runs; animation respects reduced motion.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const endpoint = () => document.querySelector('meta[name=waitlist-endpoint]')?.content || '/api/waitlist';
const source = (new URLSearchParams(location.search).get('utm_source') || 'homepage').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 100);

/* ---------- Studio demo ---------- */
const studio = document.querySelector('[data-studio]');
if (studio) {
  studio.dataset.js = '';
  const panes = [...studio.querySelectorAll('[data-pane]')];
  const buttons = [...studio.querySelectorAll('[data-step]')];
  const typed = studio.querySelector('.prompt-text');
  const full = typed.dataset.type;
  let timers = [];
  let autoplay = true;
  const clear = () => { timers.forEach(clearTimeout); timers = []; delete studio.dataset.typing; };
  function show(step) {
    panes.forEach((pane, i) => { pane.classList.toggle('on', i <= step); pane.classList.toggle('current', i === step); });
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === step)));
  }
  function type(done) {
    if (reduced.matches) { typed.textContent = full; return done(); }
    studio.dataset.typing = '';
    typed.textContent = '';
    let i = 0;
    const tick = () => {
      i += 2; typed.textContent = full.slice(0, i);
      if (i < full.length) timers.push(setTimeout(tick, 22)); else { delete studio.dataset.typing; done(); }
    };
    tick();
  }
  function play() {
    clear(); show(0);
    type(() => {
      [1, 2, 3].forEach((s, k) => timers.push(setTimeout(() => { if (autoplay) show(s); }, 650 + k * 1500)));
    });
  }
  buttons.forEach((button, i) => button.addEventListener('click', () => {
    autoplay = false; clear(); typed.textContent = full; show(i);
  }));
  // Play once when visible; movement is purposeful, not perpetual.
  const observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { observer.disconnect(); if (reduced.matches) show(3); else play(); }
  }, { threshold: .35 });
  show(0);
  observer.observe(studio);
}

/* ---------- Prototype tabs ---------- */
const protos = {
  workspace: { src: '/assets/product/workspace.jpg', h: 971, alt: 'Prospect prototype workspace: create or import a strategy, with no portfolio connected.', cap: 'Prototype workspace. Start with an idea or bring your existing research.' },
  builder: { src: '/assets/product/strategy-builder.jpg', h: 922, alt: 'Prospect Strategy Builder prototype: describe, understand, prepare, review, continue. AI drafting is not connected in this version.', cap: 'Prototype strategy builder. AI drafting is not connected in this captured version.' }
};
for (const button of document.querySelectorAll('[data-proto]')) button.addEventListener('click', async () => {
  const p = protos[button.dataset.proto];
  const img = document.querySelector('#proto-img');
  const next = new Image(); next.src = p.src;
  try { await next.decode(); } catch { return; }
  img.src = p.src; img.height = p.h; img.alt = p.alt;
  document.querySelector('#proto-cap').textContent = p.cap;
  document.querySelectorAll('[data-proto]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
});

/* ---------- Questionnaire ---------- */
const questions = [
  { key: 'role', title: 'Which best describes you?', options: [['retail', 'Retail trader, my own capital'], ['prop-funded', 'Funded prop-firm trader'], ['prop-challenge', 'Working towards a prop-firm challenge'], ['professional', 'Professional or institutional'], ['exploring', 'Just exploring']] },
  { key: 'markets', multi: true, title: 'What do you trade?', hint: 'Choose as many as you like.', options: [['forex', 'Forex'], ['indices-futures', 'Indices & futures'], ['stocks', 'Stocks'], ['crypto', 'Crypto'], ['commodities', 'Commodities'], ['options', 'Options']] },
  { key: 'experience', title: 'How long have you been trading?', options: [['under-1', 'Less than a year'], ['1-3', '1–3 years'], ['3-5', '3–5 years'], ['5-plus', 'More than 5 years']] },
  { key: 'method', title: 'How do you build strategies today?', options: [['discretionary', 'Charts and gut feel'], ['spreadsheets', 'Spreadsheets and notes'], ['code', 'I code them (Pine, Python, MQL…)'], ['no-code-tools', 'No-code tools'], ['not-yet', 'I don’t have a process yet']] },
  { key: 'challenge', title: 'What’s the hardest part right now?', options: [['ideas-to-rules', 'Turning ideas into clear rules'], ['testing', 'Testing them properly'], ['understanding-results', 'Understanding why results change'], ['portfolio-risk', 'Managing risk across strategies'], ['consistency', 'Staying consistent']] },
  { key: 'note', text: true, title: 'If Prospect could do one thing for you, what would it be?', hint: 'Optional. A sentence is plenty.' },
  { key: 'beta', title: 'Would you like to be considered for the first beta group?', hint: 'Beta testers give feedback on early versions. Places are limited and not guaranteed.', options: [['yes', 'Yes, count me in'], ['no', 'Not right now']] }
];
const dialog = document.querySelector('#qf');
const stage = document.querySelector('#qf-stage');
const bar = document.querySelector('#qf-bar');
let qState = null;
const letters = 'ABCDEFGH';
const el = (tag, attrs = {}, text) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text !== undefined) n.textContent = text; return n; };

function renderQuestion() {
  const { index, answers } = qState;
  bar.style.width = `${(index / questions.length) * 100}%`;
  stage.replaceChildren();
  if (index >= questions.length) return finish();
  const q = questions[index];
  const wrap = el('div', { class: 'qf-q' + (reduced.matches ? '' : ' enter') });
  wrap.append(el('p', { class: 'qf-num' }, `${index + 1} of ${questions.length}`), el('h2', { id: 'qf-title', tabindex: '-1' }, q.title));
  if (q.hint) wrap.append(el('p', { class: 'qf-hint' }, q.hint));
  else wrap.append(el('p', { class: 'qf-hint' }, q.multi ? '' : 'Choose one.'));
  let focusTarget;
  if (q.text) {
    const area = el('textarea', { class: 'qf-text', maxlength: '500', 'aria-labelledby': 'qf-title', placeholder: 'Type your answer…' });
    area.value = answers.note || '';
    area.addEventListener('input', () => { answers.note = area.value; });
    wrap.append(area); focusTarget = area;
  } else {
    const group = el('div', { class: 'qf-opts', role: q.multi ? 'group' : 'radiogroup', 'aria-labelledby': 'qf-title' });
    q.options.forEach(([value, label], i) => {
      const selected = q.multi ? (answers[q.key] || []).includes(value) : answers[q.key] === value;
      const opt = el('button', { type: 'button', class: 'qf-opt', 'data-value': value, ...(q.multi ? { 'aria-pressed': String(selected) } : { role: 'radio', 'aria-checked': String(selected) }) });
      opt.append(el('span', { class: 'qf-key', 'aria-hidden': 'true' }, letters[i]), el('span', {}, label));
      opt.addEventListener('click', () => choose(q, value, opt, group));
      group.append(opt);
    });
    wrap.append(group);
    focusTarget = group.querySelector('[aria-checked=true],[aria-pressed=true]') || group.firstChild;
  }
  const nav = el('div', { class: 'qf-nav' });
  const next = el('button', { type: 'button', class: 'qf-next' }, index === questions.length - 1 ? 'Finish' : 'OK →');
  next.addEventListener('click', advance);
  nav.append(next);
  if (index > 0) { const back = el('button', { type: 'button', class: 'qf-back' }, '← Back'); back.addEventListener('click', () => { qState.index--; renderQuestion(); }); nav.append(back); }
  const skip = el('button', { type: 'button', class: 'qf-skip' }, 'Skip'); skip.addEventListener('click', advance); nav.append(skip);
  if (matchMedia('(hover: hover)').matches) nav.append(el('span', { class: 'qf-enter', 'aria-hidden': 'true' }, q.text ? '' : 'or press Enter ↵'));
  wrap.append(nav);
  stage.append(wrap);
  focusTarget?.focus({ preventScroll: true });
}
function choose(q, value, opt, group) {
  const { answers } = qState;
  if (q.multi) {
    const set = new Set(answers[q.key] || []);
    set.has(value) ? set.delete(value) : set.add(value);
    answers[q.key] = [...set];
    opt.setAttribute('aria-pressed', String(set.has(value)));
  } else {
    answers[q.key] = value;
    group.querySelectorAll('.qf-opt').forEach(o => o.setAttribute('aria-checked', String(o === opt)));
    setTimeout(advance, reduced.matches ? 0 : 260); // Typeform-style auto-advance on single choice.
  }
}
function advance() { qState.index++; renderQuestion(); }
async function finish() {
  bar.style.width = '100%';
  const wrap = el('div', { class: 'qf-q qf-done' + (reduced.matches ? '' : ' enter') });
  const tick = el('div', { class: 'qf-tick', 'aria-hidden': 'true' });
  tick.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const title = el('h2', { id: 'qf-title', tabindex: '-1' }, 'Saving your answers…');
  const hint = el('p', { class: 'qf-hint', role: 'status' });
  wrap.append(tick, title, hint);
  stage.replaceChildren(wrap);
  title.focus();
  const answers = { ...qState.answers };
  if (typeof answers.note === 'string') answers.note = answers.note.trim().slice(0, 500);
  try {
    const res = await fetch(endpoint().replace(/\/api\/waitlist$/, '/api/waitlist/profile'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: qState.email, token: qState.token, answers }), signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw Error();
    title.textContent = 'Thank you. You’re on the list.';
    hint.textContent = 'Your answers help us decide who to invite first. We’ll email you with early-access news.';
  } catch {
    title.textContent = 'You’re on the list.';
    hint.textContent = 'We couldn’t save your answers just now, but your waitlist place is saved.';
  }
  const share = el('div', { class: 'qf-share' });
  const copy = el('button', { type: 'button', class: 'qf-next' }, 'Share Prospect');
  copy.addEventListener('click', async () => {
    const url = 'https://prospectpartnership.co.uk/?utm_source=share';
    try {
      if (navigator.share) await navigator.share({ title: 'Prospect · AI for the trader', url });
      else { await navigator.clipboard.writeText(url); copy.textContent = 'Link copied'; }
    } catch { /* Share dismissed. */ }
  });
  const close = el('button', { type: 'button', class: 'qf-back', 'data-qf-close': '' }, 'Back to site');
  close.addEventListener('click', () => dialog.close());
  share.append(copy, close);
  wrap.append(share);
}
function openQuestions(email, token) {
  if (!dialog?.showModal || !token) return false;
  qState = { email, token, index: 0, answers: {} };
  dialog.showModal();
  renderQuestion();
  return true;
}
dialog?.querySelector('.qf-close')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('keydown', event => {
  if (!qState || qState.index >= questions.length) return;
  const q = questions[qState.index];
  if (event.target.tagName === 'TEXTAREA') { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) advance(); return; }
  if (event.key === 'Enter' && event.target.classList?.contains('qf-opt')) return; // Native button activation.
  if (event.key === 'Enter' && !event.target.closest?.('button')) { event.preventDefault(); advance(); return; }
  const i = letters.indexOf(event.key.toUpperCase());
  if (!q.text && i >= 0 && i < q.options.length && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    stage.querySelectorAll('.qf-opt')[i]?.click();
  }
});

/* ---------- Waitlist forms ---------- */
for (const form of document.querySelectorAll('[data-join]')) form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const status = form.querySelector('.j-status');
  const submit = form.querySelector('button[type=submit]');
  submit.disabled = true;
  form.setAttribute('aria-busy', 'true');
  status.classList.remove('error');
  status.textContent = 'Saving your place…';
  const email = form.email.value;
  try {
    const response = await fetch(endpoint(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, consent: form.consent.checked, website: form.website.value, source }), signal: AbortSignal.timeout(12000) });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Registration unavailable. Please try again later.');
    status.textContent = result.message;
    form.reset();
    if (openQuestions(email.trim().toLowerCase(), result.profileToken)) return;
  } catch (error) {
    status.classList.add('error');
    status.textContent = error.name === 'TimeoutError' ? 'The request timed out. Please retry; duplicate registrations are handled safely.' : error.message === 'Failed to fetch' ? 'Could not connect. Please try again later.' : error.message;
  } finally {
    submit.disabled = false;
    form.removeAttribute('aria-busy');
  }
  status.focus();
});
