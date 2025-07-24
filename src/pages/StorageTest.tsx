import { useLocalStorage } from '@/hooks/useLocalStorage'
import { TransactionFormData } from '@/types'

export default function StorageTest() {
  const { 
    transactions, 
    categories, 
    isLoading, 
    error, 
    addTransaction,
    deleteTransaction,
    clearAllData,
    exportData,
    importData,
    storageUsage 
  } = useLocalStorage()

  const handleAddTestTransaction = () => {
    const testTransaction: TransactionFormData = {
      amount: Math.round(Math.random() * 100 * 100) / 100,
      type: Math.random() > 0.5 ? 'expense' : 'income',
      categoryId: categories[Math.floor(Math.random() * categories.length)]?.id || categories[0]?.id,
      description: `Test transaction ${Date.now()}`,
      date: new Date(),
    }
    addTransaction(testTransaction)
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monefy-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        importData(data)
        alert('Data imported successfully!')
      } catch (error) {
        alert('Failed to import data: ' + error)
      }
    }
    reader.readAsText(file)
  }

  if (isLoading) {
    return <div className="p-4">Loading storage test...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">LocalStorage Test Page</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Storage Usage */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Storage Usage</h2>
        <div className="text-sm space-y-1">
          <p>Available: {storageUsage.isAvailable ? 'Yes' : 'No'}</p>
          <p>Used: {Math.round(storageUsage.used / 1024)} KB</p>
          <p>Available: {Math.round(storageUsage.available / 1024)} KB</p>
          <p>Usage: {storageUsage.usedPercentage.toFixed(1)}%</p>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${Math.min(storageUsage.usedPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold mb-2">Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAddTestTransaction}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Add Random Transaction
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Reload Page (Test Persistence)
            </button>
            <button
              onClick={clearAllData}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Clear All Data
            </button>
            <button
              onClick={handleExport}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
            >
              Export Data
            </button>
          </div>
          <div className="mt-2">
            <label className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded cursor-pointer">
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Transactions ({transactions.length})</h2>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {transactions.slice(0, 10).map((transaction) => {
              const category = categories.find(c => c.id === transaction.categoryId)
              return (
                <div key={transaction.id} className="text-sm flex justify-between items-center">
                  <span className={transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                    {transaction.type === 'expense' ? '-' : '+'}${transaction.amount}
                  </span>
                  <span>{category?.name || 'Unknown'}</span>
                  <button
                    onClick={() => deleteTransaction(transaction.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Delete
                  </button>
                </div>
              )
            })}
            {transactions.length > 10 && (
              <div className="text-xs text-gray-500">
                ...and {transactions.length - 10} more
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Categories ({categories.length})</h2>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {categories.map((category) => (
              <div key={category.id} className="text-sm flex justify-between">
                <span>{category.name}</span>
                <span className="text-xs text-gray-500">{category.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Test Instructions</h2>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Add some test transactions using the button above</li>
          <li>Click "Reload Page" to test persistence - data should remain after reload</li>
          <li>Try exporting your data to download a backup file</li>
          <li>Clear all data, then import the backup file to restore</li>
          <li>Monitor storage usage as you add more transactions</li>
        </ol>
      </div>
    </div>
  )
}