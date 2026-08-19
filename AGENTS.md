# AGENTS.md

## Cursor Cloud specific instructions

`studomaticno` is a PWA dashboard that acts as a backend proxy/scraper for the live
**Eduneta** student portal (`https://eduneta.hr`). There are two services:

| Service  | Dir        | Dev command    | Port | Notes |
|----------|------------|----------------|------|-------|
| Backend  | `backend/` | `npm run dev`  | 3001 | Express, ES modules, `node --watch` hot reload |
| Frontend | `frontend/`| `npm run dev`  | 5173 | Vite + React; dev server proxies `/api` → `http://localhost:3001` |

Convenience scripts at the repo root start both together: `./dev.sh` (foreground) or
`./restart.sh` (kills ports 3001/5173, restarts, logs to `/tmp/backend.log` and
`/tmp/frontend.log`). Build the frontend with `npm run build` in `frontend/`.

Non-obvious caveats:

- **No lint or test tooling** is configured (no ESLint config, no test runner/scripts).
- **`backend/.env` is gitignored** and not required for local dev — the backend falls back
  to sensible defaults (port 3001, a fixed dev session secret, and CORS for
  `http://localhost:5173`). Copy `backend/.env.example` → `backend/.env` if you want to
  override anything.
- **Full login/dashboard requires real Eduneta student credentials** plus outbound network
  access to `eduneta.hr`. There is no local mock. With invalid credentials the backend
  correctly proxies to the live portal and returns the Croatian error
  `Neispravno korisničko ime ili lozinka` ("Incorrect username or password"); the frontend
  then shows a "Sesija je istekla" (session expired) modal. This is the expected
  no-credentials behavior and confirms the frontend → backend → Eduneta pipeline works.
- Quick health checks without credentials: `curl http://localhost:3001/api/health` and
  `curl http://localhost:3001/api/debug/test-encoding`.
- The backend parses Windows-1250 encoded Croatian HTML (via `iconv-lite`/`cheerio`); the UI
  is localized in Croatian.
