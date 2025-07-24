import { Transaction } from '@/types'

export type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all'

/**
 * Get date range for a given time period
 */
export const getDateRangeForPeriod = (period: TimePeriod) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    
    case 'week':
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
      return { start: weekStart, end: weekEnd }
    
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      return { start: monthStart, end: monthEnd }
    
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1)
      const yearEnd = new Date(today.getFullYear(), 11, 31, 23, 59, 59)
      return { start: yearStart, end: yearEnd }
    
    case 'all':
    default:
      return {
        start: new Date(0), // Beginning of time
        end: new Date()
      }
  }
}

/**
 * Filter transactions by date range
 */
export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  start: Date,
  end: Date
): Transaction[] => {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    return transactionDate >= start && transactionDate <= end
  })
}

/**
 * Filter transactions by time period
 */
export const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: TimePeriod
): Transaction[] => {
  const { start, end } = getDateRangeForPeriod(period)
  return filterTransactionsByDateRange(transactions, start, end)
}

/**
 * Calculate balance for a specific period
 */
export const calculatePeriodBalance = (
  transactions: Transaction[],
  period: TimePeriod
) => {
  const periodTransactions = filterTransactionsByPeriod(transactions, period)
  
  const income = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  return {
    income,
    expenses,
    balance: income - expenses,
    transactionCount: periodTransactions.length
  }
}

/**
 * Calculate balance trend compared to previous period
 */
export const calculateBalanceTrend = (
  transactions: Transaction[],
  period: TimePeriod
) => {
  const currentPeriod = calculatePeriodBalance(transactions, period)
  
  // Get previous period range
  const { start: currentStart } = getDateRangeForPeriod(period)
  let previousStart: Date
  let previousEnd: Date
  
  switch (period) {
    case 'today':
      previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000)
      previousEnd = new Date(currentStart.getTime() - 1)
      break
    
    case 'week':
      previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousEnd = new Date(currentStart.getTime() - 1)
      break
    
    case 'month':
      const prevMonth = new Date(currentStart)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      previousStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1)
      previousEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59)
      break
    
    case 'year':
      const prevYear = currentStart.getFullYear() - 1
      previousStart = new Date(prevYear, 0, 1)
      previousEnd = new Date(prevYear, 11, 31, 23, 59, 59)
      break
    
    default:
      // For 'all', compare with previous month
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      previousStart = new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1)
      previousEnd = new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth() + 1, 0, 23, 59, 59)
  }
  
  const previousTransactions = filterTransactionsByDateRange(transactions, previousStart, previousEnd)
  const previousIncome = previousTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const previousExpenses = previousTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const previousBalance = previousIncome - previousExpenses
  
  // Calculate percentage change
  const balanceChange = currentPeriod.balance - previousBalance
  const balanceChangePercent = previousBalance !== 0 
    ? Math.round((balanceChange / Math.abs(previousBalance)) * 100)
    : currentPeriod.balance > 0 ? 100 : currentPeriod.balance < 0 ? -100 : 0
  
  const incomeChange = currentPeriod.income - previousIncome
  const incomeChangePercent = previousIncome !== 0
    ? Math.round((incomeChange / previousIncome) * 100)
    : currentPeriod.income > 0 ? 100 : 0
  
  const expenseChange = currentPeriod.expenses - previousExpenses
  const expenseChangePercent = previousExpenses !== 0
    ? Math.round((expenseChange / previousExpenses) * 100)
    : currentPeriod.expenses > 0 ? 100 : 0
  
  return {
    current: currentPeriod,
    previous: {
      income: previousIncome,
      expenses: previousExpenses,
      balance: previousBalance
    },
    trends: {
      balance: {
        change: balanceChange,
        changePercent: balanceChangePercent,
        direction: balanceChange > 0 ? 'up' : balanceChange < 0 ? 'down' : 'neutral'
      },
      income: {
        change: incomeChange,
        changePercent: incomeChangePercent,
        direction: incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'neutral'
      },
      expenses: {
        change: expenseChange,
        changePercent: expenseChangePercent,
        direction: expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : 'neutral'
      }
    }
  }
}

/**
 * Get period display name
 */
export const getPeriodDisplayName = (period: TimePeriod): string => {
  switch (period) {
    case 'today': return 'Today'
    case 'week': return 'This Week'
    case 'month': return 'This Month'
    case 'year': return 'This Year'
    case 'all': return 'All Time'
    default: return 'All Time'
  }
}