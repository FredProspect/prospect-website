// Run only from an authorised host shell. No public export endpoint.
import { DatabaseSync } from 'node:sqlite';
if (!process.env.WAITLIST_DB) throw Error('Set WAITLIST_DB to the private persistent database.');
const db = new DatabaseSync(process.env.WAITLIST_DB, { readOnly: true });
const csv = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
const hasProfiles = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'waitlist_profile'").get();
console.log('email,created_at,consent_version,consent_at,source,role,markets,experience,method,challenge,beta,note,profile_updated_at');
const rows = db.prepare(hasProfiles ? 'SELECT w.*, p.answers, p.updated_at AS profile_updated_at FROM waitlist w LEFT JOIN waitlist_profile p ON p.email = w.email ORDER BY w.created_at' : 'SELECT * FROM waitlist ORDER BY created_at');
for (const row of rows.iterate()) {
  const a = row.answers ? JSON.parse(row.answers) : {};
  console.log([row.email, row.created_at, row.consent_version, row.consent_at, row.source, a.role, (a.markets || []).join(' '), a.experience, a.method, a.challenge, a.beta, a.note, row.profile_updated_at].map(csv).join(','));
}
db.close();
