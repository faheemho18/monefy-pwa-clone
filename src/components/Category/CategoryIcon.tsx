import { ComponentType, SVGProps } from 'react'
import { Category } from '@/types'

// Import all category icons
import FoodIcon from '@/assets/icons/categories/food.svg?react'
import TransportIcon from '@/assets/icons/categories/transport.svg?react'
import EntertainmentIcon from '@/assets/icons/categories/entertainment.svg?react'
import BillsIcon from '@/assets/icons/categories/bills.svg?react'
import HealthcareIcon from '@/assets/icons/categories/healthcare.svg?react'
import ShoppingIcon from '@/assets/icons/categories/shopping.svg?react'
import EducationIcon from '@/assets/icons/categories/education.svg?react'
import TravelIcon from '@/assets/icons/categories/travel.svg?react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

// Icon mapping
const ICON_MAP: Record<string, IconComponent> = {
  food: FoodIcon,
  transport: TransportIcon,
  entertainment: EntertainmentIcon,
  bills: BillsIcon,  
  healthcare: HealthcareIcon,
  shopping: ShoppingIcon,
  education: EducationIcon,
  travel: TravelIcon,
}

interface CategoryIconProps {
  category: Category
  isSelected: boolean
  onClick: (categoryId: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function CategoryIcon({ 
  category, 
  isSelected, 
  onClick, 
  size = 'md' 
}: CategoryIconProps) {
  const IconComponent = ICON_MAP[category.icon] || FoodIcon // Fallback to food icon
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
  }

  const containerSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }

  const handleClick = () => {
    onClick(category.id)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(category.id)
    }
  }
  
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          ${containerSizeClasses[size]}
          ${category.color}
          rounded-2xl
          flex items-center justify-center
          transition-all duration-200
          hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isSelected 
            ? 'ring-2 ring-blue-600 ring-offset-2 shadow-lg scale-105' 
            : 'hover:shadow-md'
          }
        `}
        aria-pressed={isSelected}
        aria-label={`Select category: ${category.name}`}
        tabIndex={0}
      >
        <IconComponent 
          className={`${iconSizeClasses[size]} text-white`}
          aria-hidden="true"
          data-testid={`category-icon-${category.icon}`}
        />
      </button>
      <span className="text-xs text-gray-700 text-center leading-tight">
        {category.name}
      </span>
    </div>
  )
}