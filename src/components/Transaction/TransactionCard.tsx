import { Transaction, Category } from '@/types'
import { formatTransactionAmount, formatRelativeDate, formatTime } from '@/utils/formatters'
import CategoryIcon from '@/components/Category/CategoryIcon'
import EditIcon from '@/assets/icons/ui/edit.svg?react'
import DeleteIcon from '@/assets/icons/ui/delete.svg?react'
import { useState } from 'react'

interface TransactionCardProps {
  transaction: Transaction
  category: Category
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

export default function TransactionCard({
  transaction,
  category,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const [isSwipeOpen, setIsSwipeOpen] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaX = e.touches[0].clientX - startX
    setCurrentX(deltaX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    // If swiped left more than 100px, show actions
    if (currentX < -100) {
      setIsSwipeOpen(true)
    } else if (currentX > 50) {
      setIsSwipeOpen(false)
    }
    
    setCurrentX(0)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(transaction)
    setIsSwipeOpen(false)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(transaction)
    setIsSwipeOpen(false)
  }

  const cardTransform = isDragging 
    ? `translateX(${currentX}px)` 
    : isSwipeOpen 
    ? 'translateX(-120px)' 
    : 'translateX(0px)'

  return (
    <div className="relative bg-white mb-2 rounded-lg overflow-hidden">
      {/* Action buttons (behind the card) */}
      <div className="absolute right-0 top-0 h-full flex">
        <button
          onClick={handleEditClick}
          className="w-16 bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white transition-colors"
        >
          <EditIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="w-16 bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
        >
          <DeleteIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Main card content */}
      <div
        className="bg-white p-4 flex items-center justify-between transition-transform duration-200 ease-out touch-pan-y"
        style={{ transform: cardTransform }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsSwipeOpen(false)}
      >
        {/* Left side: Category icon and details */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`${category.color} p-2 rounded-lg text-white flex-shrink-0`}>
            <CategoryIcon icon={category.icon} size="md" className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 truncate">
                {transaction.description || category.name}
              </h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{category.name}</span>
              <span>•</span>
              <span>{formatRelativeDate(transaction.date)}</span>
              <span>•</span>
              <span>{formatTime(transaction.date)}</span>
            </div>
          </div>
        </div>

        {/* Right side: Amount */}
        <div className="flex-shrink-0 text-right">
          <div className={`font-semibold ${
            transaction.type === 'expense' 
              ? 'text-red-600' 
              : 'text-green-600'
          }`}>
            {formatTransactionAmount(transaction.amount, transaction.type)}
          </div>
          {transaction.syncStatus === 'pending' && (
            <div className="text-xs text-orange-500 mt-1">Syncing...</div>
          )}
          {transaction.syncStatus === 'failed' && (
            <div className="text-xs text-red-500 mt-1">Sync failed</div>
          )}
        </div>
      </div>

      {/* Desktop action buttons (visible on hover) */}
      <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleEditClick}
          className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-600 transition-colors"
        >
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
        >
          <DeleteIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}