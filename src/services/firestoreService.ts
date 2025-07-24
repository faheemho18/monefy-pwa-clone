import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  enableNetwork,
  disableNetwork,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { User, Household, Category, Transaction } from '../types'

export class FirestoreService {
  // Collections
  static readonly USERS = 'users'
  static readonly HOUSEHOLDS = 'households'
  static readonly CATEGORIES = 'categories'
  static readonly TRANSACTIONS = 'transactions'

  /**
   * User Operations
   */
  static async createUser(user: User): Promise<void> {
    const userRef = doc(db, this.USERS, user.id)
    await setDoc(userRef, {
      ...user,
      createdAt: Timestamp.fromDate(user.createdAt),
      updatedAt: Timestamp.fromDate(user.updatedAt),
    })
  }

  static async getUser(userId: string): Promise<User | null> {
    const userRef = doc(db, this.USERS, userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) return null
    
    const data = userSnap.data()
    return {
      ...data,
      id: userSnap.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as User
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, this.USERS, userId)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  }

  /**
   * Household Operations
   */
  static async createHousehold(household: Household): Promise<void> {
    const householdRef = doc(db, this.HOUSEHOLDS, household.id)
    await setDoc(householdRef, {
      ...household,
      createdAt: Timestamp.fromDate(household.createdAt),
      updatedAt: Timestamp.fromDate(household.updatedAt),
    })
  }

  static async getHousehold(householdId: string): Promise<Household | null> {
    const householdRef = doc(db, this.HOUSEHOLDS, householdId)
    const householdSnap = await getDoc(householdRef)
    
    if (!householdSnap.exists()) return null
    
    const data = householdSnap.data()
    return {
      ...data,
      id: householdSnap.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Household
  }

  static async addMemberToHousehold(householdId: string, userId: string): Promise<void> {
    const householdRef = doc(db, this.HOUSEHOLDS, householdId)
    const household = await this.getHousehold(householdId)
    
    if (!household) throw new Error('Household not found')
    
    const updatedMembers = [...household.members, userId]
    await updateDoc(householdRef, {
      members: updatedMembers,
      updatedAt: Timestamp.now(),
    })
  }

  /**
   * Category Operations
   */
  static async createCategory(category: Category): Promise<void> {
    const categoryRef = doc(db, this.CATEGORIES, category.id)
    await setDoc(categoryRef, category)
  }

  static async getHouseholdCategories(householdId: string): Promise<Category[]> {
    const categoriesRef = collection(db, this.CATEGORIES)
    const q = query(
      categoriesRef,
      where('householdId', '==', householdId),
      orderBy('order', 'asc')
    )
    
    const querySnap = await getDocs(q)
    return querySnap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Category[]
  }

  /**
   * Transaction Operations
   */
  static async createTransaction(transaction: Transaction): Promise<void> {
    const transactionRef = doc(db, this.TRANSACTIONS, transaction.id)
    await setDoc(transactionRef, {
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
      createdAt: Timestamp.fromDate(transaction.createdAt),
      lastModified: Timestamp.fromDate(transaction.lastModified),
    })
  }

  static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    const transactionRef = doc(db, this.TRANSACTIONS, transactionId)
    const updateData: any = { ...updates }
    
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date)
    }
    if (updates.lastModified) {
      updateData.lastModified = Timestamp.fromDate(updates.lastModified)
    }
    
    await updateDoc(transactionRef, updateData)
  }

  static async deleteTransaction(transactionId: string): Promise<void> {
    const transactionRef = doc(db, this.TRANSACTIONS, transactionId)
    await deleteDoc(transactionRef)
  }

  static async getHouseholdTransactions(householdId: string): Promise<Transaction[]> {
    const transactionsRef = collection(db, this.TRANSACTIONS)
    const q = query(
      transactionsRef,
      where('householdId', '==', householdId),
      orderBy('date', 'desc')
    )
    
    const querySnap = await getDocs(q)
    return querySnap.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        lastModified: data.lastModified.toDate(),
      }
    }) as Transaction[]
  }

  /**
   * Real-time listeners
   */
  static subscribeToHouseholdTransactions(
    householdId: string,
    callback: (transactions: Transaction[]) => void
  ): () => void {
    const transactionsRef = collection(db, this.TRANSACTIONS)
    const q = query(
      transactionsRef,
      where('householdId', '==', householdId),
      orderBy('date', 'desc')
    )
    
    return onSnapshot(q, (querySnap) => {
      const transactions = querySnap.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          lastModified: data.lastModified.toDate(),
        }
      }) as Transaction[]
      
      callback(transactions)
    })
  }

  /**
   * Offline support
   */
  static async enableOfflineSupport(): Promise<void> {
    await enableNetwork(db)
  }

  static async disableOfflineSupport(): Promise<void> {
    await disableNetwork(db)
  }

  /**
   * Batch operations for better performance
   */
  static async batchCreateTransactions(transactions: Transaction[]): Promise<void> {
    const batch = writeBatch(db)
    
    transactions.forEach(transaction => {
      const transactionRef = doc(db, this.TRANSACTIONS, transaction.id)
      batch.set(transactionRef, {
        ...transaction,
        date: Timestamp.fromDate(transaction.date),
        createdAt: Timestamp.fromDate(transaction.createdAt),
        lastModified: Timestamp.fromDate(transaction.lastModified),
      })
    })
    
    await batch.commit()
  }
}