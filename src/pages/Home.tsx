import BalanceDisplay from '@/components/Balance/BalanceDisplay'
import TransactionModal from '@/components/Transaction/TransactionModal'
import { useState } from 'react'
import AddIcon from '@/assets/icons/ui/add.svg?react'

export default function Home() {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <BalanceDisplay />
      
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
        <h3 className="font-semibold text-gray-900 mb-3">Recent Transactions</h3>
        <div className="text-gray-500 text-center py-8">
          No transactions yet. Add your first transaction above!
        </div>
      </div>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />
    </div>
  )
}