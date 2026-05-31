/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string
  readonly VITE_API_URL: string
  readonly VITE_USE_MOCK_API: string
  readonly VITE_SPOTIFY_CLIENT_ID: string
  readonly VITE_CONTACT_EMAIL: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_MODEL: string
  readonly VITE_USE_OPENAI_VISION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
