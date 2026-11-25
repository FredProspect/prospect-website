import { useEffect, useState, type FormEvent } from 'react';
import { EMAIL } from './content';

type Status = { tone: 'idle' | 'busy' | 'done' | 'error'; message: string };
export type Standing = { code: string; referrals: number; tier: 'low' | 'medium' | 'high'; confirmed?: boolean };

/** Outcome of arriving from the confirmation email (?confirmed=1 or ?confirmed=invalid), shown once. */
let arrival: 'confirmed' | 'invalid' | null = null;

const SITE = 'https://prospectpartnership.co.uk/';
const CODE_KEY = 'prospect-referral-code';
const REF_KEY = 'prospect-referred-by';
const CODE_PATTERN = /^[A-HJKMNP-Z2-9]{8}$/;

const endpoint = () => document.querySelector<HTMLMetaElement>('meta[name=waitlist-endpoint]')?.content || '/api/waitlist';
// Storage is a convenience only: private windows and blocked storage must still work.
const store = { get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } }, set: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* optional */ } }, drop: (key: string) => { try { localStorage.removeItem(key); } catch { /* optional */ } } };

/** The referral code a visitor arrived with (?ref=CODE), remembered across page loads until they join. */
const incomingReferral = () => {
  const fromUrl = new URLSearchParams(location.search).get('ref')?.trim().toUpperCase() ?? '';
  if (CODE_PATTERN.test(fromUrl)) { store.set(REF_KEY, fromUrl); return fromUrl; }
  return store.get(REF_KEY) ?? undefined;
};

const describeError = (error: unknown) => {
  if (!(error instanceof Error)) return 'Registration unavailable. Please try again later.';
  if (error.name === 'TimeoutError') return 'The request timed out. Please retry; duplicate registrations are handled safely.';
  if (error.message === 'Failed to fetch') return 'Could not connect. Please try again later.';
  return error.message;
};

const TIERS = {
  low: { label: 'Low on the list', step: 1, next: (r: number) => `Refer ${3 - r} more ${3 - r === 1 ? 'friend' : 'friends'} to move to the middle of the list.` },
  medium: { label: 'Middle of the list', step: 2, next: (r: number) => `Refer ${5 - r} more ${5 - r === 1 ? 'friend' : 'friends'} to move high up the list.` },
  high: { label: 'High up the list', step: 3, next: () => 'You’re among the first in line for beta invitations. Keep sharing to stay there.' }
} as const;

/** Shared by both forms: every Waitlist instance on the page shows the same standing. */
const listeners = new Set<(standing: Standing | null) => void>();
const broadcast = (standing: Standing | null) => listeners.forEach(listener => listener(standing));

