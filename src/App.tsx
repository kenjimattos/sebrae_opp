import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from '@/hooks/AuthProvider'
import MunicipalityProvider from '@/hooks/MunicipalityProvider'
import FormulatorProvider from '@/hooks/FormulatorProvider'
import ScrollToTop from '@/components/ScrollToTop'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import ConsentBanner from '@/components/ui/ConsentBanner'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Formulator from '@/pages/Formulator'
import FormulatorStep from '@/pages/FormulatorStep'
import FormulatorConclusion from '@/pages/FormulatorConclusion'
import Trails from '@/pages/Trails'
import Opportunities from '@/pages/Opportunities'
import Community from '@/pages/Community'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <AuthProvider>
        <MunicipalityProvider>
          <FormulatorProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/trilhas" element={<Trails />} />
              <Route path="/oportunidades" element={<Opportunities />} />
              <Route path="/comunidade" element={<Community />} />
              <Route path="/formulador" element={<Formulator />}>
                <Route index element={<Navigate to="identificacao" replace />} />
                <Route path="conclusao" element={<FormulatorConclusion />} />
                <Route path=":stepSlug" element={<FormulatorStep />} />
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
