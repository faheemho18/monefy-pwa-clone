import { NavLink } from 'react-router-dom'
import HomeIcon from '@/assets/icons/navigation/home.svg?react'
import TransactionsIcon from '@/assets/icons/navigation/transactions.svg?react'
import StatsIcon from '@/assets/icons/navigation/stats.svg?react'
import SettingsIcon from '@/assets/icons/navigation/settings.svg?react'

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Transactions', href: '/transactions', icon: TransactionsIcon },
  { name: 'Stats', href: '/stats', icon: StatsIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
]

export default function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 safe-area-inset-bottom">
      <div className="flex justify-around">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center py-3 px-4 rounded-lg transition-colors min-h-[56px] min-w-[56px] touch-manipulation ${
                  isActive
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                }`
              }
              aria-label={item.name}
            >
              <Icon className="w-6 h-6 mb-1 flex-shrink-0" />
              <span className="text-xs font-medium leading-tight">{item.name}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}