import { forwardRef, useState, useEffect } from 'react'
import { FieldError } from './ErrorDisplay'

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  errors?: string[]
  hint?: string
  validateOnChange?: boolean
  validator?: (value: string) => string[]
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(({
  label,
  errors = [],
  hint,
  validateOnChange = false,
  validator,
  leftIcon,
  rightIcon,
  className = '',
  onChange,
  onBlur,
  ...props
}, ref) => {
  const [internalErrors, setInternalErrors] = useState<string[]>([])
  const [touched, setTouched] = useState(false)
  
  const allErrors = [...errors, ...internalErrors]
  const hasErrors = allErrors.length > 0
  
  const baseInputClasses = `
    block w-full px-3 py-2 border rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    transition-colors duration-200
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
  `
  
  const errorInputClasses = hasErrors 
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 text-gray-900 placeholder-gray-400'
  
  const inputClasses = `${baseInputClasses} ${errorInputClasses} ${className}`
  
  // Add padding for icons
  const paddingClasses = {
    left: leftIcon ? 'pl-10' : '',
    right: rightIcon ? 'pr-10' : ''
  }
  
  const finalInputClasses = `${inputClasses} ${paddingClasses.left} ${paddingClasses.right}`

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (validateOnChange && validator && touched) {
      const validationErrors = validator(e.target.value)
      setInternalErrors(validationErrors)
    }
    
    onChange?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true)
    
    if (validator) {
      const validationErrors = validator(e.target.value)
      setInternalErrors(validationErrors)
    }
    
    onBlur?.(e)
  }

  // Clear internal errors when external errors change
  useEffect(() => {
    if (errors.length > 0) {
      setInternalErrors([])
    }
  }, [errors])

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{leftIcon}</div>
          </div>
        )}
        
        <input
          ref={ref}
          className={finalInputClasses}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={hasErrors}
          aria-describedby={
            hasErrors ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{rightIcon}</div>
          </div>
        )}
      </div>
      
      {hint && !hasErrors && (
        <p id={`${props.id}-hint`} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      <FieldError errors={allErrors} />
    </div>
  )
})

ValidatedInput.displayName = 'ValidatedInput'

export default ValidatedInput

// Specialized components for common use cases

interface AmountInputProps extends Omit<ValidatedInputProps, 'type' | 'validator'> {
  currency?: string
  max?: number
}

export function AmountInput({ 
  currency = '$', 
  max = 999999.99, 
  ...props 
}: AmountInputProps) {
  const validator = (value: string): string[] => {
    const errors: string[] = []
    
    if (!value.trim()) {
      errors.push('Amount is required')
      return errors
    }
    
    const num = parseFloat(value)
    
    if (isNaN(num)) {
      errors.push('Amount must be a valid number')
      return errors
    }
    
    if (num <= 0) {
      errors.push('Amount must be greater than 0')
    }
    
    if (num > max) {
      errors.push(`Amount cannot exceed ${currency}${max.toLocaleString()}`)
    }
    
    const decimalPlaces = (value.split('.')[1] || '').length
    if (decimalPlaces > 2) {
      errors.push('Amount can only have up to 2 decimal places')
    }
    
    return errors
  }

  return (
    <ValidatedInput
      type="number"
      step="0.01"
      min="0"
      max={max}
      validator={validator}
      validateOnChange={true}
      leftIcon={<span className="text-sm font-medium">{currency}</span>}
      {...props}
    />
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  errors?: string[]
  hint?: string
  maxLength?: number
}

export function ValidatedTextArea({
  label,
  errors = [],
  hint,
  maxLength = 200,
  className = '',
  ...props
}: TextAreaProps) {
  const hasErrors = errors.length > 0
  
  const baseClasses = `
    block w-full px-3 py-2 border rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    transition-colors duration-200
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    resize-none
  `
  
  const errorClasses = hasErrors 
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 text-gray-900 placeholder-gray-400'

  const currentLength = (props.value as string)?.length || 0

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        className={`${baseClasses} ${errorClasses} ${className}`}
        maxLength={maxLength}
        aria-invalid={hasErrors}
        {...props}
      />
      
      <div className="flex justify-between items-center">
        <div>
          {hint && !hasErrors && (
            <p className="text-sm text-gray-500">{hint}</p>
          )}
          <FieldError errors={errors} />
        </div>
        
        {maxLength && (
          <p className={`text-xs ${
            currentLength > maxLength * 0.9 
              ? currentLength >= maxLength 
                ? 'text-red-600' 
                : 'text-yellow-600'
              : 'text-gray-500'
          }`}>
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

// Select component with validation
interface ValidatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  errors?: string[]
  hint?: string
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
}

export function ValidatedSelect({
  label,
  errors = [],
  hint,
  options,
  placeholder,
  className = '',
  ...props
}: ValidatedSelectProps) {
  const hasErrors = errors.length > 0
  
  const baseClasses = `
    block w-full px-3 py-2 border rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    transition-colors duration-200
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    bg-white
  `
  
  const errorClasses = hasErrors 
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 text-gray-900'

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        className={`${baseClasses} ${errorClasses} ${className}`}
        aria-invalid={hasErrors}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {hint && !hasErrors && (
        <p className="text-sm text-gray-500">{hint}</p>
      )}
      
      <FieldError errors={errors} />
    </div>
  )
}