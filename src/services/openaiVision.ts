import { env } from '../config/env'
import type { DetectedSong } from '../types'

const DETECTION_PROMPT = `You extract songs from music screenshot images (Spotify, Apple Music, TikTok, Instagram, etc.).

Return ONLY valid JSON in this exact shape:
{
  "songs": [
    { "title": "Song Title", "artist": "Artist Name", "confidence": 0.95 }
  ]
}

Rules:
- Extract every song you can see
- "title" = song name, "artist" = primary artist(s)
- For "feat." songs, put featured artists in the artist field: "Drake, SZA"
- confidence is 0.0–1.0 based on how clearly you read it
- Fix obvious OCR-style typos when the intended song is clear
- Skip headers, UI labels, timestamps, usernames — songs only
- If no songs found, return { "songs": [] }`

interface VisionResponse {
  songs?: Array<{ title?: string; artist?: string; confidence?: number }>
}

function fileToBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.readAsDataURL(file)
  })
}

export class OpenAiVisionError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'OpenAiVisionError'
  }
}

export async function detectSongsWithOpenAI(files: File[]): Promise<DetectedSong[]> {
  if (!env.openaiApiKey) {
    throw new OpenAiVisionError('OpenAI API key is missing. Add VITE_OPENAI_API_KEY to your .env.local file.')
  }

  const images = await Promise.all(files.map(fileToBase64DataUrl))

  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' | 'low' | 'auto' } }
  > = [{ type: 'text', text: DETECTION_PROMPT }]

  for (const url of images) {
    content.push({ type: 'image_url', image_url: { url, detail: 'high' } })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.openaiModel,
      messages: [{ role: 'user', content }],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    let message = `OpenAI request failed (${response.status})`
    try {
      const err = await response.json()
      message = err.error?.message ?? message
    } catch {
      // ignore
    }
    throw new OpenAiVisionError(message, response.status)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content
  if (!raw) throw new OpenAiVisionError('OpenAI returned an empty response.')

  let parsed: VisionResponse
  try {
    parsed = JSON.parse(raw) as VisionResponse
  } catch {
    throw new OpenAiVisionError('Could not parse song list from OpenAI response.')
  }

  const songs: DetectedSong[] = (parsed.songs ?? [])
    .filter((s) => s.title?.trim() && s.artist?.trim())
    .map((s, i) => ({
      id: String(i + 1),
      title: s.title!.trim(),
      artist: s.artist!.trim(),
      confidence: Math.min(1, Math.max(0, s.confidence ?? 0.9)),
    }))

  if (songs.length === 0) {
    throw new OpenAiVisionError('No songs detected in your screenshot. Try a clearer image.')
  }

  return songs
}

export function isOpenAiVisionEnabled(): boolean {
  return env.useOpenAiVision && Boolean(env.openaiApiKey)
}
