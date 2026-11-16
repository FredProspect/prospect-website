// The mounted volume may initially be root-owned. Initialise its private directory,
// then drop privileges before opening a socket or accepting any visitor data.
import { mkdirSync, chownSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
if (process.getuid?.() === 0) {
  const folder = dirname(resolve(process.env.WAITLIST_DB || '/var/lib/prospect/waitlist.sqlite'));
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  chownSync(folder, 1000, 1000);
  chmodSync(folder, 0o700);
  process.setgid(1000);
  process.setuid(1000);
}
const { createApp } = await import('../server.mjs');
createApp().listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log('Prospect public website ready'));
