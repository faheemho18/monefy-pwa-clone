import BalanceDisplay from '@/components/Balance/BalanceDisplay'
import TransactionModal from '@/components/Transaction/TransactionModal'
import TransactionCard from '@/components/Transaction/TransactionCard'
import { useState } from 'react'
import { mockTransactions, mockCategories } from '@/utils/mockData'
import AddIcon from '@/assets/icons/ui/add.svg?react'

export default function Home() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  
  // Get recent transactions (last 5)
  const recentTransactions = mockTransactions.slice(0, 5)
  
  // Calculate totals for balance display
  const totalIncome = mockTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      <BalanceDisplay 
        transactions={mockTransactions}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
      />
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setIsTransactionModalOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-colors"
        >
          <AddIcon className="w-6 h-6" />
          <span className="font-medium">Add Expense</span>
        </button>
        <button
          onClick={() => setIsTransactionModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl flex flex-col items-center space-y-2 transition-colors"
        >
          <AddIcon className="w-6 h-6" />
          <span className="font-medium">Add Income</span>
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
              const category = mockCategories.find(cat => cat.id === transaction.categoryId)
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

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />
    </div>
  )
}