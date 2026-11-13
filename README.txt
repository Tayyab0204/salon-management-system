MEN'S HAIR SALON — AUDITED FULL-STACK SOURCE (2026-11-05)

This is a PostgreSQL-backed salon-management website with a static frontend,
Node/Express APIs, worker and administrator JWT authentication, staff records,
daily entries, expenses, reports, PDF exports and one-time admin recovery codes.

START HERE:
- LIVE_DEPLOYMENT.md — Cloudflare Pages frontend, Node backend and PostgreSQL.
- AUDIT_REPORT.md — source changes, checks and remaining acceptance gates.
- STATIC_CHECK_RESULTS.txt — checks that ran and those blocked in this environment.

LOCAL DEVELOPMENT:
1. Configure backend/.env securely (see backend/.env.example). For local setup,
   set NODE_ENV=development and DB_* or DATABASE_URL, and JWT_SECRET >=32 chars.
2. In backend/ run npm ci and npm start.
3. Serve the frontend on localhost:5500 (e.g., VS Code Live Server).
4. Open index.html; the public shell is visible without login.
5. Log in with an actual PostgreSQL administrator account (never a test login).

IMPORTANT:
- No database contents or .env files are included.
- No default/sample admin credentials are included.
- Browser-local profile photos do not sync across devices.
- Do NOT publish the backend directory with the Cloudflare frontend.
- Deployment is NOT complete until backend HTTPS, database, Cloudflare
  BACKEND_ORIGIN binding and end-to-end acceptance tests are configured.
