import { useState } from 'react'
import TransactionList from '@/components/Transaction/TransactionList'
import { mockTransactions, mockCategories } from '@/utils/mockData'
import { Transaction } from '@/types'

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions)

  const handleTransactionUpdate = (updatedTransaction: Transaction) => {
    setTransactions(prev => 
      prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    )
  }

  const handleTransactionDelete = (transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
        <div className="text-sm text-gray-500">
          {transactions.length} total
        </div>
      </div>
      
      <TransactionList
        transactions={transactions}
        categories={mockCategories}
        onTransactionUpdate={handleTransactionUpdate}
        onTransactionDelete={handleTransactionDelete}
      />
    </div>
  )
}