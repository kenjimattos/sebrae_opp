import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MunicipioProvider from '@/hooks/MunicipioProvider'
import FormuladorProvider from '@/hooks/FormuladorProvider'
import ScrollToTop from '@/components/ScrollToTop'
import Home from '@/pages/Home'
import Formulador from '@/pages/Formulador'
import FormuladorStep from '@/pages/FormuladorStep'
import FormuladorConclusao from '@/pages/FormuladorConclusao'
import Trilhas from '@/pages/Trilhas'
import Oportunidades from '@/pages/Oportunidades'
import Comunidade from '@/pages/Comunidade'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <MunicipioProvider>
        <FormuladorProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trilhas" element={<Trilhas />} />
            <Route path="/oportunidades" element={<Oportunidades />} />
            <Route path="/comunidade" element={<Comunidade />} />
            <Route path="/formulador" element={<Formulador />}>
              <Route index element={<Navigate to="identificacao" replace />} />
              <Route path="conclusao" element={<FormuladorConclusao />} />
              <Route path=":stepSlug" element={<FormuladorStep />} />
            </Route>
          </Routes>
        </FormuladorProvider>
      </MunicipioProvider>
    </BrowserRouter>
  )
}

export default App
