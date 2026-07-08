import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from '@/hooks/AuthProvider'
import MunicipalityProvider from '@/hooks/MunicipalityProvider'
import FormulatorProvider from '@/hooks/FormulatorProvider'
import ScrollToTop from '@/components/ScrollToTop'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Trails from '@/pages/Trails'
import Opportunities from '@/pages/Opportunities'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
          </FormulatorProvider>
        </MunicipalityProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
