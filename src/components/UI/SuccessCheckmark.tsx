import CheckmarkSvg from '@/assets/animations/checkmark.svg?react'

interface SuccessCheckmarkProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onAnimationComplete?: () => void
}

export default function SuccessCheckmark({ 
  size = 'md', 
  className = '',
  onAnimationComplete 
}: SuccessCheckmarkProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      onAnimationEnd={onAnimationComplete}
    >
      <CheckmarkSvg 
        className={`${sizeClasses[size]} animate-in zoom-in duration-500 ease-out`}
        aria-label="Success"
      />
    </div>
  )
}