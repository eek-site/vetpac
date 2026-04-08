import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Step1DogProfile from './pages/intake/Step1DogProfile'
import Step2Health from './pages/intake/Step2Health'
import Step3Lifestyle from './pages/intake/Step3Lifestyle'
import Step4Owner from './pages/intake/Step4Owner'
import Step5Video from './pages/intake/Step5Video'
import Step6Review from './pages/intake/Step6Review'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import Dashboard from './pages/Dashboard'
import VetPortal from './pages/VetPortal'
import NotFound from './pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

const INTAKE_ROUTES = ['/intake', '/intake/health', '/intake/lifestyle', '/intake/owner', '/intake/video', '/intake/review']
const NO_NAV_ROUTES = ['/checkout', ...INTAKE_ROUTES]
const NO_FOOTER_ROUTES = ['/checkout', ...INTAKE_ROUTES, '/dashboard', '/vet-portal']

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
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/intake" element={<Step1DogProfile />} />
          <Route path="/intake/health" element={<Step2Health />} />
          <Route path="/intake/lifestyle" element={<Step3Lifestyle />} />
          <Route path="/intake/owner" element={<Step4Owner />} />
          <Route path="/intake/video" element={<Step5Video />} />
          <Route path="/intake/review" element={<Step6Review />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vet-portal" element={<VetPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  )
}
