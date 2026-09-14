/** Minimal Vercel Node function types (avoids a build-time dependency). */
interface VercelRequest {
  method?: string
  body: unknown
}
interface VercelResponse {
  status(code: number): VercelResponse
  setHeader(name: string, value: string): VercelResponse
  send(body: string): void
  end(): void
  json(body: unknown): void
}

/**
 * ── PRISM trace proxy (production) ─────────────────────────────────────────
 *
 * Same contract as the dev-server proxy in `vite.config.ts`: GreenPlan's
 * browser sink posts a credential-free trace here; this function attaches
 * `X-PRISMtrace-Key` from server-side env vars and forwards to PRISM's
 * `POST /api/traces`. Credentials never reach the browser bundle.
 *
 * PRISM is observability only: any failure degrades to 204 so a tracing
 * outage can NEVER turn a successful GreenPlan AI call into a user-facing
 * error.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const host = (process.env.PRISMTRACE_HOST ?? '').replace(/\/+$/, '')
  const apiKey = process.env.PRISMTRACE_API_KEY
  const projectId = process.env.PRISMTRACE_PROJECT_ID

  // Not configured → succeed silently; tracing is optional infrastructure.
  if (!host || !apiKey) {
    res.status(204).end()
    return
  }

  try {
    const payload =
      req.body && typeof req.body === 'object'
        ? (req.body as Record<string, unknown>)
        : {}

    // Attach project_id server-side so the client payload never carries it.
    if (projectId && payload.project_id === undefined) payload.project_id = projectId

    const upstream = await fetch(`${host}/api/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PRISMtrace-Key': apiKey,
      },
      body: JSON.stringify(payload),
    })

    res.status(upstream.status)
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json')
    res.send(await upstream.text())
  } catch (error) {
    console.warn(
      '[prism-proxy] trace forward failed:',
      error instanceof Error ? error.message : error,
    )
    res.status(204).end()
  }
}
