import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function TermsPage() {
  useDocumentTitle('Terms of Service')

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-muted text-sm mb-8">Last updated: May 31, 2026</p>

      <div className="space-y-8 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Acceptance of Terms</h2>
          <p>
            By using PutMeOn, you agree to these Terms of Service. If you do not agree, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Service Description</h2>
          <p>
            PutMeOn converts music screenshots into Spotify playlists by detecting songs from images and matching
            them against Spotify's catalog. We strive for high match accuracy but cannot guarantee every song will be found.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Spotify Integration</h2>
          <p>
            To create playlists, you must connect a valid Spotify account. You grant PutMeOn permission to create
            and modify playlists on your behalf using the scopes you authorize. PutMeOn is not affiliated with,
            endorsed by, or sponsored by Spotify AB.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Acceptable Use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Upload only images you have the right to use</li>
            <li>Do not upload illegal, harmful, or abusive content</li>
            <li>Do not attempt to reverse engineer, scrape, or abuse the service</li>
            <li>Do not use automated tools to exceed reasonable usage limits</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Intellectual Property</h2>
          <p>
            PutMeOn's branding, design, and software are our property. Song metadata and playback are subject to
            Spotify's terms and applicable copyright laws. You retain ownership of images you upload.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Disclaimer</h2>
          <p>
            The service is provided "as is" without warranties of any kind. We are not liable for incorrect matches,
            failed playlist creation, or any damages arising from use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Changes</h2>
          <p>
            We may update these terms at any time. Continued use after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
          <p>
            Questions about these terms? Visit our{' '}
            <Link to="/contact" className="text-spotify hover:underline">contact page</Link>.
          </p>
        </section>
      </div>
    </article>
  )
}
