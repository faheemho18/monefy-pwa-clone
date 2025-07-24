import { useEffect, useState, useCallback } from 'react'
import { localStorageService, LocalStorageError } from '@/services/localStorageService'
import { Transaction, Category } from '@/types'
import { mockTransactions, mockCategories } from '@/utils/mockData'

interface UseLocalStorageReturn {
  transactions: Transaction[]
  categories: Category[]
  isLoading: boolean
  error: string | null
  addTransaction: (transaction: Omit<Transaction, 'id' | 'householdId' | 'userId' | 'syncStatus' | 'lastModified' | 'createdAt'>) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  clearAllData: () => void
  exportData: () => string
  importData: (jsonData: string) => void
  storageUsage: {
    isAvailable: boolean
    used: number
    available: number
    usedPercentage: number
  }
}

export function useLocalStorage(): UseLocalStorageReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize data from localStorage or use mock data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load transactions
        let storedTransactions = localStorageService.getTransactions()
        if (storedTransactions.length === 0) {
          // First time user - initialize with mock data
          storedTransactions = mockTransactions
          localStorageService.setTransactions(storedTransactions)
        }

        // Load categories
        let storedCategories = localStorageService.getCategories()
        if (storedCategories.length === 0) {
          // First time user - initialize with mock categories
          storedCategories = mockCategories
          localStorageService.setCategories(storedCategories)
        }

        setTransactions(storedTransactions)
        setCategories(storedCategories)

      } catch (err) {
        console.error('Failed to initialize data from localStorage:', err)
        setError(err instanceof LocalStorageError ? err.message : 'Failed to load data')
        
        // Fallback to mock data
        setTransactions(mockTransactions)
        setCategories(mockCategories)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && transactions.length > 0) {
      try {
        localStorageService.setTransactions(transactions)
      } catch (err) {
        console.error('Failed to save transactions:', err)
        setError(err instanceof LocalStorageError ? err.message : 'Failed to save data')
      }
    }
  }, [transactions, isLoading])

  // Save categories to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      try {
        localStorageService.setCategories(categories)
      } catch (err) {
        console.error('Failed to save categories:', err)
        setError(err instanceof LocalStorageError ? err.message : 'Failed to save data')
      }
    }
  }, [categories, isLoading])

  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id' | 'householdId' | 'userId' | 'syncStatus' | 'lastModified' | 'createdAt'>) => {
    try {
      const newTransaction: Transaction = {
        ...transactionData,
        id: crypto.randomUUID(),
        householdId: 'demo',
        userId: 'demo-user',
        syncStatus: 'synced',
        lastModified: new Date(),
        createdAt: new Date(),
      }

      setTransactions(prev => [newTransaction, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()))
      setError(null)
    } catch (err) {
      console.error('Failed to add transaction:', err)
      setError('Failed to add transaction')
    }
  }, [])

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    try {
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id 
            ? { ...transaction, ...updates, lastModified: new Date() }
            : transaction
        ).sort((a, b) => b.date.getTime() - a.date.getTime())
      )
      setError(null)
    } catch (err) {
      console.error('Failed to update transaction:', err)
      setError('Failed to update transaction')
    }
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    try {
      setTransactions(prev => prev.filter(transaction => transaction.id !== id))
      setError(null)
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      setError('Failed to delete transaction')
    }
  }, [])

  const clearAllData = useCallback(() => {
    try {
      localStorageService.clearAll()
      setTransactions([])
      setCategories([])
      setError(null)
    } catch (err) {
      console.error('Failed to clear data:', err)
      setError('Failed to clear data')
    }
  }, [])

  const exportData = useCallback(() => {
    try {
      return localStorageService.exportData()
    } catch (err) {
      console.error('Failed to export data:', err)
      setError('Failed to export data')
      return ''
    }
  }, [])

  const importData = useCallback((jsonData: string) => {
    try {
      localStorageService.importData(jsonData)
      
      // Reload data from localStorage
      const importedTransactions = localStorageService.getTransactions()
      const importedCategories = localStorageService.getCategories()
      
      setTransactions(importedTransactions)
      setCategories(importedCategories)
      setError(null)
    } catch (err) {
      console.error('Failed to import data:', err)
      setError(err instanceof LocalStorageError ? err.message : 'Failed to import data')
    }
  }, [])

  // Get storage usage information
  const storageUsage = localStorageService.getStorageUsage()

  return {
    transactions,
    categories,
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllData,
    exportData,
    importData,
    storageUsage,
  }
}