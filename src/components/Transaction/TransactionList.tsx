import { useState, useMemo } from 'react'
import { Transaction, Category } from '@/types'
import TransactionCard from './TransactionCard'
import TransactionModal from './TransactionModal'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import FilterIcon from '@/assets/icons/ui/filter.svg?react'
import { formatDate } from '@/utils/formatters'

interface TransactionListProps {
  transactions: Transaction[]
  categories: Category[]
  onTransactionUpdate?: (transaction: Transaction) => void
  onTransactionDelete?: (transactionId: string) => void
}

type FilterType = 'all' | 'income' | 'expense'
type SortType = 'date' | 'amount' | 'category'

export default function TransactionList({
  transactions,
  categories,
  onTransactionUpdate,
  onTransactionDelete,
}: TransactionListProps) {
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('date')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)

  // Get category by ID helper
  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id)
  }

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    // Filter by type
    if (filterType === 'income') {
      filtered = filtered.filter(t => t.type === 'income')
    } else if (filterType === 'expense') {
      filtered = filtered.filter(t => t.type === 'expense')
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.categoryId === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(t => {
        const category = getCategoryById(t.categoryId)
        return (
          t.description?.toLowerCase().includes(searchLower) ||
          category?.name.toLowerCase().includes(searchLower)
        )
      })
    }

    // Sort transactions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount
        case 'category':
          const catA = getCategoryById(a.categoryId)?.name || ''
          const catB = getCategoryById(b.categoryId)?.name || ''
          return catA.localeCompare(catB)
        case 'date':
        default:
          return b.date.getTime() - a.date.getTime()
      }
    })

    return filtered
  }, [transactions, filterType, selectedCategory, searchTerm, sortBy, categories])

  // Group transactions by date for better UX
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    
    filteredTransactions.forEach(transaction => {
      const dateKey = formatDate(transaction.date)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(transaction)
    })
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
  }, [filteredTransactions])

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const handleDeleteTransaction = (transaction: Transaction) => {
    setDeletingTransaction(transaction)
  }

  const handleConfirmDelete = () => {
    if (deletingTransaction) {
      onTransactionDelete?.(deletingTransaction.id)
      setDeletingTransaction(null)
    }
  }

  const handleTransactionSubmit = (updatedTransaction: any) => {
    if (editingTransaction) {
      onTransactionUpdate?.({
        ...editingTransaction,
        ...updatedTransaction,
        lastModified: new Date(),
      })
    }
    setEditingTransaction(null)
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="text-gray-400 mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No transactions yet
        </h3>
        <p className="text-gray-500">
          Start tracking your expenses and income by adding your first transaction.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
              showFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex space-x-2">
                {['all', 'expense', 'income'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type as FilterType)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <div className="flex space-x-2">
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'category', label: 'Category' },
                ].map((sort) => (
                  <button
                    key={sort.key}
                    onClick={() => setSortBy(sort.key as SortType)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      sortBy === sort.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 px-4">
        <span>
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </span>
      </div>

      {/* Transaction Groups */}
      <div className="space-y-6">
        {groupedTransactions.map(([date, dayTransactions]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 z-10">
              <h3 className="font-medium text-gray-900">{date}</h3>
            </div>
            
            {/* Transactions for this date */}
            <div className="px-4 space-y-2 pt-2">
              {dayTransactions.map((transaction) => {
                const category = getCategoryById(transaction.categoryId)
                if (!category) return null
                
                return (
                  <div key={transaction.id} className="group hover:shadow-sm transition-shadow">
                    <TransactionCard
                      transaction={transaction}
                      category={category}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteTransaction}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Transaction Modal */}
      <TransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleTransactionSubmit}
        initialData={editingTransaction ? {
          amount: editingTransaction.amount,
          type: editingTransaction.type,
          categoryId: editingTransaction.categoryId,
          description: editingTransaction.description,
          date: editingTransaction.date,
        } : undefined}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingTransaction}
        transaction={deletingTransaction}
        category={deletingTransaction ? getCategoryById(deletingTransaction.categoryId) || null : null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTransaction(null)}
      />
    </div>
  )
}