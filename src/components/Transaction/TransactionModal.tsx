import { useState, useEffect } from 'react'
import { Category, TransactionFormData } from '@/types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@/constants/categories'
import { nanoid } from 'nanoid'
import CategoryGrid from '@/components/Category/CategoryGrid'
import CloseIcon from '@/assets/icons/ui/close.svg?react'
import { validateTransaction, validateAmountInput } from '@/utils/validation'
import { ErrorSummary } from '@/components/UI/ErrorDisplay'
import { ValidatedTextArea } from '@/components/UI/ValidatedInput'
import { hapticFeedback } from '@/utils/haptics'
import LoadingSpinner from '@/components/UI/LoadingSpinner'
import SuccessCheckmark from '@/components/UI/SuccessCheckmark'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (transaction: TransactionFormData) => void
  initialType?: 'expense' | 'income'
  initialData?: Partial<TransactionFormData>
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialType = 'expense',
  initialData,
}: TransactionModalProps) {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'expense' | 'income'>(initialType)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [description, setDescription] = useState('')
  const [displayAmount, setDisplayAmount] = useState('0')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [amountError, setAmountError] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Create mock categories with IDs for this demo
  const mockCategories: Category[] = [
    ...DEFAULT_EXPENSE_CATEGORIES.map(cat => ({ ...cat, id: nanoid(), householdId: 'demo' })),
    ...DEFAULT_INCOME_CATEGORIES.map(cat => ({ ...cat, id: nanoid(), householdId: 'demo' })),
  ]

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Populate form with initial data for editing
        const amountStr = initialData.amount?.toString() || ''
        setAmount(amountStr)
        setDisplayAmount(amountStr || '0')
        setType(initialData.type || initialType)
        setDescription(initialData.description || '')
        
        // Find and set the category
        if (initialData.categoryId) {
          const category = mockCategories.find(cat => cat.id === initialData.categoryId)
          setSelectedCategory(category || null)
        } else {
          setSelectedCategory(null)
        }
      } else {
        // Reset form when modal opens for new transaction
        setAmount('')
        setDisplayAmount('0')
        setType(initialType)
        setSelectedCategory(null)
        setDescription('')
      }
    }
  }, [isOpen, initialType, initialData])

  const handleNumberClick = (num: string) => {
    // Prevent multiple decimal points
    if (num === '.' && amount.includes('.')) {
      hapticFeedback.error()
      return
    }
    
    // Prevent starting with multiple zeros
    if (num === '0' && amount === '0') {
      hapticFeedback.error()
      return
    }
    
    // Limit input length to prevent overflow
    if (amount.length >= 10) {
      hapticFeedback.error()
      return
    }
    
    // Prevent more than 2 decimal places
    if (amount.includes('.')) {
      const decimalPart = amount.split('.')[1]
      if (decimalPart && decimalPart.length >= 2 && num !== '⌫') {
        hapticFeedback.error()
        return
      }
    }
    
    const newAmount = amount + num
    setAmount(newAmount)
    setDisplayAmount(newAmount || '0')
    
    // Haptic feedback for successful input
    hapticFeedback.keypress()
    
    // Real-time validation for amount
    const amountValidation = validateAmountInput(newAmount)
    if (!amountValidation.success && amountValidation.errors) {
      setAmountError(amountValidation.errors.root || [])
    } else {
      setAmountError([])
    }
  }

  const handleBackspace = () => {
    const newAmount = amount.slice(0, -1)
    setAmount(newAmount)
    setDisplayAmount(newAmount || '0')
    
    // Haptic feedback for delete
    hapticFeedback.delete()
    
    // Real-time validation for amount
    if (newAmount) {
      const amountValidation = validateAmountInput(newAmount)
      if (!amountValidation.success && amountValidation.errors) {
        setAmountError(amountValidation.errors.root || [])
      } else {
        setAmountError([])
      }
    } else {
      setAmountError([])
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    setValidationErrors({})
    
    try {
      // Validate all form data
      const transactionData = {
        amount: parseFloat(amount),
        type,
        categoryId: selectedCategory?.id || '',
        description: description.trim() || undefined,
        date: new Date(),
      }
      
      const validation = validateTransaction(transactionData)
      
      if (!validation.success) {
        setValidationErrors(validation.errors || {})
        return
      }
      
      // Additional edge case validations
      const errors: Record<string, string[]> = {}
      
      // Check if amount is provided
      if (!amount.trim()) {
        errors.amount = ['Amount is required']
      }
      
      // Check if category is selected
      if (!selectedCategory) {
        errors.category = ['Please select a category']
      }
      
      // Check for invalid characters in description
      if (description.trim() && description.trim().length > 200) {
        errors.description = ['Description cannot exceed 200 characters']
      }
      
      // Check for suspicious patterns (optional - prevent potential abuse)
      if (description.trim() && /[<>{}]/g.test(description)) {
        errors.description = ['Description contains invalid characters']
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        hapticFeedback.error()
        return
      }
      
      // If all validations pass, submit the transaction
      const finalTransaction: TransactionFormData = {
        amount: validation.data!.amount,
        type: validation.data!.type,
        categoryId: validation.data!.categoryId,
        description: validation.data!.description,
        date: validation.data!.date,
      }
      
      hapticFeedback.addTransaction()
      
      // Show success animation before closing
      setShowSuccess(true)
      
      // Wait for success animation, then close
      setTimeout(() => {
        onSubmit?.(finalTransaction)
        onClose()
        
        // Reset form state
        setAmount('')
        setDisplayAmount('0')
        setSelectedCategory(null)
        setDescription('')
        setValidationErrors({})
        setAmountError([])
        setShowSuccess(false)
      }, 1000)
      
    } catch (error) {
      console.error('Error submitting transaction:', error)
      setValidationErrors({
        submit: ['An unexpected error occurred. Please try again.']
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = amount && selectedCategory && parseFloat(amount) > 0 && !isSubmitting && amountError.length === 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop with fade-in animation */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal with slide-up animation */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 ease-out shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit' : 'Add'} {type === 'expense' ? 'Expense' : 'Income'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Error Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="mb-4">
            <ErrorSummary errors={validationErrors} />
          </div>
        )}

        {/* Amount Display with smooth transitions */}
        <div className="text-center mb-6">
          <div className={`text-3xl font-bold mb-2 transition-all duration-200 ease-out ${
            amountError.length > 0 
              ? 'text-red-600 animate-pulse' 
              : 'text-gray-900 transform hover:scale-105'
          }`}>
            ${displayAmount}
          </div>
          {amountError.length > 0 && (
            <div className="text-sm text-red-600 mb-2">
              {amountError[0]}
            </div>
          )}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setType('expense')}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out disabled:opacity-50 transform hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-offset-2 ${
                type === 'expense'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 focus:ring-red-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setType('income')}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out disabled:opacity-50 transform hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-offset-2 ${
                type === 'income'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 focus:ring-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Category Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Category
            <span className="text-red-500 ml-1">*</span>
          </h3>
          <CategoryGrid
            categories={mockCategories}
            selectedCategoryId={selectedCategory?.id}
            onCategorySelect={setSelectedCategory}
            type={type}
          />
          {validationErrors.category && (
            <div className="mt-2 text-sm text-red-600">
              {validationErrors.category[0]}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <ValidatedTextArea
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note..."
            maxLength={200}
            rows={3}
            errors={validationErrors.description}
            hint="Brief description of the transaction"
            disabled={isSubmitting}
          />
        </div>

        {/* Keypad */}
        {/* Numeric Keypad with enhanced animations */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((key) => (
            <button
              key={key}
              onClick={() => key === '⌫' ? handleBackspace() : handleNumberClick(key)}
              disabled={isSubmitting}
              className="h-14 min-w-[56px] bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg font-medium text-lg transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95 hover:shadow-md"
              aria-label={key === '⌫' ? 'Delete' : `Enter ${key}`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Submit Button with enhanced animations */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ease-out flex items-center justify-center transform hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-offset-2 ${
            canSubmit
              ? type === 'expense'
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 focus:ring-red-500'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 focus:ring-green-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {showSuccess ? (
            <>
              <SuccessCheckmark size="sm" className="mr-2" />
              <span className="animate-pulse">Success!</span>
            </>
          ) : isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              <span className="animate-pulse">Processing...</span>
            </>
          ) : (
            <>
              {initialData ? 'Update' : 'Add'} {type === 'expense' ? 'Expense' : 'Income'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}