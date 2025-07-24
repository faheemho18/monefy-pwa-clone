import { Category } from '@/types'

// Default expense categories
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'householdId'>[] = [
  {
    name: 'Food',
    icon: 'food',
    color: 'bg-orange-500',
    type: 'expense',
    isDefault: true,
    order: 1,
  },
  {
    name: 'Transport',
    icon: 'transport',
    color: 'bg-blue-500',
    type: 'expense',
    isDefault: true,
    order: 2,
  },
  {
    name: 'Entertainment',
    icon: 'entertainment',
    color: 'bg-purple-500',
    type: 'expense',
    isDefault: true,
    order: 3,
  },
  {
    name: 'Bills',
    icon: 'bills',
    color: 'bg-red-500',
    type: 'expense',
    isDefault: true,
    order: 4,
  },
  {
    name: 'Healthcare',
    icon: 'healthcare',
    color: 'bg-green-500',
    type: 'expense',
    isDefault: true,
    order: 5,
  },
  {
    name: 'Shopping',
    icon: 'shopping',
    color: 'bg-pink-500',
    type: 'expense',
    isDefault: true,
    order: 6,
  },
  {
    name: 'Education',
    icon: 'education',
    color: 'bg-indigo-500',
    type: 'expense',
    isDefault: true,
    order: 7,
  },
  {
    name: 'Travel',
    icon: 'travel',
    color: 'bg-cyan-500',
    type: 'expense',
    isDefault: true,
    order: 8,
  },
]

// Default income categories
export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'householdId'>[] = [
  {
    name: 'Salary',
    icon: 'bills', // Reusing bills icon for salary
    color: 'bg-green-600',
    type: 'income',
    isDefault: true,
    order: 1,
  },
  {
    name: 'Freelance',
    icon: 'education', // Reusing education icon
    color: 'bg-blue-600',
    type: 'income',
    isDefault: true,
    order: 2,
  },
  {
    name: 'Investment',
    icon: 'shopping', // Reusing shopping icon
    color: 'bg-purple-600',
    type: 'income',
    isDefault: true,
    order: 3,
  },
  {
    name: 'Other',
    icon: 'transport', // Reusing transport icon
    color: 'bg-gray-600',
    type: 'income',
    isDefault: true,
    order: 4,
  },
]

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
]