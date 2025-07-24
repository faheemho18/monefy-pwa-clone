// Haptic feedback utilities using the Web Vibration API

interface HapticPattern {
  duration: number | number[]
  description: string
}

// Predefined haptic patterns
export const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
  // Basic feedback
  tap: { duration: 10, description: 'Light tap feedback' },
  click: { duration: 20, description: 'Button click feedback' },
  success: { duration: [50, 50, 50], description: 'Success confirmation' },
  error: { duration: [100, 50, 100], description: 'Error notification' },
  warning: { duration: [50, 100, 50], description: 'Warning alert' },
  
  // Selection feedback
  select: { duration: 15, description: 'Item selection' },
  toggle: { duration: 25, description: 'Toggle switch' },
  swipe: { duration: 30, description: 'Swipe gesture' },
  
  // Navigation feedback
  navigate: { duration: 40, description: 'Page navigation' },
  back: { duration: 35, description: 'Back navigation' },
  
  // Input feedback
  keypress: { duration: 12, description: 'Key press' },
  delete: { duration: 18, description: 'Delete action' },
  clear: { duration: 25, description: 'Clear input' },
  
  // Transaction specific
  addTransaction: { duration: [30, 20, 30], description: 'Transaction added' },
  deleteTransaction: { duration: [50, 30, 50, 30, 50], description: 'Transaction deleted' },
  editTransaction: { duration: 20, description: 'Transaction edited' }
}

class HapticFeedback {
  private isSupported: boolean
  private isEnabled: boolean
  private permissions: PermissionState | null = null

  constructor() {
    this.isSupported = 'vibrate' in navigator
    this.isEnabled = this.isSupported && this.getStoredPreference()
    this.checkPermissions()
  }

  /**
   * Check if haptic feedback is supported by the device
   */
  isHapticSupported(): boolean {
    return this.isSupported
  }

  /**
   * Check if haptic feedback is currently enabled
   */
  isHapticEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Enable or disable haptic feedback
   */
  setHapticEnabled(enabled: boolean): void {
    this.isEnabled = enabled && this.isSupported
    this.storePreference(enabled)
  }

  /**
   * Check vibration permissions (if supported)
   */
  private async checkPermissions(): Promise<void> {
    try {
      // Note: Most browsers don't require permission for vibration
      // but we check for future compatibility
      if ('permissions' in navigator && 'query' in navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'vibration' as any })
        this.permissions = permission.state
      }
    } catch (error) {
      // Permission API not supported or vibration permission not supported
      this.permissions = 'granted'
    }
  }

  /**
   * Get stored user preference for haptic feedback
   */
  private getStoredPreference(): boolean {
    try {
      const stored = localStorage.getItem('haptic-feedback-enabled')
      return stored !== null ? JSON.parse(stored) : true // Default to enabled
    } catch {
      return true
    }
  }

  /**
   * Store user preference for haptic feedback
   */
  private storePreference(enabled: boolean): void {
    try {
      localStorage.setItem('haptic-feedback-enabled', JSON.stringify(enabled))
    } catch {
      // LocalStorage not available
    }
  }

  /**
   * Trigger haptic feedback with a predefined pattern
   */
  trigger(pattern: keyof typeof HAPTIC_PATTERNS): void {
    if (!this.isEnabled || !this.isSupported) return

    const hapticPattern = HAPTIC_PATTERNS[pattern]
    if (!hapticPattern) {
      console.warn(`Unknown haptic pattern: ${pattern}`)
      return
    }

    try {
      navigator.vibrate(hapticPattern.duration)
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * Trigger haptic feedback with a custom pattern
   */
  triggerCustom(duration: number | number[]): void {
    if (!this.isEnabled || !this.isSupported) return

    try {
      navigator.vibrate(duration)
    } catch (error) {
      console.warn('Custom haptic feedback failed:', error)
    }
  }

  /**
   * Stop all haptic feedback
   */
  stop(): void {
    if (!this.isSupported) return

    try {
      navigator.vibrate(0)
    } catch (error) {
      console.warn('Failed to stop haptic feedback:', error)
    }
  }

  /**
   * Get device haptic capabilities info
   */
  getCapabilities(): {
    isSupported: boolean
    isEnabled: boolean
    permissions: PermissionState | null
    patterns: string[]
  } {
    return {
      isSupported: this.isSupported,
      isEnabled: this.isEnabled,
      permissions: this.permissions,
      patterns: Object.keys(HAPTIC_PATTERNS)
    }
  }
}

// Create singleton instance
export const haptics = new HapticFeedback()

// Convenience functions for common patterns
export const hapticFeedback = {
  tap: () => haptics.trigger('tap'),
  click: () => haptics.trigger('click'),
  success: () => haptics.trigger('success'),
  error: () => haptics.trigger('error'),
  warning: () => haptics.trigger('warning'),
  select: () => haptics.trigger('select'),
  toggle: () => haptics.trigger('toggle'),
  swipe: () => haptics.trigger('swipe'),
  navigate: () => haptics.trigger('navigate'),
  back: () => haptics.trigger('back'),
  keypress: () => haptics.trigger('keypress'),
  delete: () => haptics.trigger('delete'),
  clear: () => haptics.trigger('clear'),
  addTransaction: () => haptics.trigger('addTransaction'),
  deleteTransaction: () => haptics.trigger('deleteTransaction'),
  editTransaction: () => haptics.trigger('editTransaction')
}

// React hook for haptic feedback
export function useHapticFeedback() {
  return {
    trigger: haptics.trigger.bind(haptics),
    triggerCustom: haptics.triggerCustom.bind(haptics),
    stop: haptics.stop.bind(haptics),
    isSupported: haptics.isHapticSupported(),
    isEnabled: haptics.isHapticEnabled(),
    setEnabled: haptics.setHapticEnabled.bind(haptics),
    capabilities: haptics.getCapabilities(),
    patterns: hapticFeedback
  }
}

// HOC for adding haptic feedback to components
// Note: HOC and JSX components would be implemented in .tsx files for JSX support