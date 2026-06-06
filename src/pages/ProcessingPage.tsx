import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProcessingSteps from '../components/ProcessingSteps'
import Alert from '../components/Alert'
import Button from '../components/Button'
import { useApp } from '../context/AppContext'
import { processScan } from '../services/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { isBackendConfigured, isOpenAiConfigured } from '../config/env'
import type { ProcessingStep } from '../types'

function buildInitialSteps(): ProcessingStep[] {
  const detectLabel = isBackendConfigured()
    ? 'Analyzing songs with AI'
    : isOpenAiConfigured()
      ? 'Analyzing songs with OpenAI'
      : 'Detecting songs with AI'

  if (isBackendConfigured()) {
    return [
      { id: 'upload', label: 'Uploading images', status: 'active' },
      { id: 'detect', label: detectLabel, status: 'pending' },
      { id: 'done', label: 'Preparing your song list', status: 'pending' },
    ]
  }

  return [
    { id: 'upload', label: 'Uploading images', status: 'active' },
    { id: 'detect', label: detectLabel, status: 'pending' },
    { id: 'match', label: 'Matching with Spotify', status: 'pending' },
    { id: 'done', label: 'Preparing results', status: 'pending' },
  ]
}

const PROCESSING_TIMEOUT_MS = 120_000

export default function ProcessingPage() {
  useDocumentTitle('Processing')
  const navigate = useNavigate()
  const { uploadedFiles, imagePreviews, setScanSongs } = useApp()
  const [steps, setSteps] = useState<ProcessingStep[]>(buildInitialSteps)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const filesRef = useRef(uploadedFiles)
  filesRef.current = uploadedFiles

  useEffect(() => {
    const files = filesRef.current
    if (files.length === 0) {
      navigate('/upload', { replace: true })
      return
    }

    let cancelled = false
    const stepCount = buildInitialSteps().length

    const advanceStep = (stepIndex: number) => {
      setSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < stepIndex ? 'complete' : i === stepIndex ? 'active' : 'pending',
        }))
      )
      setProgress(((stepIndex + 1) / stepCount) * 100)
    }

    const run = async () => {
      const timeout = setTimeout(() => {
        if (!cancelled) {
          cancelled = true
          setError('Processing timed out. Please try again.')
        }
      }, PROCESSING_TIMEOUT_MS)

      try {
        advanceStep(0)
        await new Promise((r) => setTimeout(r, 400))
        if (cancelled) return

        advanceStep(1)
        const result = await processScan(files)
        if (cancelled) return

        if (isBackendConfigured()) {
          advanceStep(2)
        } else {
          advanceStep(2)
          await new Promise((r) => setTimeout(r, 300))
          if (cancelled) return
          advanceStep(3)
        }

        setScanSongs(result.songsMatched)
        if (cancelled) return

        setSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })))
        setProgress(100)
        navigate('/review', { replace: true })
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Processing failed. Please try again.')
        setSteps((prev) => prev.map((s) => (s.status === 'active' ? { ...s, status: 'pending' as const } : s)))
      } finally {
        clearTimeout(timeout)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [uploadedFiles.length, navigate, setScanSongs])

  const handleRetry = () => {
    setError(null)
    setSteps(buildInitialSteps())
    setProgress(0)
    navigate('/upload')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center mb-12 animate-slide-up">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-spotify/10">
          <svg className="h-10 w-10 text-spotify animate-spin-slow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Processing your screenshots</h1>
        <p className="text-muted text-sm">
          {isBackendConfigured()
            ? 'Detecting songs from your screenshots — Spotify matching comes next'
            : 'First scan may take up to a minute while OCR loads'}
        </p>
      </div>

      {error ? (
        <div className="space-y-4">
          <Alert variant="error" title="Processing failed">{error}</Alert>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRetry}>Try Again</Button>
            <Button variant="secondary" to="/">Go Home</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Processing progress">
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-spotify transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true">
            <ProcessingSteps steps={steps} />
          </div>

          {imagePreviews.length > 0 && (
            <div className="mt-10 flex justify-center gap-2" aria-label="Uploaded screenshots">
              {imagePreviews.slice(0, 4).map((preview, i) => (
                <div key={preview} className="h-16 w-12 rounded-lg overflow-hidden border border-border bg-card">
                  <img
                    src={preview}
                    alt={`Screenshot ${i + 1}`}
                    className="h-full w-full object-cover opacity-60"
                  />
                </div>
              ))}
              {imagePreviews.length > 4 && (
                <div className="flex h-16 w-12 items-center justify-center rounded-lg border border-border bg-card text-xs text-muted">
                  +{imagePreviews.length - 4}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
