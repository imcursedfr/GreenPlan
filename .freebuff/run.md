# GreenPlan — run doc

Vite dev server for the GreenPlan (Sustainable Home Planner) React app.

## 1. Reproduce uncommitted artifacts

- `.env` lives in the main checkout (`C:\Users\ragha\OneDrive\Desktop\AI 2\.env`) and is gitignored. **Procedure:** copy it from the main checkout into this worktree root. Never commit it; adapt ports/URLs only if needed (none are port-specific).
- `node_modules`: install with npm — `npm install` (esbuild's postinstall is allowed via `allowScripts` in package.json).

## 2. Run the server

```
npm run dev
```

- Default port **5173** (set in `vite.config.ts`, `host: true`).
- Detached (Windows / this workspace):

```
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput 'C:\Users\ragha\OneDrive\Desktop\AI 2\.freebuff\preview-47e549d9-26f0-4b75-856b-e3805e6e8135.log' -RedirectStandardError 'C:\Users\ragha\OneDrive\Desktop\AI 2\.freebuff\preview-47e549d9-26f0-4b75-856b-e3805e6e8135.log.err' -WindowStyle Hidden -PassThru).Id"
```

- Log file: `.freebuff\preview-47e549d9-26f0-4b75-856b-e3805e6e8135.log` (stderr in `.log.err`).
- Verify: `curl http://localhost:5173/` returns 200.

Other scripts: `npm run typecheck` (tsc -b), `npm run build`, `npm run preview` (built app), `npm run smoke` (calculation engine smoke test).
