import { useState } from 'react'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { env } from '../config/env'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function ContactPage() {
  useDocumentTitle('Contact')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Contact Us</h1>
        <p className="text-muted text-sm">
          Have a question, bug report, or feature request? We'd love to hear from you.
        </p>
      </div>

      {submitted ? (
        <Alert variant="success" title="Message sent">
          Thanks for reaching out! We'll get back to you at the email you provided.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-spotify/50 focus:border-spotify/50"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-spotify/50 focus:border-spotify/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-spotify/50 focus:border-spotify/50 resize-none"
              placeholder="How can we help?"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">Send Message</Button>
        </form>
      )}

      <div className="mt-10 text-center">
        <p className="text-sm text-muted">
          Or email us directly at{' '}
          <a href={`mailto:${env.contactEmail}`} className="text-spotify hover:underline">
            {env.contactEmail}
          </a>
        </p>
      </div>
    </div>
  )
}
