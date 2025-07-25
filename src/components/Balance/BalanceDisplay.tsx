import { useState, useEffect } from 'react'
import { Transaction } from '@/types'
import { calculateBalanceTrend, getPeriodDisplayName, TimePeriod } from '@/utils/balanceCalculations'
import TrendIndicator from './TrendIndicator'
import { formatCurrency } from '@/utils/formatters'

interface BalanceDisplayProps {
  transactions?: Transaction[]
  totalIncome?: number
  totalExpenses?: number
}

export default function BalanceDisplay({ 
  transactions = [],
  totalIncome = 0, 
  totalExpenses = 0 
}: BalanceDisplayProps) {
  const [animatedBalance, setAnimatedBalance] = useState(0)
  const [animatedIncome, setAnimatedIncome] = useState(0)
  const [animatedExpenses, setAnimatedExpenses] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month')
  
  // Calculate balance (use transactions if available, fallback to props)
  const balance = transactions.length > 0 
    ? transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
      transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    : totalIncome - totalExpenses

  // Calculate period-based data and trends
  const trendData = transactions.length > 0 
    ? calculateBalanceTrend(transactions, selectedPeriod)
    : null

  useEffect(() => {
    // Enhanced animation for balance changes with easing
    const animateValue = (
      start: number,
      end: number,
      setter: (value: number) => void,
      duration: number = 800
    ) => {
      const startTime = Date.now()
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        const current = start + (end - start) * easeOutCubic
        
        setter(Math.round(current * 100) / 100)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }

    animateValue(animatedBalance, balance, setAnimatedBalance)
    animateValue(animatedIncome, displayIncome, setAnimatedIncome)
    animateValue(animatedExpenses, displayExpenses, setAnimatedExpenses)
  }, [balance, displayIncome, displayExpenses])

  // Get the appropriate income/expense values based on period or fallback
  const displayIncome = trendData ? trendData.current.income : totalIncome
  const displayExpenses = trendData ? trendData.current.expenses : totalExpenses

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm transition-all duration-300 ease-out hover:shadow-lg transform hover:scale-[1.02]">
      {/* Period Selector */}
      {transactions.length > 0 && (
        <div className="flex justify-center mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['today', 'week', 'month', 'year'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-300 ease-out transform hover:scale-105 focus:scale-105 ${
                  selectedPeriod === period
                    ? 'bg-white text-gray-900 shadow-md scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:bg-opacity-50'
                }`}
              >
                {getPeriodDisplayName(period)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Balance */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <p className="text-sm text-gray-500">
            {transactions.length > 0 ? `Balance - ${getPeriodDisplayName(selectedPeriod)}` : 'Current Balance'}
          </p>
          {trendData && (
            <TrendIndicator
              direction={trendData.trends.balance.direction as 'up' | 'down' | 'neutral'}
              changePercent={Math.abs(trendData.trends.balance.changePercent)}
              size="sm"
            />
          )}
        </div>
        <p className={`text-3xl font-bold transition-all duration-500 ease-out transform hover:scale-110 ${
          animatedBalance >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(Math.abs(animatedBalance))}
        </p>
        {animatedBalance < 0 && (
          <p className="text-sm text-red-500 mt-1">Negative Balance</p>
        )}
      </div>

      {/* Income vs Expenses */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2 transition-all duration-300 ease-out transform hover:scale-110 hover:bg-green-200 cursor-pointer">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center transition-all duration-300 ease-out transform hover:rotate-12">
              <span className="text-white text-xs font-bold animate-pulse">↑</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-1">
            <p className="text-sm text-gray-500">Income</p>
            {trendData && (
              <TrendIndicator
                direction={trendData.trends.income.direction as 'up' | 'down' | 'neutral'}
                changePercent={Math.abs(trendData.trends.income.changePercent)}
                size="sm"
              />
            )}
          </div>
          <p className="text-lg font-semibold text-green-600 transition-all duration-300 ease-out transform hover:scale-110">
            {formatCurrency(animatedIncome)}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2 transition-all duration-300 ease-out transform hover:scale-110 hover:bg-red-200 cursor-pointer">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center transition-all duration-300 ease-out transform hover:rotate-12">
              <span className="text-white text-xs font-bold animate-pulse">↓</span>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-1">
            <p className="text-sm text-gray-500">Expenses</p>
            {trendData && (
              <TrendIndicator
                direction={trendData.trends.expenses.direction as 'up' | 'down' | 'neutral'}
                changePercent={Math.abs(trendData.trends.expenses.changePercent)}
                size="sm"
              />
            )}
          </div>
          <p className="text-lg font-semibold text-red-600 transition-all duration-300 ease-out transform hover:scale-110">
            {formatCurrency(animatedExpenses)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {(displayIncome > 0 || displayExpenses > 0) && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Spending Ratio</span>
            <span>
              {displayIncome > 0 ? Math.round((displayExpenses / displayIncome) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden transition-all duration-300 ease-out hover:h-3">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out transform hover:scale-105 ${
                (animatedExpenses / animatedIncome) * 100 > 80 ? 'bg-red-500 animate-pulse' :
                (animatedExpenses / animatedIncome) * 100 > 60 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{
                width: `${animatedIncome > 0 ? Math.min((animatedExpenses / animatedIncome) * 100, 100) : 0}%`
              }}
            />
          </div>
          
          {/* Progress bar status indicator */}
          {animatedIncome > 0 && (
            <div className="mt-2 text-center">
              <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 ease-out ${
                (animatedExpenses / animatedIncome) * 100 > 80 ? 'bg-red-100 text-red-800' :
                (animatedExpenses / animatedIncome) * 100 > 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {(animatedExpenses / animatedIncome) * 100 > 80 ? 'High Spending' :
                 (animatedExpenses / animatedIncome) * 100 > 60 ? 'Moderate Spending' :
                 'Good Spending'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}