import { XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface ErrorDisplayProps {
  message: string | string[]
  type?: 'error' | 'warning' | 'info'
  className?: string
  showIcon?: boolean
  onDismiss?: () => void
}

export default function ErrorDisplay({ 
  message, 
  type = 'error', 
  className = '', 
  showIcon = true,
  onDismiss 
}: ErrorDisplayProps) {
  const messages = Array.isArray(message) ? message : [message]
  
  const baseClasses = 'rounded-lg p-3 text-sm border'
  
  const typeClasses = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  }
  
  const iconClasses = {
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  }
  
  const IconComponent = {
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  }[type]

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <IconComponent className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${iconClasses[type]}`} />
        )}
        <div className="flex-1">
          {messages.length === 1 ? (
            <p>{messages[0]}</p>
          ) : (
            <ul className="space-y-1">
              {messages.map((msg, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-xs">•</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 flex-shrink-0 text-current hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Field-specific error display for form inputs
interface FieldErrorProps {
  errors?: string[]
  className?: string
}

export function FieldError({ errors, className = '' }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null

  return (
    <div className={`mt-1 ${className}`}>
      {errors.map((error, index) => (
        <p key={index} className="text-sm text-red-600 flex items-center">
          <XCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      ))}
    </div>
  )
}

// Toast-style error notification
interface ErrorToastProps {
  message: string
  type?: 'error' | 'warning' | 'success' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function ErrorToast({ 
  message, 
  type = 'error', 
  isVisible, 
  onClose,
  duration = 5000 
}: ErrorToastProps) {
  const toastClasses = {
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    success: 'bg-green-500 text-white',
    info: 'bg-blue-500 text-white'
  }

  // Auto-close after duration
  if (isVisible && duration > 0) {
    setTimeout(() => {
      onClose()
    }, duration)
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={`
        ${toastClasses[type]} 
        px-4 py-3 rounded-lg shadow-lg max-w-sm
        flex items-center justify-between
      `}>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-3 text-white hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          <XCircleIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// Error summary component for forms
interface ErrorSummaryProps {
  errors: Record<string, string[]>
  title?: string
  className?: string
}

export function ErrorSummary({ 
  errors, 
  title = 'Please fix the following errors:', 
  className = '' 
}: ErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([_, errs]) => errs.length > 0)
  
  if (errorEntries.length === 0) return null

  const allErrors = errorEntries.flatMap(([_, errs]) => errs)

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <XCircleIcon className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-red-800 mb-2">{title}</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {allErrors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 text-xs">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}