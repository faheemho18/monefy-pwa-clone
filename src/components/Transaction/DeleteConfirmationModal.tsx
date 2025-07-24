import { Transaction, Category } from '@/types'
import { formatTransactionAmount } from '@/utils/formatters'
import CategoryIcon from '@/components/Category/CategoryIcon'
import { useState, useEffect } from 'react'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  transaction: Transaction | null
  category: Category | null
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmationModal({
  isOpen,
  transaction,
  category,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const [showUndoNotification, setShowUndoNotification] = useState(false)

  useEffect(() => {
    if (showUndoNotification) {
      const timer = setTimeout(() => {
        setShowUndoNotification(false)
      }, 5000) // Hide after 5 seconds
      
      return () => clearTimeout(timer)
    }
  }, [showUndoNotification])

  const handleConfirm = () => {
    onConfirm()
    setShowUndoNotification(true)
  }

  const handleUndoDelete = () => {
    setShowUndoNotification(false)
    // In a real app, this would restore the transaction
    console.log('Undo delete transaction')
  }

  if (!isOpen || !transaction || !category) return null

  return (
    <>
      {/* Delete Confirmation Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-sm bg-white rounded-xl p-6">
          {/* Transaction Preview */}
          <div className="flex items-center space-x-3 mb-6">
            <div className={`${category.color} p-2 rounded-lg text-white`}>
              <CategoryIcon icon={category.icon} size="md" className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {transaction.description || category.name}
              </h3>
              <p className="text-sm text-gray-500">{category.name}</p>
            </div>
            <div className={`font-semibold ${
              transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
            }`}>
              {formatTransactionAmount(transaction.amount, transaction.type)}
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Transaction?
            </h2>
            <p className="text-gray-600">
              This action cannot be undone. The transaction will be permanently removed from your records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Undo Notification */}
      {showUndoNotification && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-lg flex items-center justify-between">
            <span>Transaction deleted</span>
            <button
              onClick={handleUndoDelete}
              className="text-blue-400 hover:text-blue-300 font-medium ml-4"
            >
              UNDO
            </button>
          </div>
        </div>
      )}
    </>
  )
}