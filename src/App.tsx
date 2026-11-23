import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from '@/hooks/AuthProvider'
import AnalyticsProvider from '@/hooks/AnalyticsProvider'
import ConfirmProvider from '@/hooks/ConfirmProvider'
import MunicipalityProvider from '@/hooks/MunicipalityProvider'
import FormulatorProvider from '@/hooks/FormulatorProvider'
import ScrollToTop from '@/components/ScrollToTop'
import Layout from '@/components/layout/Layout'
import RequireAuth from '@/components/RequireAuth'
import TermsGate from '@/components/terms/TermsGate'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Terms from '@/pages/Terms'
import Trails from '@/pages/Trails'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ConfirmProvider>
        <AuthProvider>
          <AnalyticsProvider>
            <MunicipalityProvider>
              <FormulatorProvider>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Login />} />
                    <Route path="/termos" element={<Terms />} />
                    <Route element={<RequireAuth />}>
                      <Route element={<TermsGate />}>
                        <Route path="/home" element={<Home />} />
                        <Route path="/trilhas" element={<Trails />} />
                      </Route>
                    </Route>
                  </Route>
                </Routes>
              </FormulatorProvider>
            </MunicipalityProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </ConfirmProvider>
    </BrowserRouter>
  )
}

export default App
