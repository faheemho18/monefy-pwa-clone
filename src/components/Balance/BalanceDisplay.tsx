import { useState, useEffect } from 'react'

interface BalanceDisplayProps {
  totalIncome?: number
  totalExpenses?: number
}

export default function BalanceDisplay({ 
  totalIncome = 0, 
  totalExpenses = 0 
}: BalanceDisplayProps) {
  const [animatedBalance, setAnimatedBalance] = useState(0)
  const balance = totalIncome - totalExpenses

  useEffect(() => {
    // Simple animation for balance changes
    const timer = setTimeout(() => {
      setAnimatedBalance(balance)
    }, 100)
    return () => clearTimeout(timer)
  }, [balance])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Current Balance */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 mb-1">Current Balance</p>
        <p className={`text-3xl font-bold ${
          animatedBalance >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          ${Math.abs(animatedBalance).toFixed(2)}
        </p>
        {animatedBalance < 0 && (
          <p className="text-sm text-red-500 mt-1">Negative Balance</p>
        )}
      </div>

      {/* Income vs Expenses */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">↑</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Income</p>
          <p className="text-lg font-semibold text-green-600">
            ${totalIncome.toFixed(2)}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">↓</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Expenses</p>
          <p className="text-lg font-semibold text-red-600">
            ${totalExpenses.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {(totalIncome > 0 || totalExpenses > 0) && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Spending</span>
            <span>
              {totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{
                width: `${totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}