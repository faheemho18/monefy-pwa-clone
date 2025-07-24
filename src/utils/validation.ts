import { z } from 'zod'

// Transaction validation schema
export const transactionSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(999999.99, 'Amount cannot exceed $999,999.99')
    .refine((val) => Number(val.toFixed(2)) === val, {
      message: 'Amount can only have up to 2 decimal places'
    }),
  
  type: z.enum(['expense', 'income'], {
    message: 'Type must be either expense or income'
  }),
  
  categoryId: z
    .string()
    .min(1, 'Please select a category'),
  
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  
  date: z
    .date()
    .max(new Date(), 'Date cannot be in the future')
    .min(new Date('1900-01-01'), 'Date cannot be before 1900')
})

// Amount input validation (for string inputs from forms)
export const amountInputSchema = z
  .string()
  .min(1, 'Amount is required')
  .refine((val) => !isNaN(parseFloat(val)), {
    message: 'Amount must be a valid number'
  })
  .refine((val) => parseFloat(val) > 0, {
    message: 'Amount must be greater than 0'
  })
  .refine((val) => parseFloat(val) <= 999999.99, {
    message: 'Amount cannot exceed $999,999.99'
  })
  .refine((val) => {
    const decimalPlaces = (val.split('.')[1] || '').length
    return decimalPlaces <= 2
  }, {
    message: 'Amount can only have up to 2 decimal places'
  })

// Category validation schema
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name cannot exceed 50 characters')
    .refine((val) => val.trim().length > 0, {
      message: 'Category name cannot be only whitespace'
    }),
    
  icon: z
    .string()
    .min(1, 'Please select an icon'),
    
  color: z
    .string()
    .min(1, 'Please select a color'),
    
  type: z.enum(['expense', 'income'], {
    message: 'Type must be either expense or income'
  })
})

// User profile validation schema
export const userProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name cannot exceed 100 characters')
    .refine((val) => val.trim().length > 0, {
      message: 'Display name cannot be only whitespace'
    }),
    
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters')
})

// Household validation schema
export const householdSchema = z.object({
  name: z
    .string()
    .min(1, 'Household name is required')
    .max(100, 'Household name cannot exceed 100 characters')
    .refine((val) => val.trim().length > 0, {
      message: 'Household name cannot be only whitespace'
    })
})

// Search and filter validation
export const searchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional(),
    
  categoryIds: z
    .array(z.string())
    .optional(),
    
  type: z
    .enum(['expense', 'income', 'all'])
    .optional(),
    
  dateFrom: z
    .date()
    .optional(),
    
  dateTo: z
    .date()
    .optional(),
    
  amountMin: z
    .number()
    .min(0, 'Minimum amount cannot be negative')
    .optional(),
    
  amountMax: z
    .number()
    .min(0, 'Maximum amount cannot be negative')
    .optional()
}).refine((data) => {
  if (data.dateFrom && data.dateTo) {
    return data.dateFrom <= data.dateTo
  }
  return true
}, {
  message: 'Start date must be before or equal to end date',
  path: ['dateTo']
}).refine((data) => {
  if (data.amountMin !== undefined && data.amountMax !== undefined) {
    return data.amountMin <= data.amountMax
  }
  return true
}, {
  message: 'Minimum amount must be less than or equal to maximum amount',
  path: ['amountMax']
})

// Export types inferred from schemas
export type TransactionInput = z.infer<typeof transactionSchema>
export type AmountInput = z.infer<typeof amountInputSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type HouseholdInput = z.infer<typeof householdSchema>
export type SearchInput = z.infer<typeof searchSchema>

// Validation result type
export type ValidationResult<T> = {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
  message?: string
}

// Helper function to format Zod errors
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {}
  
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    if (!formattedErrors[path]) {
      formattedErrors[path] = []
    }
    formattedErrors[path].push(err.message)
  })
  
  return formattedErrors
}

// Helper function to validate data and return formatted result
export function validateData<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    return {
      success: true,
      data: result
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: formatZodErrors(error),
        message: 'Validation failed'
      }
    }
    
    return {
      success: false,
      message: 'Unknown validation error'
    }
  }
}

// Specific validation functions for common use cases
export const validateTransaction = (data: unknown) => 
  validateData(transactionSchema, data)

export const validateAmountInput = (amount: string) => 
  validateData(amountInputSchema, amount)

export const validateCategory = (data: unknown) => 
  validateData(categorySchema, data)

export const validateUserProfile = (data: unknown) => 
  validateData(userProfileSchema, data)

export const validateHousehold = (data: unknown) => 
  validateData(householdSchema, data)

export const validateSearch = (data: unknown) => 
  validateData(searchSchema, data)