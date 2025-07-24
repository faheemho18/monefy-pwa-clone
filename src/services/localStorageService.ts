import { Transaction, Category, AppState } from '@/types'

// Storage keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'monefy_transactions',
  CATEGORIES: 'monefy_categories',
  APP_STATE: 'monefy_app_state',
  BACKUP: 'monefy_backup',
} as const

// Error types
export class LocalStorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'LocalStorageError'
  }
}

export class StorageQuotaError extends LocalStorageError {
  constructor() {
    super('Storage quota exceeded. Please clear some data or free up space.')
    this.name = 'StorageQuotaError'
  }
}

// Date serialization helpers
const dateReplacer = (_key: string, value: any): any => {
  if (value instanceof Date) {
    return { __type: 'Date', value: value.toISOString() }
  }
  return value
}

const dateReviver = (_key: string, value: any): any => {
  if (value && typeof value === 'object' && value.__type === 'Date') {
    return new Date(value.value)
  }
  return value
}

// Core localStorage operations
class LocalStorageService {
  /**
   * Check if localStorage is available
   */
  private isAvailable(): boolean {
    try {
      const testKey = '__localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get available storage space (estimate)
   */
  private getStorageInfo(): { used: number; available: number } {
    let used = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }
    
    // Rough estimate - most browsers allow 5-10MB for localStorage
    const available = Math.max(0, 5 * 1024 * 1024 - used) // 5MB estimate
    
    return { used, available }
  }

  /**
   * Safely set item in localStorage with error handling
   */
  private setItem(key: string, value: string): void {
    if (!this.isAvailable()) {
      throw new LocalStorageError('localStorage is not available')
    }

    try {
      localStorage.setItem(key, value)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageQuotaError()
      }
      throw new LocalStorageError(`Failed to store data: ${error}`, error as Error)
    }
  }

  /**
   * Safely get item from localStorage with error handling
   */
  private getItem(key: string): string | null {
    if (!this.isAvailable()) {
      return null
    }

    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn(`Failed to retrieve data for key ${key}:`, error)
      return null
    }
  }

  /**
   * Safely remove item from localStorage
   */
  private removeItem(key: string): void {
    if (!this.isAvailable()) {
      return
    }

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove data for key ${key}:`, error)
    }
  }

  /**
   * Serialize data to JSON string with Date handling
   */
  private serialize<T>(data: T): string {
    try {
      return JSON.stringify(data, dateReplacer)
    } catch (error) {
      throw new LocalStorageError(`Failed to serialize data: ${error}`, error as Error)
    }
  }

  /**
   * Deserialize data from JSON string with Date handling
   */
  private deserialize<T>(data: string): T {
    try {
      return JSON.parse(data, dateReviver)
    } catch (error) {
      throw new LocalStorageError(`Failed to deserialize data: ${error}`, error as Error)
    }
  }

  // Public API methods

  /**
   * Store transactions
   */
  setTransactions(transactions: Transaction[]): void {
    try {
      const serialized = this.serialize(transactions)
      this.setItem(STORAGE_KEYS.TRANSACTIONS, serialized)
    } catch (error) {
      console.error('Failed to store transactions:', error)
      throw error
    }
  }

  /**
   * Retrieve transactions
   */
  getTransactions(): Transaction[] {
    const data = this.getItem(STORAGE_KEYS.TRANSACTIONS)
    if (!data) return []
    
    try {
      const parsed = this.deserialize<Transaction[]>(data)
      // Ensure dates are properly converted
      return parsed.map(transaction => ({
        ...transaction,
        date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
        createdAt: transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt),
        lastModified: transaction.lastModified instanceof Date ? transaction.lastModified : new Date(transaction.lastModified),
      }))
    } catch (error) {
      console.warn('Failed to load transactions from localStorage:', error)
      return []
    }
  }

  /**
   * Store categories
   */
  setCategories(categories: Category[]): void {
    const serialized = this.serialize(categories)
    this.setItem(STORAGE_KEYS.CATEGORIES, serialized)
  }

  /**
   * Retrieve categories
   */
  getCategories(): Category[] {
    const data = this.getItem(STORAGE_KEYS.CATEGORIES)
    if (!data) return []
    
    try {
      return this.deserialize<Category[]>(data)
    } catch (error) {
      console.warn('Failed to load categories from localStorage:', error)
      return []
    }
  }

  /**
   * Store partial app state
   */
  setAppState(state: Partial<AppState>): void {
    const serialized = this.serialize(state)
    this.setItem(STORAGE_KEYS.APP_STATE, serialized)
  }

  /**
   * Retrieve app state
   */
  getAppState(): Partial<AppState> | null {
    const data = this.getItem(STORAGE_KEYS.APP_STATE)
    if (!data) return null
    
    try {
      return this.deserialize<Partial<AppState>>(data)
    } catch (error) {
      console.warn('Failed to load app state from localStorage:', error)
      return null
    }
  }

  /**
   * Create backup of all data
   */
  createBackup(): string {
    const backup = {
      timestamp: new Date(),
      version: '1.0',
      data: {
        transactions: this.getTransactions(),
        categories: this.getCategories(),
        appState: this.getAppState(),
      }
    }
    
    const serialized = this.serialize(backup)
    this.setItem(STORAGE_KEYS.BACKUP, serialized)
    
    return serialized
  }

  /**
   * Restore from backup
   */
  restoreBackup(backupData: string): void {
    try {
      const backup = this.deserialize<{
        timestamp: Date
        version: string
        data: {
          transactions: Transaction[]
          categories: Category[]
          appState: Partial<AppState> | null
        }
      }>(backupData)

      // Validate backup structure
      if (!backup.data || !Array.isArray(backup.data.transactions)) {
        throw new Error('Invalid backup format')
      }

      // Restore data
      this.setTransactions(backup.data.transactions)
      this.setCategories(backup.data.categories)
      if (backup.data.appState) {
        this.setAppState(backup.data.appState)
      }

    } catch (error) {
      throw new LocalStorageError(`Failed to restore backup: ${error}`, error as Error)
    }
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key)
    })
  }

  /**
   * Get storage usage information
   */
  getStorageUsage(): {
    isAvailable: boolean
    used: number
    available: number
    usedPercentage: number
  } {
    const isAvailable = this.isAvailable()
    if (!isAvailable) {
      return { isAvailable: false, used: 0, available: 0, usedPercentage: 0 }
    }

    const { used, available } = this.getStorageInfo()
    const total = used + available
    const usedPercentage = total > 0 ? (used / total) * 100 : 0

    return {
      isAvailable: true,
      used,
      available,
      usedPercentage
    }
  }

  /**
   * Check if storage is nearly full (>80% usage)
   */
  isStorageNearlyFull(): boolean {
    const usage = this.getStorageUsage()
    return usage.usedPercentage > 80
  }

  /**
   * Export data as downloadable JSON file
   */
  exportData(): string {
    return this.createBackup()
  }

  /**
   * Import data from JSON string
   */
  importData(jsonData: string): void {
    this.restoreBackup(jsonData)
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService()

// Export for testing
export { LocalStorageService }