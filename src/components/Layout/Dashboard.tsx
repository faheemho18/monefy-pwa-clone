import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'
import Header from './Header'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <Header />
      <main id="main-content" className="flex-1 pb-16 px-4 pt-4" role="main">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}