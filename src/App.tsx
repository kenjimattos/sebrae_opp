import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from '@/hooks/AuthProvider'
import MunicipalityProvider from '@/hooks/MunicipalityProvider'
import FormulatorProvider from '@/hooks/FormulatorProvider'
import ScrollToTop from '@/components/ScrollToTop'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import ConsentBanner from '@/components/ui/ConsentBanner'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Trails from '@/pages/Trails'
import Opportunities from '@/pages/Opportunities'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <AuthProvider>
        <MunicipalityProvider>
          <FormulatorProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Login />} />
                <Route path="/home" element={<Home />} />
                <Route path="/trilhas" element={<Trails />} />
                <Route path="/oportunidades" element={<Opportunities />} />
              </Route>
            </Routes>
            <ConsentBanner />
          </FormulatorProvider>
        </MunicipalityProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
