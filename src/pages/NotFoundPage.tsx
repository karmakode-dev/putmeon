import Button from '../components/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page Not Found')

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-spotify mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted mb-8 text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button to="/">Go Home</Button>
          <Button variant="secondary" to="/upload">Upload Screenshot</Button>
        </div>
      </div>
    </div>
  )
}
