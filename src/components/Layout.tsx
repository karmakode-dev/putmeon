import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BrandCredit from './BrandCredit'
import MockModeBanner from './MockModeBanner'

interface LayoutProps {
  showFooter?: boolean
}

export default function Layout({ showFooter = true }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MockModeBanner />
      <main id="main-content" className="flex-1 pt-14">
        <Outlet />
      </main>
      {showFooter ? (
        <Footer />
      ) : (
        <div className="border-t border-border bg-bg py-4 text-center">
          <BrandCredit />
        </div>
      )}
    </div>
  )
}
