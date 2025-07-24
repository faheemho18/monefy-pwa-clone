interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'neutral'
  changePercent: number
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

export default function TrendIndicator({
  direction,
  changePercent,
  size = 'md',
  showPercentage = true,
  className = '',
}: TrendIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const arrowSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  }

  const getColorClasses = () => {
    switch (direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
      default:
        return 'text-gray-500'
    }
  }

  const getArrow = () => {
    switch (direction) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      case 'neutral':
      default:
        return '→'
    }
  }

  const getBackgroundClasses = () => {
    switch (direction) {
      case 'up':
        return 'bg-green-50'
      case 'down':
        return 'bg-red-50'
      case 'neutral':
      default:
        return 'bg-gray-50'
    }
  }

  if (direction === 'neutral' && changePercent === 0) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full ${getBackgroundClasses()} ${className}`}>
        <span className={`${sizeClasses[size]} ${getColorClasses()} font-medium`}>
          No change
        </span>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${getBackgroundClasses()} ${className}`}>
      <span className={`${arrowSizeClasses[size]} ${getColorClasses()} font-bold`}>
        {getArrow()}
      </span>
      {showPercentage && (
        <span className={`${sizeClasses[size]} ${getColorClasses()} font-medium`}>
          {Math.abs(changePercent)}%
        </span>
      )}
    </div>
  )
}