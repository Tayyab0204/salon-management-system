# Men's Hair Salon — Cloudflare Pages + Node/PostgreSQL activation

## Deployment architecture

- **Cloudflare Pages**: static HTML/CSS/JS + `_worker.js` same-origin API proxy.
- **Separate HTTPS Node host**: Express backend from `backend/` (`npm ci && npm start`).
- **Managed PostgreSQL**: persistent database, backups, TLS. Never deploy `.env` publicly.
- All browser requests use `https://<pages-host>/api/...`; the Pages gateway forwards them to `https://<node-host>/api/...`.

## 1. Prepare production database and backend

1. Back up your existing salon database using PostgreSQL's native backup tooling; do not import old browser/localStorage test data.
2. On your chosen Node/Express hosting provider, configure the runtime for Node.js 22+ and persistent environment variables. Deploy **only** `backend/` to the Node host.
3. Set `NODE_ENV=production`, `JWT_SECRET` to a fresh cryptographically random secret of >=32 characters, `DATABASE_URL` (or `DB_*`), and `DB_SSL=true` when the managed DB supports CA-verified TLS. Configure `CORS_ORIGINS=https://menssalonsite.pages.dev` and any custom web domain you intend to serve directly. `TRUST_PROXY` depends on the host's trusted proxy configuration: do not set blindly.
4. `npm ci && npm start`. Confirm HTTPS `GET /api/health` returns a JSON status. The recovery-code table is created on startup; if runtime DB users lack CREATE permission, create it via an authorized DB migration and keep runtime privileges minimal.
5. Verify admin account exists, reset any temporary/test passwords, and generate an admin recovery code once signed in.
6. Keep the backend private where possible. If directly Internet accessible, apply a provider firewall/WAF, distributed rate limiting if scaling to multiple instances, monitoring and automated database backups.

## 2. Upload frontend to Cloudflare Pages

1. Create/choose a Cloudflare Pages project under **Workers & Pages**. If using dashboard **Direct Upload**, upload `Mens_Salon_Cloudflare_Pages.zip` or its extracted contents. Its root contains `index.html`, `_worker.js`, `css/` and `js/` — NOT the backend folder.
2. In Pages project **Settings > Variables and Secrets**, set the production environment variable `BACKEND_ORIGIN` to **only** the backend origin, e.g. `https://your-backend.example.com` (no `/api`, no trailing slash). Redeploy to apply the variable.
3. The `_worker.js` advanced-mode worker is supported by the Pages dashboard drag-and-drop deployment. Regular `functions/` folders are not supported by dashboard drag-and-drop; this build intentionally uses `_worker.js` instead.
4. Verify opening `https://<pages-host>/` renders the public shell without a login redirect. Verify `https://<pages-host>/api/health` responds successfully; HTTP 503 means `BACKEND_ORIGIN` is missing, HTTP 502 means the backend cannot be reached.
5. If using a custom domain, connect the domain to the Pages project; HTTPS must be active. Add custom domains to the backend `CORS_ORIGINS` list only if browsers access that backend directly.
6. This is a private business application. `robots.txt` and `X-Robots-Tag: noindex` discourage public indexing, but DO NOT restrict access. Admin and worker API permissions must be enforced by the backend.

## 3. Required acceptance tests before real salon launch

1. Fresh browser: site opens as guest; Admin-only data and actions remain restricted.
2. Admin login, logout, profile update, password change, old-token invalidation.
3. Generate a one-time backup recovery code and securely store it; test password recovery, then generate a new code.
4. Create a temporary worker, create login, log in as worker, add today's entry, verify admin can see it. Test current-day edit ownership and deactivation revoking access. Delete/deactivate temporary records according to your retention policy.
5. Admin daily entries, expenses, monthly totals, calendar dates, all-months PDF and date-scoped PDF. Compare exported sums to PostgreSQL.
6. Screen sizes 390, 768, 1440 px in real Chrome or Firefox (desktop & Android) and keyboard navigation. Confirm no horizontal overflow, clipped modals or broken dropdowns.
7. Test server restart and database reconnect; test restore from a **non-production** database backup before launch.
8. Rotate any secrets that were ever shared, and verify observability, rate limits, HTTPS, database backups, recovery procedure and a rollback plan.

## 4. Known limitations and safeguards

- This package has source/static checks, NOT end-to-end tests against your live PostgreSQL or a deployed site. Production must not be described as certified/tested until the tests above pass.
- Cloudflare Pages is **not** a drop-in host for this Node + PostgreSQL server. A separate backend/database deployment is required.
- Browser-local profile images remain browser-local; they will not sync across browsers. Core salon records are PostgreSQL-backed.
- The app still uses some older CSS override files. They were kept to preserve visual compatibility; automatic deletion of apparently redundant selectors without visual regression testing is unsafe.
- Recovery codes are one-time, high entropy, and must be generated in advance. There is no way to show the existing hashed admin password.
- Rate limiting is currently process-local; multi-instance production deployments require a shared persistent rate-limit store.
- Because the web application is JavaScript-rendered and has several existing inline snippets, tightening a Content-Security-Policy requires a separate scripted UI regression pass.

## 5. Rollback

Keep the previous Cloudflare Pages deployment and a tested DB backup. If a critical issue is seen after cutover, roll back frontend/backend builds together, preserve production database and investigate migration compatibility. Never restore database backups over live production without confirming the restore policy.
