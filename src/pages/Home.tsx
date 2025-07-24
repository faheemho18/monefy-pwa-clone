import BalanceDisplay from '@/components/Balance/BalanceDisplay'
import TransactionModal from '@/components/Transaction/TransactionModal'
import TransactionCard from '@/components/Transaction/TransactionCard'
import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { TransactionFormData } from '@/types'
import AddIcon from '@/assets/icons/ui/add.svg?react'
import { FormErrorBoundary } from '@/components/ErrorBoundary'
import { hapticFeedback } from '@/utils/haptics'

export default function Home() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const { 
    transactions, 
    categories, 
    isLoading, 
    error, 
    addTransaction,
    storageUsage 
  } = useLocalStorage()
  
  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5)
  
  // Calculate totals for balance display
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const handleTransactionSubmit = (transactionData: TransactionFormData) => {
    addTransaction(transactionData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {storageUsage.usedPercentage > 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-600 text-sm">
            Storage is {Math.round(storageUsage.usedPercentage)}% full. Consider exporting and clearing old data.
          </p>
        </div>
      )}
      
      <BalanceDisplay 
        transactions={transactions}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
      />
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            hapticFeedback.click()
            setIsTransactionModalOpen(true)
          }}
          className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white p-6 rounded-xl flex flex-col items-center space-y-2 transition-colors min-h-[96px] touch-manipulation focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
          aria-label="Add new expense transaction"
        >
          <AddIcon className="w-8 h-8 flex-shrink-0" />
          <span className="font-medium text-sm">Add Expense</span>
        </button>
        <button
          onClick={() => {
            hapticFeedback.click()
            setIsTransactionModalOpen(true)
          }}
          className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white p-6 rounded-xl flex flex-col items-center space-y-2 transition-colors min-h-[96px] touch-manipulation focus:ring-2 focus:ring-green-300 focus:ring-offset-2"
          aria-label="Add new income transaction"
        >
          <AddIcon className="w-8 h-8 flex-shrink-0" />
          <span className="font-medium text-sm">Add Income</span>
        </button>
      </div>

      {/* Recent Transactions Preview */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
            View All
          </button>
        </div>
        
        {recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {recentTransactions.map((transaction) => {
              const category = categories.find(cat => cat.id === transaction.categoryId)
              if (!category) return null
              
              return (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  category={category}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No transactions yet. Add your first transaction above!
          </div>
        )}
      </div>

      <FormErrorBoundary>
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSubmit={handleTransactionSubmit}
        />
      </FormErrorBoundary>
    </div>
  )
}