const ConfirmPrompt = ({ code }: { code: string }) => {
  const [note, setNote] = useState('');
  const resend = async () => {
    setNote('Sending…');
    try {
      const response = await fetch(`${endpoint()}/resend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }), signal: AbortSignal.timeout(10000) });
      const result = await response.json();
      setNote(result.message || result.error || 'Please try again shortly.');
    } catch { setNote('Could not connect. Please try again shortly.'); }
  };
  return (
    <div className="confirm-prompt">
      <p><strong>Check your inbox to confirm your email.</strong> Your place, and any friends you refer, only count once confirmed.</p>
      <button type="button" className="referral-reset" onClick={resend}>Resend confirmation email</button>
      <span className="confirm-note" role="status" aria-live="polite">{note}</span>
    </div>
  );
};

const ReferralCard = ({ standing, onReset, suffix }: { standing: Standing; onReset: () => void; suffix: string }) => {
  const link = `${SITE}?ref=${standing.code}`;
  const tier = TIERS[standing.tier] ?? TIERS.low;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { window.prompt('Copy your referral link', link); }
  };
  const share = () => navigator.share?.({ title: 'Prospect', text: 'I’ve joined the Prospect waitlist. Join with my link to help us both move up.', url: link }).catch(() => undefined);
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  return (
    <div className="referral-card" role="region" aria-label="Your waitlist place">
      {arrival === 'confirmed' && standing.confirmed !== false && <p className="referral-notice is-good" role="status">Email confirmed. Your place is secured.</p>}
      {arrival === 'invalid' && <p className="referral-notice" role="status">That confirmation link has expired or was already used.{standing.confirmed === false ? ' Send yourself a new one below.' : ''}</p>}
      {standing.confirmed === false && <ConfirmPrompt code={standing.code} />}
      <p className="referral-eyebrow">You’re on the list</p>
      <p className="referral-place">{tier.label}</p>
      <div className="tier-meter" aria-hidden="true">{[1, 2, 3].map(step => <span key={step} className={step <= tier.step ? 'is-on' : ''} />)}</div>
      <p className="referral-copy">
        <strong>{tier.next(standing.referrals)}</strong> Beta invitations go to the top of the list first.
        {standing.referrals > 0 && <> You’ve referred {standing.referrals} so far.</>}
      </p>
      <div className="referral-link">
        <label className="sr-only" htmlFor={`referral-link${suffix}`}>Your referral link</label>
        <input id={`referral-link${suffix}`} readOnly value={link} onFocus={event => event.currentTarget.select()} />
        <button type="button" className="btn btn-solid" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
        {canShare && <button type="button" className="btn btn-ghost" onClick={share}>Share</button>}
      </div>
      <button type="button" className="referral-reset" onClick={onReset}>Not you? Join with another email</button>
    </div>
  );
};

export const Waitlist = ({ suffix = '' }: { suffix?: string }) => {
  const id = (name: string) => name + suffix;
  const [status, setStatus] = useState<Status>({ tone: 'idle', message: '' });
  const [standing, setStanding] = useState<Standing | null>(null);

  useEffect(() => {
    listeners.add(setStanding);
    return () => { listeners.delete(setStanding); };
  }, []);

  // Returning members see their live place instead of the form. Only the first form fetches.
  useEffect(() => {
    if (suffix) return;
    const outcome = new URLSearchParams(location.search).get('confirmed');
    if (outcome) {
      arrival = outcome === '1' ? 'confirmed' : 'invalid';
      const clean = new URL(location.href);
      clean.searchParams.delete('confirmed');
      history.replaceState(null, '', clean);
    }
    const code = store.get(CODE_KEY);
    if (!code || !CODE_PATTERN.test(code)) return;
    fetch(`${endpoint()}/status?code=${code}`, { signal: AbortSignal.timeout(8000) })
      .then(response => (response.ok ? response.json() : null))
      .then(result => { if (result?.referral) broadcast(result.referral); else if (result === null) store.drop(CODE_KEY); })
      .catch(() => undefined);
  }, [suffix]);

  const reset = () => { store.drop(CODE_KEY); broadcast(null); setStatus({ tone: 'idle', message: '' }); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fields = form.elements as unknown as Record<'email' | 'consent' | 'website', HTMLInputElement>;
    setStatus({ tone: 'busy', message: 'Saving your registration…' });
    try {
      const response = await fetch(endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.email.value, consent: fields.consent.checked, website: fields.website.value, source: new URLSearchParams(location.search).get('utm_source') || 'homepage', ref: incomingReferral() }),
        signal: AbortSignal.timeout(12000)
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Registration unavailable. Please try again later.');
      form.reset();
      setStatus({ tone: 'done', message: result.message });
      if (result.referral) {
        store.set(CODE_KEY, result.referral.code);
        store.drop(REF_KEY);
        broadcast(result.referral);
      }
    } catch (error) {
      setStatus({ tone: 'error', message: describeError(error) });
    } finally {
      requestAnimationFrame(() => form.querySelector<HTMLElement>('.form-status')?.focus());
    }
  };

  if (standing) return <ReferralCard standing={standing} onReset={reset} suffix={suffix} />;

  const busy = status.tone === 'busy';
  return (
    <form id={id('waitlist-form')} className={`waitlist${status.tone === 'done' ? ' is-done' : ''}`} method="post" action="/api/waitlist" onSubmit={submit} aria-busy={busy || undefined}>
      <label className="sr-only" htmlFor={id('email')}>Email address</label>
      <div className="field">
        <input type="email" id={id('email')} name="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" aria-describedby={`${id('privacy-note')} ${id('form-status')}`} />
        <button type="submit" className="btn btn-solid submit" disabled={busy}>
          <span>Join the waitlist</span><span className="btn-arrow" aria-hidden="true">→</span>
        </button>
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor={id('website')}>Leave this field empty</label><input id={id('website')} name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
      <label className="consent" htmlFor={id('consent')}>
        <input type="checkbox" id={id('consent')} name="consent" required />
        <span>I agree to receive emails about Prospect’s launch and early access. I can withdraw consent at any time by emailing Prospect.</span>
      </label>
      <p className="fine" id={id('privacy-note')}>Read our <a href="/privacy/">privacy notice</a>. Beta places are limited and not guaranteed.</p>
      <div id={id('form-status')} className={`form-status${status.tone === 'error' ? ' error' : ''}`} role="status" aria-live="polite" tabIndex={-1}>{status.message}</div>
      <noscript><p className="fine">JavaScript is required to submit this form. You can <a href={`mailto:${EMAIL}`}>contact the founder</a> for help.</p></noscript>
    </form>
  );
};
