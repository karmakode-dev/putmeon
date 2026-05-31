import { env, isBackendConfigured, isOpenAiConfigured } from '../config/env'

export default function MockModeBanner() {
  if (isBackendConfigured()) return null
  if (!env.useMockApi && isOpenAiConfigured()) return null

  const detection = isOpenAiConfigured()
    ? 'OpenAI Vision reads your screenshots.'
    : 'Add VITE_OPENAI_API_KEY to .env.local for AI detection, or Tesseract is used as fallback.'

  return (
    <div
      role="status"
      className={`border-b px-4 py-2 text-center text-xs ${
        isOpenAiConfigured()
          ? 'border-spotify/20 bg-spotify/10 text-spotify'
          : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300'
      }`}
    >
      {detection} Spotify connect &amp; playlist creation are still demo-only.
    </div>
  )
}
