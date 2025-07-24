import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { localStorageService, LocalStorageError } from '@/services/localStorageService'
import { Transaction, Category } from '@/types'

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] || null,
  }
})()

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('LocalStorageService', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('Transactions', () => {
    it('should store and retrieve transactions', () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          amount: 100,
          type: 'expense',
          categoryId: 'cat1',
          description: 'Test transaction',
          date: new Date('2024-01-01'),
          householdId: 'house1',
          userId: 'user1',
          syncStatus: 'synced',
          lastModified: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
        }
      ]

      localStorageService.setTransactions(mockTransactions)
      const retrieved = localStorageService.getTransactions()

      expect(retrieved).toHaveLength(1)
      expect(retrieved[0].id).toBe('1')
      expect(retrieved[0].amount).toBe(100)
      expect(retrieved[0].date).toBeInstanceOf(Date)
      expect(retrieved[0].date.getTime()).toBe(new Date('2024-01-01').getTime())
      expect(retrieved[0].createdAt).toBeInstanceOf(Date)
      expect(retrieved[0].lastModified).toBeInstanceOf(Date)
    })

    it('should return empty array when no transactions stored', () => {
      const transactions = localStorageService.getTransactions()
      expect(transactions).toEqual([])
    })

    it('should handle corrupted transaction data gracefully', () => {
      localStorageMock.setItem('monefy_transactions', 'invalid json')
      const transactions = localStorageService.getTransactions()
      expect(transactions).toEqual([])
    })
  })

  describe('Categories', () => {
    it('should store and retrieve categories', () => {
      const mockCategories: Category[] = [
        {
          id: '1',
          name: 'Food',
          icon: 'food',
          color: 'bg-orange-500',
          type: 'expense',
          householdId: 'house1',
          isDefault: true,
          order: 1,
        }
      ]

      localStorageService.setCategories(mockCategories)
      const retrieved = localStorageService.getCategories()

      expect(retrieved).toHaveLength(1)
      expect(retrieved[0].name).toBe('Food')
      expect(retrieved[0].type).toBe('expense')
    })

    it('should return empty array when no categories stored', () => {
      const categories = localStorageService.getCategories()
      expect(categories).toEqual([])
    })
  })

  describe('Backup and Restore', () => {
    it('should create and restore backup', () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          amount: 50,
          type: 'income',
          categoryId: 'cat1',
          date: new Date('2024-01-01'),
          householdId: 'house1',
          userId: 'user1',
          syncStatus: 'synced',
          lastModified: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
        }
      ]

      const mockCategories: Category[] = [
        {
          id: '1',
          name: 'Salary',
          icon: 'bills',
          color: 'bg-green-500',
          type: 'income',
          isDefault: true,
          order: 1,
        }
      ]

      // Store initial data
      localStorageService.setTransactions(mockTransactions)
      localStorageService.setCategories(mockCategories)

      // Create backup
      const backupData = localStorageService.createBackup()
      expect(backupData).toBeTruthy()

      // Clear storage
      localStorageService.clearAll()
      expect(localStorageService.getTransactions()).toEqual([])
      expect(localStorageService.getCategories()).toEqual([])

      // Restore from backup
      localStorageService.restoreBackup(backupData)
      const restoredTransactions = localStorageService.getTransactions()
      const restoredCategories = localStorageService.getCategories()

      expect(restoredTransactions).toHaveLength(1)
      expect(restoredTransactions[0].amount).toBe(50)
      expect(restoredCategories).toHaveLength(1)
      expect(restoredCategories[0].name).toBe('Salary')
    })

    it('should handle invalid backup data', () => {
      expect(() => {
        localStorageService.restoreBackup('invalid json')
      }).toThrow(LocalStorageError)

      expect(() => {
        localStorageService.restoreBackup('{"invalid": "structure"}')
      }).toThrow(LocalStorageError)
    })
  })

  describe('Storage Usage', () => {
    it('should return storage usage information', () => {
      const usage = localStorageService.getStorageUsage()
      
      expect(usage).toHaveProperty('isAvailable')
      expect(usage).toHaveProperty('used')
      expect(usage).toHaveProperty('available')
      expect(usage).toHaveProperty('usedPercentage')
      
      expect(typeof usage.isAvailable).toBe('boolean')
      expect(typeof usage.used).toBe('number')
      expect(typeof usage.available).toBe('number')
      expect(typeof usage.usedPercentage).toBe('number')
    })

    it('should detect when storage is nearly full', () => {
      // This is hard to test without actually filling storage
      // but we can at least verify the method exists and returns a boolean
      const isNearlyFull = localStorageService.isStorageNearlyFull()
      expect(typeof isNearlyFull).toBe('boolean')
    })
  })

  describe('Data Export/Import', () => {
    it('should export data as JSON string', () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          amount: 25,
          type: 'expense',
          categoryId: 'cat1',
          date: new Date('2024-01-01'),
          householdId: 'house1',
          userId: 'user1',
          syncStatus: 'synced',
          lastModified: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
        }
      ]

      localStorageService.setTransactions(mockTransactions)
      const exportedData = localStorageService.exportData()
      
      expect(exportedData).toBeTruthy()
      expect(typeof exportedData).toBe('string')
      
      // Should be valid JSON
      expect(() => JSON.parse(exportedData)).not.toThrow()
    })

    it('should import data from JSON string', () => {
      const mockData = {
        timestamp: new Date(),
        version: '1.0',
        data: {
          transactions: [
            {
              id: '1',
              amount: 75,
              type: 'expense',
              categoryId: 'cat1',
              date: new Date('2024-01-01'),
              householdId: 'house1',
              userId: 'user1',
              syncStatus: 'synced',
              lastModified: new Date('2024-01-01'),
              createdAt: new Date('2024-01-01'),
            }
          ],
          categories: [
            {
              id: '1',
              name: 'Transport',
              icon: 'transport',
              color: 'bg-blue-500',
              type: 'expense',
              isDefault: true,
              order: 1,
            }
          ],
          appState: null,
        }
      }

      const jsonData = JSON.stringify(mockData, (_key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() }
        }
        return value
      })

      localStorageService.importData(jsonData)
      
      const transactions = localStorageService.getTransactions()
      const categories = localStorageService.getCategories()
      
      expect(transactions).toHaveLength(1)
      expect(transactions[0].amount).toBe(75)
      expect(categories).toHaveLength(1)
      expect(categories[0].name).toBe('Transport')
    })
  })
})