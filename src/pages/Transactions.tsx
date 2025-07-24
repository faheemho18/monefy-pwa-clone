export default function Transactions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
      </div>
      
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-gray-500 text-center py-8">
          No transactions found. Start by adding your first transaction!
        </div>
      </div>
    </div>
  )
}