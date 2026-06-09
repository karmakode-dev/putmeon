export const env = {
  appName: 'PutMeOn',
  appUrl: import.meta.env.VITE_APP_URL ?? 'https://putmeon.karmakode.co',
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== 'false',
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL ?? 'Karmakode.dev@gmail.com',
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY ?? '',
  openaiModel: import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini',
  useOpenAiVision: import.meta.env.VITE_USE_OPENAI_VISION !== 'false',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
} as const

/** Share links always use the frontend origin (VITE_APP_URL), not the server APP_URL secret. */
export function sharedPlaylistUrl(publicId: string): string {
  const base = env.appUrl.replace(/\/$/, '')
  return `${base}/p/${publicId}`
}

/** Extract public id from a share URL (`/p/{id}`). */
export function publicIdFromShareUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  const match = url.match(/\/p\/([^/?#]+)/)
  return match?.[1]
}

export function formatExportCount(count: number): string {
  if (count === 1) return '1 person put on'
  return `${count} people put on`
}

/** Shared playlist subtitle: song count plus optional export count. */
/** Shared playlist subtitle: song count plus optional export count. */
export function formatSharedPlaylistMeta(songCount: number, exportCount: number): string {
  const songs = `${songCount} song${songCount === 1 ? '' : 's'}`
  if (exportCount <= 0) return songs
  return `${songs} · ${formatExportCount(exportCount)}`
}

export function profileUrl(username: string): string {
  const base = env.appUrl.replace(/\/$/, '')
  return `${base}/@${encodeURIComponent(username)}`
}

export function formatStatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(count)
}

export function isBackendConfigured(): boolean {
  return !env.useMockApi && Boolean(env.apiUrl)
}

/** @deprecated use isBackendConfigured */
export function isProductionApiReady(): boolean {
  return isBackendConfigured()
}

export function isOpenAiConfigured(): boolean {
  if (isBackendConfigured()) return true
  return env.useOpenAiVision && Boolean(env.openaiApiKey)
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey)
}
