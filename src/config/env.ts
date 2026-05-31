export const env = {
  appName: 'PutMeOn',
  appUrl: import.meta.env.VITE_APP_URL ?? 'https://putmeon.app',
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  useMockApi: import.meta.env.VITE_USE_MOCK_API !== 'false',
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL ?? 'hello@putmeon.app',
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY ?? '',
  openaiModel: import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini',
  useOpenAiVision: import.meta.env.VITE_USE_OPENAI_VISION !== 'false',
} as const

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
