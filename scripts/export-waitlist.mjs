// Run only from an authorised host shell. No public export endpoint.
import { DatabaseSync } from 'node:sqlite';
if (!process.env.WAITLIST_DB) throw Error('Set WAITLIST_DB to the private persistent database.');
const db = new DatabaseSync(process.env.WAITLIST_DB, { readOnly: true });
const csv = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
console.log('email,created_at,consent_version,consent_at,source');
for (const row of db.prepare('SELECT * FROM waitlist ORDER BY created_at').iterate()) console.log(Object.values(row).map(csv).join(','));
db.close();
