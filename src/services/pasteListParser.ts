export interface ParsedSongLine {
  title: string
  artist: string
}

function cleanPart(value: string): string {
  return value.replace(/^[•●▪▫\d\.\)\:]+\s*/, '').replace(/\s+/g, ' ').trim()
}

function parseLine(line: string): ParsedSongLine | null {
  const trimmed = cleanPart(line)
  if (trimmed.length < 2) return null

  const byMatch = trimmed.match(/^(.+?)\s+by\s+(.+)$/i)
  if (byMatch) {
    return { title: cleanPart(byMatch[1]), artist: cleanPart(byMatch[2]) }
  }

  const commaMatch = trimmed.match(/^([^,]+),\s*(.+)$/)
  if (commaMatch) {
    return { title: cleanPart(commaMatch[2]), artist: cleanPart(commaMatch[1]) }
  }

  for (const sep of [/\s[-–—]\s+/, /\s\|\s+/, /\s:\s+/]) {
    const parts = trimmed.split(sep)
    if (parts.length === 2) {
      return { title: cleanPart(parts[0]), artist: cleanPart(parts[1]) }
    }
  }

  return { title: trimmed, artist: 'Unknown Artist' }
}

/** Parse a pasted song list locally — one song per line, no AI. */
export function parsePastedSongList(text: string): ParsedSongLine[] {
  const seen = new Set<string>()
  const songs: ParsedSongLine[] = []

  for (const raw of text.split(/\r?\n/)) {
    const parsed = parseLine(raw)
    if (!parsed || parsed.title.length < 2) continue

    const key = `${parsed.title.toLowerCase()}|${parsed.artist.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    songs.push(parsed)
  }

  return songs
}
