import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Layout/Dashboard'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="stats" element={<Stats />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <PWAUpdatePrompt />
    </Router>
  )
}

export default App