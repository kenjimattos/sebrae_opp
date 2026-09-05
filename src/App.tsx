import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthProvider from '@/hooks/AuthProvider'
import ConfirmProvider from '@/hooks/ConfirmProvider'
import MunicipalityProvider from '@/hooks/MunicipalityProvider'
import FormulatorProvider from '@/hooks/FormulatorProvider'
import ScrollToTop from '@/components/ScrollToTop'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Trails from '@/pages/Trails'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ConfirmProvider>
        <AuthProvider>
          <MunicipalityProvider>
            <FormulatorProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Login />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/trilhas" element={<Trails />} />
                </Route>
              </Routes>
            </FormulatorProvider>
          </MunicipalityProvider>
        </AuthProvider>
      </ConfirmProvider>
    </BrowserRouter>
  )
}

export default App
