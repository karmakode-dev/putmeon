export const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-spotify-session',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
})

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin')
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  return null
}

export function jsonResponse(data: unknown, req: Request, status = 200): Response {
  const origin = req.headers.get('Origin')
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

export function errorResponse(message: string, req: Request, status = 400): Response {
  return jsonResponse({ error: message }, req, status)
}

export function getRoutePath(req: Request): string {
  const url = new URL(req.url)
  let path = url.pathname
  const prefixes = ['/functions/v1/api', '/api']
  for (const prefix of prefixes) {
    if (path.startsWith(prefix)) {
      path = path.slice(prefix.length) || '/'
      break
    }
  }
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path
}

export function getSpotifySessionId(req: Request): string | null {
  return req.headers.get('X-Spotify-Session')?.trim() || null
}

export function allowedOrigin(req: Request, appUrl: string): string {
  const origin = req.headers.get('Origin')
  if (!origin) return appUrl
  try {
    const appHost = new URL(appUrl).origin
    if (origin === appHost) return origin
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin
  } catch {
    // ignore
  }
  return appUrl
}
