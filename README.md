# Prospect public website

Customer-first, pre-launch trading research website. Static HTML and a small Node 24 server with a private SQLite waitlist. The trading application is a separate repository and is unchanged.

- [Audit and design direction](docs/AUDIT.md)
- [Implementation, verification and production handoff](docs/HANDOFF.md)
- [Local test measurements](evidence/performance.json)

## Development

```sh
npm ci --ignore-scripts
npm run build
npm start
```

Without waitlist environment variables the form deliberately returns an unavailable state. It never reports an unpersisted registration as successful. To exercise it locally, set `PUBLIC_ORIGIN` to the exact local origin (default `http://localhost:3000`), `WAITLIST_DB` to a private local database path, and `WAITLIST_RATE_SECRET` to a random secret of at least 32 characters. Do not commit `.env` or data. The server does not automatically load `.env`; use your hosting secret manager or Node's `--env-file` option.

## Checks

```sh
npm run check
npm run lint
npm run build
npm test
npm run test:browser
node tests/performance.mjs
```

Browser scripts use the installed `/usr/bin/chromium`; change the executable path for another host. Other engine availability is recorded, never treated as a passing cross-browser check. Tests create temporary SQLite databases with example.com addresses and remove them afterward. Runtime has no npm dependencies. TypeScript was not introduced to an HTML/JavaScript repository; JS syntax and ESLint checks apply.

`npm run build` is deterministic and regenerates tracked HTML from `scripts/pages.mjs` and `scripts/build.mjs`, copies only public assets to `dist/`, and updates sitemap/robots. Edit those source modules rather than generated HTML. No secrets, tests or database files are served.

The canonical site uses GitHub Pages with the dedicated Railway collector in `deployment.json`. A static-only host cannot run the collector itself. See the handoff for a durable, Node deployment and exact-origin CORS configuration and its release gates.
