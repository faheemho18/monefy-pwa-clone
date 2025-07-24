import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Layout/Dashboard'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import StorageTest from './pages/StorageTest'
import ResponsiveTest from './pages/ResponsiveTest'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import { CriticalErrorBoundary, ComponentErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <CriticalErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route index element={
              <ComponentErrorBoundary componentName="Home">
                <Home />
              </ComponentErrorBoundary>
            } />
            <Route path="transactions" element={
              <ComponentErrorBoundary componentName="Transactions">
                <Transactions />
              </ComponentErrorBoundary>
            } />
            <Route path="stats" element={
              <ComponentErrorBoundary componentName="Stats">
                <Stats />
              </ComponentErrorBoundary>
            } />
            <Route path="settings" element={
              <ComponentErrorBoundary componentName="Settings">
                <Settings />
              </ComponentErrorBoundary>
            } />
            <Route path="storage-test" element={
              <ComponentErrorBoundary componentName="Storage Test">
                <StorageTest />
              </ComponentErrorBoundary>
            } />
            <Route path="responsive-test" element={
              <ComponentErrorBoundary componentName="Responsive Test">
                <ResponsiveTest />
              </ComponentErrorBoundary>
            } />
          </Route>
        </Routes>
        <PWAUpdatePrompt />
      </Router>
    </CriticalErrorBoundary>
  )
}

export default App