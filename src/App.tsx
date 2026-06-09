import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import CuratePage from './pages/CuratePage'
import SharedPlaylistPage from './pages/SharedPlaylistPage'
import ProcessingPage from './pages/ProcessingPage'
import ReviewPage from './pages/ReviewPage'
import SuccessPage from './pages/SuccessPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import OnboardingPage from './pages/OnboardingPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'

function FlowLayout() {
  return <Layout showFooter={false} />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<LandingPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="auth/callback" element={<AuthCallbackPage />} />
                <Route path="onboarding" element={<OnboardingPage />} />
                <Route path=":username" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route element={<FlowLayout />}>
                <Route path="curate" element={<CuratePage />} />
                <Route path="p/:publicId" element={<SharedPlaylistPage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="processing" element={<ProcessingPage />} />
                <Route path="review" element={<ReviewPage />} />
                <Route path="success" element={<SuccessPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
