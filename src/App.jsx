import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import IntakeChatPage from './pages/intake/IntakeChatPage'
import Step6Review from './pages/intake/Step6Review'
import Checkout from './pages/Checkout'
import PlanPage from './pages/PlanPage'
import OrderConfirmation from './pages/OrderConfirmation'
import InsuranceTerms from './pages/InsuranceTerms'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import LegalCompliance from './pages/LegalCompliance'
import ContactPage from './pages/ContactPage'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'
import WarrantyTerms from './pages/WarrantyTerms'
import VetPortal from './pages/VetPortal'
import NotFound from './pages/NotFound'
import AdminConsole from './pages/AdminConsole'
import GuidePage from './pages/GuidePage'
import GoogleAdsContext from './components/GoogleAdsContext'
import GoogleTag from './components/GoogleTag'
import VisitorTracker from './components/VisitorTracker'
import SupportChat from './components/SupportChat'
import AnnouncementModal from './components/AnnouncementModal'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

const INTAKE_ROUTES = ['/intake', '/intake/review']
const NO_NAV_ROUTES = ['/checkout', '/plan', '/admin', '/order-confirmation', '/auth/callback', ...INTAKE_ROUTES]
const NO_FOOTER_ROUTES = ['/checkout', '/plan', '/admin', '/order-confirmation', '/auth/callback', ...INTAKE_ROUTES, '/dashboard', '/vet-portal']

function Layout({ children }) {
  const { pathname } = useLocation()
  const showNav = !NO_NAV_ROUTES.includes(pathname)
  const showFooter = !NO_FOOTER_ROUTES.includes(pathname)

  return (
    <>
      {showNav && <Nav />}
      <main className={showNav ? 'pt-0' : ''}>
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <>
      <GoogleAdsContext />
      <GoogleTag />
      <VisitorTracker />
      <AnnouncementModal />
      <SupportChat />
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/intake" element={<IntakeChatPage />} />
          <Route path="/intake/review" element={<Step6Review />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/insurance-terms" element={<InsuranceTerms />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/legal" element={<LegalCompliance />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/warranty-terms" element={<WarrantyTerms />} />
          <Route path="/admin" element={<AdminConsole />} />
          <Route path="/vet-portal" element={<VetPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  )
}
