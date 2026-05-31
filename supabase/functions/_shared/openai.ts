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

export interface DetectedSong {
  id: string
  title: string
  artist: string
  confidence: number
}

interface VisionResponse {
  songs?: Array<{ title?: string; artist?: string; confidence?: number }>
}

export async function detectSongsFromImages(
  images: { base64: string; mimeType: string }[],
  model: string
): Promise<DetectedSong[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OpenAI API key is not configured on the server.')

  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string; detail: 'high' } }
  > = [{ type: 'text', text: DETECTION_PROMPT }]

  for (const img of images) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.base64}`, detail: 'high' },
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
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
    throw new Error(message)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content
  if (!raw) throw new Error('OpenAI returned an empty response.')

  let parsed: VisionResponse
  try {
    parsed = JSON.parse(raw) as VisionResponse
  } catch {
    throw new Error('Could not parse song list from OpenAI response.')
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
    throw new Error('No songs detected in your screenshot. Try a clearer image.')
  }

  return songs
}

export async function filesToImages(formData: FormData): Promise<{ base64: string; mimeType: string }[]> {
  const files: File[] = []
  for (const [, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) files.push(value)
  }
  if (files.length === 0) throw new Error('No images provided.')

  const images: { base64: string; mimeType: string }[] = []
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    images.push({
      base64: btoa(binary),
      mimeType: file.type || 'image/jpeg',
    })
  }
  return images
}
