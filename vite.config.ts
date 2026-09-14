import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import type { ServerResponse } from 'node:http'

/**
 * ── PRISM dev-server trace proxy ───────────────────────────────────────────
 *
 * PRISM's HTTP ingestion API (`POST {PRISMTRACE_HOST}/api/traces`) is
 * authenticated with `X-PRISMtrace-Key: ${PRISMTRACE_API_KEY}`. Those
 * credentials stay server-side: the browser posts a credential-free trace
 * to this same-origin proxy (`/api/prism/trace`), which attaches the header
 * and forwards to the PRISM host. Transport failures are logged and never
 * thrown — PRISM must not be able to break GreenPlan.
 *
 * On Vercel, the same behavior lives in `api/prism/trace.ts`.
 */
function prismTraceProxy(): Plugin {
  const makeHandler =
    (env: Record<string, string>) =>
    async (req: Connect.IncomingMessage, res: ServerResponse) => {
      try {
        const host = (env.PRISMTRACE_HOST ?? '').replace(/\/+$/, '')
        const apiKey = env.PRISMTRACE_API_KEY
        const projectId = env.PRISMTRACE_PROJECT_ID

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = Buffer.concat(chunks)

        if (!host || !apiKey) {
          // Tracing not configured — succeed silently, never block the app.
          res.statusCode = 204
          res.end()
          return
        }

        // Attach project_id server-side so the client payload never carries it.
        let payload: Record<string, unknown> = {}
        if (body.length > 0) {
          try {
            payload = JSON.parse(body.toString('utf8')) as Record<string, unknown>
          } catch {
            payload = {}
          }
        }
        if (projectId && payload.project_id === undefined) payload.project_id = projectId

        const upstream = await fetch(`${host}/api/traces`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-PRISMtrace-Key': apiKey,
          },
          body: JSON.stringify(payload),
        })
        res.statusCode = upstream.status
        res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
        res.end(await upstream.text())
      } catch (error) {
        // Observability must never crash the app under any upstream condition.
        console.warn(
          '[prism-proxy] trace forward failed:',
          error instanceof Error ? error.message : error,
        )
        res.statusCode = 204
        res.end()
      }
    }

  const configure = (envDir: string | false | undefined) => {
    const env = loadEnv(typeof envDir === 'string' ? envDir : process.cwd(), process.cwd(), '')
    return makeHandler(env)
  }

  return {
    name: 'prism-trace-proxy',
    configureServer(server) {
      server.middlewares.use('/api/prism/trace', configure(server.config.envDir))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/prism/trace', configure(server.config.envDir))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), prismTraceProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
