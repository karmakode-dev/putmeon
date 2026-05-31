export interface OcrProgress {
  status: string
  progress: number
}

export interface OcrLine {
  text: string
  confidence: number
}

type PreprocessMode = 'light' | 'dark'

async function cropRegion(file: File, sx: number, sy: number, sw: number, sh: number): Promise<ImageBitmap> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not crop image for OCR')
  }
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)
  bitmap.close()
  return createImageBitmap(canvas)
}

async function preprocessBitmap(bitmap: ImageBitmap, mode: PreprocessMode): Promise<string> {
  const scale = Math.min(2.5, Math.max(1.5, 1400 / Math.max(bitmap.width, bitmap.height)))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Could not prepare image for OCR')
  }

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const threshold = mode === 'dark' ? 120 : 145

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const value = gray > threshold ? 0 : 255
    data[i] = value
    data[i + 1] = value
    data[i + 2] = value
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

async function preprocessFile(file: File, mode: PreprocessMode): Promise<string> {
  const bitmap = await createImageBitmap(file)
  return preprocessBitmap(bitmap, mode)
}

async function preprocessRegion(file: File, sx: number, sy: number, sw: number, sh: number, mode: PreprocessMode): Promise<string> {
  const cropped = await cropRegion(file, sx, sy, sw, sh)
  return preprocessBitmap(cropped, mode)
}

/** Generate OCR targets: full image + left/right columns (Spotify-style layouts) */
async function buildOcrTargets(file: File): Promise<Array<{ dataUrl: string; mode: PreprocessMode }>> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  bitmap.close()

  const mid = Math.floor(width / 2)
  const hasColumns = width > height * 0.8 && width > 500

  const targets: Array<{ dataUrl: string; mode: PreprocessMode }> = [
    { dataUrl: await preprocessFile(file, 'dark'), mode: 'dark' },
    { dataUrl: await preprocessFile(file, 'light'), mode: 'light' },
  ]

  if (hasColumns) {
    targets.push(
      { dataUrl: await preprocessRegion(file, 0, 0, mid, height, 'dark'), mode: 'dark' },
      { dataUrl: await preprocessRegion(file, mid, 0, width - mid, height, 'dark'), mode: 'dark' }
    )
  }

  return targets
}

function linesFromRecognition(data: {
  text: string
  confidence: number
  lines?: Array<{ text: string; confidence: number }>
}): OcrLine[] {
  if (data.lines?.length) {
    return data.lines
      .map((line) => ({
        text: line.text.trim(),
        confidence: line.confidence / 100,
      }))
      .filter((line) => line.text.length > 1)
  }

  return data.text
    .split(/\r?\n/)
    .map((text) => text.trim())
    .filter((text) => text.length > 1)
    .map((text) => ({ text, confidence: data.confidence / 100 }))
}

export async function extractLinesFromImages(
  files: File[],
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrLine[]> {
  const { createWorker, PSM } = await import('tesseract.js')

  const worker = await createWorker('eng', 1, {
    logger: (msg) => {
      if (msg.status === 'recognizing text' && onProgress) {
        onProgress({ status: msg.status, progress: msg.progress })
      }
    },
  })

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    })

    const allLines: OcrLine[] = []

    for (let i = 0; i < files.length; i++) {
      onProgress?.({ status: `Reading image ${i + 1} of ${files.length}`, progress: i / files.length })

      const targets = await buildOcrTargets(files[i])

      for (const target of targets) {
        const result = await worker.recognize(target.dataUrl)
        const lines = linesFromRecognition(result.data)

        for (const line of lines) {
          const key = line.text.toLowerCase()
          const exists = allLines.some((l) => l.text.toLowerCase() === key)
          if (!exists) allLines.push(line)
        }
      }
    }

    return allLines
  } finally {
    await worker.terminate()
  }
}

export async function extractTextFromImages(
  files: File[],
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  const lines = await extractLinesFromImages(files, onProgress)
  return lines.map((l) => l.text).join('\n')
}
