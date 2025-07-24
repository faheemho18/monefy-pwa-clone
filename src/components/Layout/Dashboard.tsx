import { Outlet } from 'react-router-dom'
import BottomNavigation from './BottomNavigation'
import Header from './Header'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pb-16 px-4 pt-4">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}