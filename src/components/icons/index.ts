// Icon imports for React components
import FoodIcon from '../../assets/icons/categories/food.svg?react'
import TransportIcon from '../../assets/icons/categories/transport.svg?react'
import ShoppingIcon from '../../assets/icons/categories/shopping.svg?react'
import EntertainmentIcon from '../../assets/icons/categories/entertainment.svg?react'
import BillsIcon from '../../assets/icons/categories/bills.svg?react'
import HealthcareIcon from '../../assets/icons/categories/healthcare.svg?react'
import EducationIcon from '../../assets/icons/categories/education.svg?react'
import TravelIcon from '../../assets/icons/categories/travel.svg?react'

import HomeIcon from '../../assets/icons/navigation/home.svg?react'
import StatsIcon from '../../assets/icons/navigation/stats.svg?react'
import TransactionsIcon from '../../assets/icons/navigation/transactions.svg?react'
import SettingsIcon from '../../assets/icons/navigation/settings.svg?react'

import AddIcon from '../../assets/icons/ui/add.svg?react'
import CloseIcon from '../../assets/icons/ui/close.svg?react'
import DeleteIcon from '../../assets/icons/ui/delete.svg?react'
import EditIcon from '../../assets/icons/ui/edit.svg?react'
import FilterIcon from '../../assets/icons/ui/filter.svg?react'
import SearchIcon from '../../assets/icons/ui/search.svg?react'

import SpinnerIcon from '../../assets/loading/spinner.svg?react'
import PulseDotsIcon from '../../assets/loading/pulse-dots.svg?react'

import CheckmarkIcon from '../../assets/animations/checkmark.svg?react'
import ProgressRingIcon from '../../assets/animations/progress-ring.svg?react'

import LogoIcon from '../../assets/branding/logo-main.svg?react'
import Favicon16Icon from '../../assets/branding/favicon-16x16.svg?react'
import Favicon32Icon from '../../assets/branding/favicon-32x32.svg?react'

// Export icons
export {
  FoodIcon,
  TransportIcon,
  ShoppingIcon,
  EntertainmentIcon,
  BillsIcon,
  HealthcareIcon,
  EducationIcon,
  TravelIcon,
  HomeIcon,
  StatsIcon,
  TransactionsIcon,
  SettingsIcon,
  AddIcon,
  CloseIcon,
  DeleteIcon,
  EditIcon,
  FilterIcon,
  SearchIcon,
  SpinnerIcon,
  PulseDotsIcon,
  CheckmarkIcon,
  ProgressRingIcon,
  LogoIcon,
  Favicon16Icon,
  Favicon32Icon,
}

// Icon map for dynamic loading
export const CATEGORY_ICONS = {
  food: FoodIcon,
  transport: TransportIcon,
  shopping: ShoppingIcon,
  entertainment: EntertainmentIcon,
  bills: BillsIcon,
  healthcare: HealthcareIcon,
  education: EducationIcon,
  travel: TravelIcon,
} as const

export const NAVIGATION_ICONS = {
  home: HomeIcon,
  stats: StatsIcon,
  transactions: TransactionsIcon,
  settings: SettingsIcon,
} as const

export const UI_ICONS = {
  add: AddIcon,
  close: CloseIcon,
  delete: DeleteIcon,
  edit: EditIcon,
  filter: FilterIcon,
  search: SearchIcon,
} as const

export type CategoryIconName = keyof typeof CATEGORY_ICONS
export type NavigationIconName = keyof typeof NAVIGATION_ICONS
export type UIIconName = keyof typeof UI_ICONS