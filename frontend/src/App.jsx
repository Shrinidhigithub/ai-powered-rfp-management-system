import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CreateRFP from './pages/CreateRFP'
import RFPDetail from './pages/RFPDetail'
import Vendors from './pages/Vendors'
import Compare from './pages/Compare'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="rfps/new" element={<CreateRFP />} />
          <Route path="rfps/:id" element={<RFPDetail />} />
          <Route path="rfps/:id/compare" element={<Compare />} />
          <Route path="vendors" element={<Vendors />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
