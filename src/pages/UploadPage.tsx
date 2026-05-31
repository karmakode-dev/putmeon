import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/UploadZone'
import Button from '../components/Button'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function UploadPage() {
  useDocumentTitle('Upload')
  const navigate = useNavigate()
  const { uploadedFiles, imagePreviews, setUploadedFiles, setImagePreviews } = useApp()
  const [files, setFiles] = useState<File[]>(uploadedFiles)
  const [previews, setPreviews] = useState<string[]>(imagePreviews)

  const handleFilesChange = (newFiles: File[], newPreviews: string[]) => {
    setFiles(newFiles)
    setPreviews(newPreviews)
  }

  const handleContinue = () => {
    if (files.length === 0) return
    setUploadedFiles(files)
    setImagePreviews(previews)
    navigate('/processing')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center mb-10 animate-slide-up">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Upload Screenshots</h1>
        <p className="text-muted">
          Drop your music screenshots — Apple Music, Spotify, TikTok, Instagram, anything.
        </p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <UploadZone files={files} previews={previews} onFilesChange={handleFilesChange} />
      </div>

      {files.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
          <p className="text-sm text-muted">
            {files.length} image{files.length !== 1 ? 's' : ''} selected
          </p>
          <Button size="lg" onClick={handleContinue}>
            Detect Songs
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  )
}
