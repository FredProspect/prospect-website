// Confirmation email delivery through Resend's HTTP API. No SDK dependency: one POST per email.

/** Returns an async `send({ to, subject, html, text })`, or null when email is not configured. */
export function createResendMailer({ apiKey, from, replyTo, fetchImpl = fetch } = {}) {
  if (!apiKey || !from) return null;
  return async ({ to, subject, html, text }) => {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      // A real reply-to address and a plain-text part both help inbox placement.
      body: JSON.stringify({ from, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw Error(`Email provider responded ${response.status}`);
  };
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Branded, table-based email (renders in Outlook and Gmail), plus a plain-text alternative. */
export function confirmationEmail({ link, siteOrigin }) {
  const safeLink = escapeHtml(link);
  const logo = escapeHtml(`${siteOrigin}/assets/apple-touch-icon.png`);
  const subject = 'Confirm your place on the Prospect waitlist';
  const text = `Confirm your email to secure your place on the Prospect waitlist:\n\n${link}\n\nOnce confirmed, every friend who joins with your referral link (and confirms) moves you up the list. Beta places are limited and not guaranteed.\n\nIf you didn’t sign up, ignore this email and nothing will happen.\n\nProspect Partnership Ltd · England & Wales`;
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#08090a;font-family:Geist,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ecece6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08090a"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#121314;border:1px solid #2a2c2c;border-radius:20px">
<tr><td style="padding:36px 36px 0"><img src="${logo}" width="40" height="40" alt="Prospect" style="display:block;border-radius:10px"></td></tr>
<tr><td style="padding:28px 36px 0"><p style="margin:0;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#2bc48a">One last step</p>
<h1 style="margin:12px 0 0;font-size:32px;line-height:1.1;letter-spacing:-.03em;font-weight:600;color:#ecece6">Confirm your place on the waitlist.</h1>
<p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#a9aca8">Confirm your email to secure your spot. Once you do, every friend who joins with your referral link and confirms moves you up the list, and beta invitations go to the top first.</p></td></tr>
<tr><td style="padding:28px 36px 0"><a href="${safeLink}" style="display:inline-block;background:#2bc48a;color:#04110b;font-size:16px;font-weight:600;text-decoration:none;padding:15px 28px;border-radius:999px">Confirm my email &rarr;</a></td></tr>
<tr><td style="padding:24px 36px 36px"><p style="margin:0;font-size:13px;line-height:1.6;color:#8b8e8b">Button not working? Paste this link into your browser:<br><a href="${safeLink}" style="color:#a9aca8;word-break:break-all">${safeLink}</a></p>
<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#8b8e8b">Beta places are limited and not guaranteed. If you didn’t sign up, ignore this email and nothing will happen. The link expires in 7 days.</p></td></tr>
</table>
<p style="margin:20px 0 0;font-size:12px;color:#6e716f">Prospect Partnership Ltd · Company No. 15277481 · England &amp; Wales</p>
</td></tr></table></body></html>`;
  return { subject, html, text };
}
