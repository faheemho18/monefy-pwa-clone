import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User,
  UserCredential,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export interface AuthError {
  code: string
  message: string
}

export class AuthService {
  /**
   * Register a new user with email and password
   */
  static async register(email: string, password: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  /**
   * Sign in user with email and password
   */
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw this.handleAuthError(error)
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthError(error: any): AuthError {
    const errorMap: Record<string, string> = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    }

    return {
      code: error.code,
      message: errorMap[error.code] || error.message || 'An unexpected error occurred.',
    }
  }
}