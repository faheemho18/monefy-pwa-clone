import { nanoid } from 'nanoid'
import { User, Household, Category, Transaction } from '../types'
import { FirestoreService } from '../services/firestoreService'

// Default categories for new households
const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'householdId'>[] = [
  { name: 'Food & Dining', icon: 'food', color: '#FF6B6B', type: 'expense', isDefault: true, order: 1 },
  { name: 'Transportation', icon: 'transport', color: '#4ECDC4', type: 'expense', isDefault: true, order: 2 },
  { name: 'Shopping', icon: 'shopping', color: '#45B7D1', type: 'expense', isDefault: true, order: 3 },
  { name: 'Entertainment', icon: 'entertainment', color: '#96CEB4', type: 'expense', isDefault: true, order: 4 },
  { name: 'Bills & Utilities', icon: 'bills', color: '#FFEAA7', type: 'expense', isDefault: true, order: 5 },
  { name: 'Healthcare', icon: 'healthcare', color: '#DDA0DD', type: 'expense', isDefault: true, order: 6 },
  { name: 'Education', icon: 'education', color: '#98D8C8', type: 'expense', isDefault: true, order: 7 },
  { name: 'Other', icon: 'other', color: '#F7DC6F', type: 'expense', isDefault: true, order: 8 },
  { name: 'Salary', icon: 'salary', color: '#58D68D', type: 'income', isDefault: true, order: 9 },
  { name: 'Business', icon: 'business', color: '#5DADE2', type: 'income', isDefault: true, order: 10 },
  { name: 'Investments', icon: 'investments', color: '#AF7AC5', type: 'income', isDefault: true, order: 11 },
  { name: 'Other Income', icon: 'other-income', color: '#F8C471', type: 'income', isDefault: true, order: 12 },
]

export class FirebaseSetupService {
  /**
   * Create a new user profile in Firestore
   */
  static async createUserProfile(firebaseUser: any): Promise<User> {
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await FirestoreService.createUser(user)
    return user
  }

  /**
   * Create a new household with default categories
   */
  static async createHousehold(userId: string, householdName: string): Promise<{ household: Household; categories: Category[] }> {
    const householdId = nanoid()
    
    const household: Household = {
      id: householdId,
      name: householdName,
      members: [userId],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Create household
    await FirestoreService.createHousehold(household)

    // Create default categories
    const categories: Category[] = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      id: nanoid(),
      householdId,
    }))

    // Create all categories
    for (const category of categories) {
      await FirestoreService.createCategory(category)
    }

    // Update user with household ID
    await FirestoreService.updateUser(userId, { 
      householdId,
      updatedAt: new Date()
    })

    return { household, categories }
  }

  /**
   * Join an existing household
   */
  static async joinHousehold(_userId: string, _inviteCode: string): Promise<Household> {
    // In a real app, you would look up the household by invite code
    // For now, this is a placeholder implementation
    throw new Error('Household invitation system not yet implemented')
  }

  /**
   * Initialize app data for a user
   */
  static async initializeUserData(userId: string): Promise<{
    user: User
    household: Household | null
    categories: Category[]
    transactions: Transaction[]
  }> {
    const user = await FirestoreService.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    let household: Household | null = null
    let categories: Category[] = []
    let transactions: Transaction[] = []

    if (user.householdId) {
      household = await FirestoreService.getHousehold(user.householdId)
      if (household) {
        categories = await FirestoreService.getHouseholdCategories(household.id)
        transactions = await FirestoreService.getHouseholdTransactions(household.id)
      }
    }

    return {
      user,
      household,
      categories,
      transactions,
    }
  }

  /**
   * Generate a unique invite code for household
   */
  static generateInviteCode(): string {
    return nanoid(8).toUpperCase()
  }

  /**
   * Check if Firebase is properly configured
   */
  static isFirebaseConfigured(): boolean {
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
    ]

    return requiredVars.every(varName => 
      import.meta.env[varName] && import.meta.env[varName] !== 'your_value_here'
    )
  }
}