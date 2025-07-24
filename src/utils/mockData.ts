import { Transaction, Category } from '@/types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/constants/categories'
import { nanoid } from 'nanoid'

// Create mock categories with IDs
export const mockCategories: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES.map(cat => ({ ...cat, id: nanoid(), householdId: 'demo' })),
  ...DEFAULT_INCOME_CATEGORIES.map(cat => ({ ...cat, id: nanoid(), householdId: 'demo' })),
]

// Generate mock transactions
export const generateMockTransactions = (count: number = 20): Transaction[] => {
  const transactions: Transaction[] = []
  
  for (let i = 0; i < count; i++) {
    const isExpense = Math.random() > 0.3 // 70% expenses, 30% income
    const type = isExpense ? 'expense' : 'income'
    const categoryPool = isExpense 
      ? mockCategories.filter(c => c.type === 'expense')
      : mockCategories.filter(c => c.type === 'income')
    
    const category = categoryPool[Math.floor(Math.random() * categoryPool.length)]
    
    // Generate realistic amounts
    const baseAmount = isExpense 
      ? Math.random() * 200 + 10 // $10-$210 for expenses
      : Math.random() * 1000 + 500 // $500-$1500 for income
    
    const amount = Math.round(baseAmount * 100) / 100
    
    // Generate dates from the last 30 days
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
    
    const descriptions = {
      food: ['Grocery shopping', 'Restaurant dinner', 'Coffee shop', 'Fast food lunch'],
      transport: ['Gas station', 'Uber ride', 'Bus ticket', 'Parking fee'],
      entertainment: ['Movie tickets', 'Concert', 'Streaming service', 'Gaming'],
      bills: ['Electric bill', 'Internet bill', 'Phone bill', 'Rent payment'],
      healthcare: ['Doctor visit', 'Pharmacy', 'Dental checkup', 'Insurance'],
      shopping: ['Clothing store', 'Online purchase', 'Electronics', 'Home goods'],
      education: ['Course fee', 'Books', 'Workshop', 'Certification'],
      travel: ['Flight tickets', 'Hotel booking', 'Vacation expenses', 'Car rental'],
    }
    
    const categoryDescriptions = descriptions[category.icon as keyof typeof descriptions] || ['Transaction']
    const description = Math.random() > 0.3 
      ? categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)]
      : undefined
    
    transactions.push({
      id: nanoid(),
      amount,
      type,
      categoryId: category.id,
      description,
      date,
      householdId: 'demo',
      userId: 'demo-user',
      syncStatus: 'synced',
      lastModified: date,
      createdAt: date,
    })
  }
  
  // Sort by date (newest first)
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const mockTransactions = generateMockTransactions(25)