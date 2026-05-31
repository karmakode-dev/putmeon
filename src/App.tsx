import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import ProcessingPage from './pages/ProcessingPage'
import ReviewPage from './pages/ReviewPage'
import SuccessPage from './pages/SuccessPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'

function FlowLayout() {
  return <Layout showFooter={false} />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route element={<FlowLayout />}>
              <Route path="upload" element={<UploadPage />} />
              <Route path="processing" element={<ProcessingPage />} />
              <Route path="review" element={<ReviewPage />} />
              <Route path="success" element={<SuccessPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  )
}
