import { ComponentType, SVGProps } from 'react'
import {
  CATEGORY_ICONS,
  NAVIGATION_ICONS,
  UI_ICONS,
  CategoryIconName,
  NavigationIconName,
  UIIconName,
} from './index'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: CategoryIconName | NavigationIconName | UIIconName
  size?: number | string
  className?: string
}

const Icon = ({ name, size = 24, className = '', ...props }: IconProps) => {
  let IconComponent: ComponentType<SVGProps<SVGSVGElement>> | undefined

  // Try to find the icon in different categories
  if (name in CATEGORY_ICONS) {
    IconComponent = CATEGORY_ICONS[name as CategoryIconName]
  } else if (name in NAVIGATION_ICONS) {
    IconComponent = NAVIGATION_ICONS[name as NavigationIconName]
  } else if (name in UI_ICONS) {
    IconComponent = UI_ICONS[name as UIIconName]
  }

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <IconComponent
      width={size}
      height={size}
      className={className}
      {...props}
    />
  )
}

export default Icon