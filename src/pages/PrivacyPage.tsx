import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function PrivacyPage() {
  useDocumentTitle('Privacy Policy')

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 prose prose-invert prose-sm max-w-none">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-muted text-sm mb-8">Last updated: May 31, 2026</p>

      <div className="space-y-8 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Overview</h2>
          <p>
            PutMeOn ("we", "our", or "us") helps you convert music screenshots into Spotify playlists.
            This Privacy Policy explains how we collect, use, and protect your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Uploaded images:</strong> Screenshots you upload are processed to detect song titles and artists. Images are not stored permanently after processing unless required for service improvement with your consent.</li>
            <li><strong className="text-white">Spotify account data:</strong> When you connect Spotify, we receive access tokens and basic profile information (display name, user ID) necessary to create playlists on your behalf.</li>
            <li><strong className="text-white">Usage data:</strong> We collect anonymous analytics such as pages visited, scan counts, and match success rates to improve the product.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Extract song information from uploaded screenshots using AI vision technology</li>
            <li>Match detected songs against the Spotify catalog</li>
            <li>Create and manage playlists in your Spotify account</li>
            <li>Improve match accuracy and service reliability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Third-Party Services</h2>
          <p className="mb-2">We use the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Spotify:</strong> Playlist creation and music catalog search. Subject to <a href="https://www.spotify.com/legal/privacy-policy/" className="text-spotify hover:underline" target="_blank" rel="noopener noreferrer">Spotify's Privacy Policy</a>.</li>
            <li><strong className="text-white">OpenAI:</strong> Image analysis for song detection. Subject to <a href="https://openai.com/policies/privacy-policy" className="text-spotify hover:underline" target="_blank" rel="noopener noreferrer">OpenAI's Privacy Policy</a>.</li>
            <li><strong className="text-white">Supabase:</strong> Database and backend infrastructure.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Data Retention</h2>
          <p>
            Scan metadata (song counts, match rates) may be retained for analytics. Uploaded images are deleted
            after processing. Spotify tokens are stored securely and refreshed as needed; you can revoke access
            at any time through your Spotify account settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Your Rights</h2>
          <p>
            You may request deletion of your data, disconnect Spotify at any time, and contact us with privacy
            questions. We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
          <p>
            For privacy inquiries, contact us at{' '}
            <Link to="/contact" className="text-spotify hover:underline">our contact page</Link>.
          </p>
        </section>
      </div>
    </article>
  )
}
