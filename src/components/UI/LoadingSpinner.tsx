import SpinnerSvg from '@/assets/loading/spinner.svg?react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <SpinnerSvg 
        className={`${sizeClasses[size]} animate-spin`}
        aria-label="Loading..."
      />
    </div>
  )
}