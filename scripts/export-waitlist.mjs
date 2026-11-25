// Run only from an authorised host shell, e.g. `railway ssh`. Ranked CSV including referral standing.
import { DatabaseSync } from 'node:sqlite';
import { exportCsv } from '../server.mjs';
if (!process.env.WAITLIST_DB) throw Error('Set WAITLIST_DB to the private persistent database.');
const db = new DatabaseSync(process.env.WAITLIST_DB, { readOnly: true });
process.stdout.write(exportCsv(db));
db.close();
