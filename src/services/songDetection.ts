import { isBackendConfigured, isOpenAiConfigured } from '../config/env'
import { parseSongsFromOcrLines } from './songParser'
import type { DetectedSong } from '../types'

export type DetectionMethod = 'openai' | 'tesseract'

export async function detectSongsFromImages(files: File[]): Promise<{
  songs: DetectedSong[]
  method: DetectionMethod
}> {
  if (files.length === 0) {
    throw new Error('No images to scan.')
  }

  if (isBackendConfigured()) {
    const { detectSongsFromImages: detectViaApi } = await import('./apiClient')
    const songs = await detectViaApi(files)
    return { songs, method: 'openai' }
  }

  if (isOpenAiConfigured()) {
    const { detectSongsWithOpenAI } = await import('./openaiVision')
    const songs = await detectSongsWithOpenAI(files)
    return { songs, method: 'openai' }
  }

  const { extractLinesFromImages } = await import('./ocr')
  const lines = await extractLinesFromImages(files)
  const songs = parseSongsFromOcrLines(lines)

  if (songs.length === 0) {
    throw new Error(
      'Could not read songs from your screenshot. Add VITE_OPENAI_API_KEY for AI detection, or use a clearer image.'
    )
  }

  return { songs, method: 'tesseract' }
}
