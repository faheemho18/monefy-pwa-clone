// Core application types

export interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  householdId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Household {
  id: string
  name: string
  members: string[] // User IDs
  inviteCode?: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'expense' | 'income'
  householdId?: string
  isDefault: boolean
  order: number
}

export interface Transaction {
  id: string
  amount: number
  type: 'expense' | 'income'
  categoryId: string
  description?: string
  date: Date
  householdId: string
  userId: string
  syncStatus: 'synced' | 'pending' | 'failed'
  lastModified: Date
  createdAt: Date
}

export interface AppState {
  user: User | null
  household: Household | null
  categories: Category[]
  transactions: Transaction[]
  isLoading: boolean
  isOffline: boolean
  syncQueue: Transaction[]
}

export type TransactionFormData = Omit<Transaction, 'id' | 'householdId' | 'userId' | 'syncStatus' | 'lastModified' | 'createdAt'>