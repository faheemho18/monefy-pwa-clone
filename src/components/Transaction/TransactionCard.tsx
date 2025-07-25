import { useState, useRef } from 'react'
import { Transaction } from '@/types'

interface TransactionCardProps {
  transaction: Transaction
  onEdit: (transactionId: string) => void
  onDelete: (transactionId: string) => void
}

export default function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [transform, setTransform] = useState(0)
  const [showDesktopActions, setShowDesktopActions] = useState(false)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX || 0
    setIsDragging(true)
    
    // Store touch start position on the element
    if (cardRef.current) {
      cardRef.current.setAttribute('data-touch-start-x', touchStartX.current.toString())
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentX = e.touches[0]?.clientX || 0
    const deltaX = touchStartX.current - currentX
    
    // Only allow left swipe (positive deltaX)
    if (deltaX > 0) {
      const newTransform = Math.min(deltaX, 120) // Limit swipe distance
      setTransform(newTransform)
      
      // Apply transform to the card
      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(-${newTransform}px)`
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false)
    
    const endX = e.changedTouches[0]?.clientX || 0
    const deltaX = touchStartX.current - endX
    
    // If swiped more than 80px, reveal actions
    if (deltaX > 80) {
      setIsSwipeOpen(true)
      setTransform(120)
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(-120px)'
      }
    } else {
      // Reset position
      setIsSwipeOpen(false)
      setTransform(0)
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(0px)'
      }
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(transaction.id)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(transaction.id)
  }

  const handleCardClick = () => {
    if (!isSwipeOpen) {
      onEdit(transaction.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEdit(transaction.id)
    }
  }

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const sign = type === 'income' ? '+' : '-'
    return `${sign}$${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return dateString // For now, just return the date string as-is
  }

  return (
    <div className="relative overflow-hidden">
      <div
        ref={cardRef}
        data-testid={`transaction-card-${transaction.id}`}
        className="bg-white border border-gray-200 rounded-lg p-4 transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:scale-105 transform"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setShowDesktopActions(true)}
        onMouseLeave={() => setShowDesktopActions(false)}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Transaction: ${transaction.description}, ${formatAmount(transaction.amount, transaction.type)}, ${transaction.category} category, ${formatDate(transaction.date)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Category Icon */}
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center transition-all duration-300 ease-out transform hover:scale-110 hover:bg-blue-200">
              <svg 
                data-testid={`icon-${transaction.category}`}
                className="w-6 h-6 text-blue-600 transition-all duration-200 ease-out transform hover:rotate-12" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {transaction.description || 'No description'}
              </p>
              <p className="text-sm text-gray-500">
                {transaction.category} - {formatDate(transaction.date)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-lg font-semibold transition-all duration-200 ease-out transform hover:scale-110 ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatAmount(transaction.amount, transaction.type)}
            </span>
            
            {/* Sync Status Indicator */}
            {transaction.syncStatus && (
              <div 
                data-testid={`sync-status-${transaction.syncStatus}`}
                className={`w-2 h-2 rounded-full transition-all duration-500 ease-out transform hover:scale-150 ${
                  transaction.syncStatus === 'synced' ? 'bg-green-500 animate-pulse' :
                  transaction.syncStatus === 'pending' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500 animate-bounce'
                }`}
                title={`Sync status: ${transaction.syncStatus}`}
              />
            )}
          </div>
        </div>
        
        {/* Desktop Actions (hover) */}
        {showDesktopActions && (
          <div 
            data-testid={`desktop-actions-${transaction.id}`}
            className="absolute top-2 right-2 flex space-x-1 animate-in slide-in-from-right duration-200 ease-out"
          >
            <button
              onClick={handleEditClick}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-all duration-200 ease-out transform hover:scale-110 focus:scale-110 hover:shadow-md"
              aria-label="Edit transaction"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1 text-red-600 hover:bg-red-100 rounded transition-all duration-200 ease-out transform hover:scale-110 focus:scale-110 hover:shadow-md"
              aria-label="Delete transaction"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Swipe Actions (mobile) */}
      {isSwipeOpen && (
        <div 
          data-testid={`swipe-actions-${transaction.id}`}
          className="absolute top-0 right-0 h-full flex items-center animate-in slide-in-from-right duration-300 ease-out"
          aria-live="polite"
          aria-label="Transaction actions revealed"
        >
          <button
            onClick={handleEditClick}
            className="h-full px-4 bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 hover:shadow-lg"
            aria-label="Edit transaction"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteClick}
            className="h-full px-4 bg-red-500 text-white font-medium hover:bg-red-600 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 hover:shadow-lg"
            aria-label="Delete transaction"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}