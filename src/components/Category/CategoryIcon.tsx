import { ComponentType, SVGProps } from 'react'

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
  icon: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function CategoryIcon({ icon, className = '', size = 'md' }: CategoryIconProps) {
  const IconComponent = ICON_MAP[icon] || FoodIcon // Fallback to food icon
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }
  
  return (
    <IconComponent 
      className={`${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    />
  )
}