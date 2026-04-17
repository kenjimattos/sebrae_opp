import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MunicipioProvider from '@/hooks/MunicipioProvider'
import FormuladorProvider from '@/hooks/FormuladorProvider'
import Home from '@/pages/Home'
import Formulador from '@/pages/Formulador'
import FormuladorStep from '@/pages/FormuladorStep'
import FormuladorConclusao from '@/pages/FormuladorConclusao'

function App() {
  return (
    <BrowserRouter>
      <MunicipioProvider>
        <FormuladorProvider>
          <Routes>
            <Route path="/" element={<Home />} />
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
