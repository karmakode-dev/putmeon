import { useCallback, useEffect, useRef, useState } from 'react'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024
const MAX_FILES = 20

interface UploadZoneProps {
  files: File[]
  previews: string[]
  onFilesChange: (files: File[], previews: string[]) => void
}

export default function UploadZone({ files, previews, onFilesChange }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const revokePreview = useCallback((url: string) => {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    return () => {
      previews.forEach(revokePreview)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- cleanup on unmount only

  const processFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError(null)
      const fileArray = Array.from(incoming)
      const valid: File[] = []
      const newPreviews: string[] = [...previews]

      for (const file of fileArray) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError('Only PNG, JPG, JPEG, and WEBP files are supported.')
          continue
        }
        if (file.size > MAX_SIZE) {
          setError('Each file must be under 10MB.')
          continue
        }
        valid.push(file)
        newPreviews.push(URL.createObjectURL(file))
      }

      const combined = [...files, ...valid].slice(0, MAX_FILES)
      const trimmedPreviews = newPreviews.slice(0, MAX_FILES)

      if (combined.length < newPreviews.length) {
        newPreviews.slice(combined.length).forEach(revokePreview)
      }

      if (files.length + valid.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} images allowed.`)
      }

      onFilesChange(combined, trimmedPreviews)
    },
    [files, previews, onFilesChange, revokePreview]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  const removeFile = (index: number) => {
    revokePreview(previews[index])
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    onFilesChange(newFiles, newPreviews)
  }

  const openFilePicker = () => inputRef.current?.click()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openFilePicker()
    }
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload screenshots. Drag and drop or press Enter to browse files."
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={openFilePicker}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spotify/50 ${
          dragging
            ? 'border-spotify bg-spotify/5 scale-[1.01]'
            : 'border-border hover:border-spotify/50 hover:bg-card/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files?.length) processFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-spotify/10">
          <svg className="h-8 w-8 text-spotify" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-1">
          {dragging ? 'Drop your screenshots here' : 'Drag & drop screenshots'}
        </p>
        <p className="text-sm text-muted mb-4">or click to browse</p>
        <p className="text-xs text-muted/60">
          PNG, JPG, WEBP · Max 10MB · Up to {MAX_FILES} images
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400 text-center">{error}</p>
      )}

      {previews.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3" aria-label="Uploaded images">
          {previews.map((preview, index) => (
            <li key={preview} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-card border border-border">
              <img src={preview} alt={`Uploaded screenshot ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label={`Remove screenshot ${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
                }}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-500"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
