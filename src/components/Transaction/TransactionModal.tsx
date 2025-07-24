import { useState, useEffect } from 'react'
import { Category, TransactionFormData } from '@/types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/constants/categories'
import { nanoid } from 'nanoid'
import CategoryGrid from '@/components/Category/CategoryGrid'
import CloseIcon from '@/assets/icons/ui/close.svg?react'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (transaction: TransactionFormData) => void
  initialType?: 'expense' | 'income'
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialType = 'expense',
}: TransactionModalProps) {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'expense' | 'income'>(initialType)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [description, setDescription] = useState('')
  const [displayAmount, setDisplayAmount] = useState('0')

  // Create mock categories with IDs for this demo
  const mockCategories: Category[] = [
    ...DEFAULT_EXPENSE_CATEGORIES.map(cat => ({ ...cat, id: nanoid(), householdId: 'demo' })),
    ...DEFAULT_INCOME_CATEGORIES.map(cat => ({ ...cat, id: nanoid(), householdId: 'demo' })),
  ]

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setAmount('')
      setDisplayAmount('0')
      setType(initialType)
      setSelectedCategory(null)
      setDescription('')
    }
  }, [isOpen, initialType])

  const handleNumberClick = (num: string) => {
    if (num === '.' && amount.includes('.')) return
    if (amount.length >= 10) return // Limit input length
    
    const newAmount = amount + num
    setAmount(newAmount)
    setDisplayAmount(newAmount || '0')
  }

  const handleBackspace = () => {
    const newAmount = amount.slice(0, -1)
    setAmount(newAmount)
    setDisplayAmount(newAmount || '0')
  }

  const handleSubmit = () => {
    if (!amount || !selectedCategory || parseFloat(amount) <= 0) return

    const transaction: TransactionFormData = {
      amount: parseFloat(amount),
      type,
      categoryId: selectedCategory.id,
      description: description.trim() || undefined,
      date: new Date(),
    }

    onSubmit?.(transaction)
    onClose()
  }

  const canSubmit = amount && selectedCategory && parseFloat(amount) > 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Add {type === 'expense' ? 'Expense' : 'Income'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Display */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            ${displayAmount}
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setType('expense')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setType('income')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                type === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Category Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Category</h3>
          <CategoryGrid
            categories={mockCategories}
            selectedCategoryId={selectedCategory?.id}
            onCategorySelect={setSelectedCategory}
            type={type}
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description (Optional)</h3>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
            <button
              key={key}
              onClick={() => key === '⌫' ? handleBackspace() : handleNumberClick(key)}
              className="h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-lg transition-colors"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            canSubmit
              ? type === 'expense'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Add {type === 'expense' ? 'Expense' : 'Income'}
        </button>
      </div>
    </div>
  )
}