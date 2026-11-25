import { useState, type FormEvent } from 'react';
import { EMAIL } from './content';

type Status = { tone: 'idle' | 'busy' | 'done' | 'error'; message: string };

const endpoint = () => document.querySelector<HTMLMetaElement>('meta[name=waitlist-endpoint]')?.content || '/api/waitlist';

const describeError = (error: unknown) => {
  if (!(error instanceof Error)) return 'Registration unavailable. Please try again later.';
  if (error.name === 'TimeoutError') return 'The request timed out. Please retry; duplicate registrations are handled safely.';
  if (error.message === 'Failed to fetch') return 'Could not connect. Please try again later.';
  return error.message;
};

export const Waitlist = ({ suffix = '' }: { suffix?: string }) => {
  const id = (name: string) => name + suffix;
  const [status, setStatus] = useState<Status>({ tone: 'idle', message: '' });

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
        body: JSON.stringify({ email: fields.email.value, consent: fields.consent.checked, website: fields.website.value, source: new URLSearchParams(location.search).get('utm_source') || 'homepage' }),
        signal: AbortSignal.timeout(12000)
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Registration unavailable. Please try again later.');
      form.reset();
      setStatus({ tone: 'done', message: result.message });
    } catch (error) {
      setStatus({ tone: 'error', message: describeError(error) });
    } finally {
      requestAnimationFrame(() => form.querySelector<HTMLElement>('.form-status')?.focus());
    }
  };

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
      <p className="fine" id={id('privacy-note')}>Read our <a href="/privacy/">privacy notice</a>. No guaranteed access or launch date.</p>
      <div id={id('form-status')} className={`form-status${status.tone === 'error' ? ' error' : ''}`} role="status" aria-live="polite" tabIndex={-1}>{status.message}</div>
      <noscript><p className="fine">JavaScript is required to submit this form. You can <a href={`mailto:${EMAIL}`}>contact the founder</a> for help.</p></noscript>
    </form>
  );
};
