import { useState, useMemo } from 'react'
import { Transaction } from '@/types'
import TransactionCard from './TransactionCard'

interface TransactionListProps {
  transactions: Transaction[]
  onEditTransaction: (transactionId: string) => void
  onDeleteTransaction: (transactionId: string) => void
}

type FilterType = 'all' | 'income' | 'expense'
type SortType = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'category'

export default function TransactionList({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortType>('date-desc')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique categories from transactions
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(transactions.map(t => t.category)))
    return ['all', ...categories]
  }, [transactions])

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      )
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Sort transactions
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'amount-desc':
          return b.amount - a.amount
        case 'amount-asc':
          return a.amount - b.amount
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    return sorted
  }, [transactions, searchTerm, filterType, selectedCategory, sortBy])

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    
    filteredAndSortedTransactions.forEach(transaction => {
      const dateKey = transaction.date
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(transaction)
    })
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
  }, [filteredAndSortedTransactions])

  const handleEditClick = (transactionId: string) => {
    onEditTransaction(transactionId)
  }

  const handleDeleteClick = (transactionId: string) => {
    onDeleteTransaction(transactionId)
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transactions have been added yet.</p>
      </div>
    )
  }

  if (filteredAndSortedTransactions.length === 0) {
    return (
      <div className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out focus:border-blue-500 hover:border-blue-400 focus:shadow-lg"
          />
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 ease-out transform hover:scale-105 focus:scale-105 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Filters
          </button>

          {showFilters && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg animate-in slide-in-from-top duration-300 ease-out">
              <div>
                <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700">
                  Filter by Type:
                </label>
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
                >
                  <option value="all">All</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700">
                  Filter by Category:
                </label>
                <select
                  id="filter-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
                >
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
                >
                  <option value="date-desc">Date (Newest first)</option>
                  <option value="date-asc">Date (Oldest first)</option>
                  <option value="amount-desc">Amount (Highest first)</option>
                  <option value="amount-asc">Amount (Lowest first)</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="text-center py-8">
          <p className="text-gray-500">No transactions match the current filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search transactions..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out focus:border-blue-500 hover:border-blue-400 focus:shadow-lg"
        />
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 ease-out transform hover:scale-105 focus:scale-105 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Filters
        </button>

        {showFilters && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg animate-in slide-in-from-top duration-300 ease-out">
            <div>
              <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700">
                Filter by Type:
              </label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
              >
                <option value="all">All</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700">
                Filter by Category:
              </label>
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
              >
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 ease-out focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
              >
                <option value="date-desc">Date (Newest first)</option>
                <option value="date-asc">Date (Oldest first)</option>
                <option value="amount-desc">Amount (Highest first)</option>
                <option value="amount-asc">Amount (Lowest first)</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Count */}
      <div className="text-sm text-gray-600 transition-all duration-300 ease-out transform hover:scale-105">
        {filteredAndSortedTransactions.length} transaction{filteredAndSortedTransactions.length !== 1 ? 's' : ''}
      </div>

      {/* Grouped Transactions */}
      <div className="space-y-6">
        {groupedTransactions.map(([date, dayTransactions]) => (
          <div key={date}>
            <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 transition-all duration-200 ease-out hover:bg-gray-100">
              <h3 className="font-medium text-gray-900 transition-all duration-200 ease-out hover:text-blue-600">{date}</h3>
            </div>
            
            <div className="space-y-2">
              {dayTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="animate-in slide-in-from-bottom duration-300 ease-out"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TransactionCard
                    transaction={transaction}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}