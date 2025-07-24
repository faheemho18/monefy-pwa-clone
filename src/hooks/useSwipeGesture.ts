import React, { useEffect, useRef, useState } from 'react'

interface SwipeState {
  isSwipeDetected: boolean
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null
  swipeDistance: number
}

interface SwipeOptions {
  minSwipeDistance?: number
  maxSwipeTime?: number
  preventDefault?: boolean
  touchStartThreshold?: number
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: (direction: 'left' | 'right' | 'up' | 'down') => void
  onSwipeEnd?: () => void
}

export function useSwipeGesture(
  callbacks: SwipeCallbacks = {},
  options: SwipeOptions = {}
) {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefault = true,
    touchStartThreshold = 10
  } = options

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwipeDetected: false,
    swipeDirection: null,
    swipeDistance: 0
  })

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchCurrent = useRef<{ x: number; y: number } | null>(null)

  const handlers = {
    onTouchStart: (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
      touchCurrent.current = {
        x: touch.clientX,
        y: touch.clientY
      }

      if (preventDefault) {
        e.preventDefault()
      }
    },

    onTouchMove: (e: TouchEvent) => {
      if (!touchStart.current) return

      const touch = e.touches[0]
      touchCurrent.current = {
        x: touch.clientX,
        y: touch.clientY
      }

      const deltaX = touchCurrent.current.x - touchStart.current.x
      const deltaY = touchCurrent.current.y - touchStart.current.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Only start tracking if we've moved beyond the threshold
      if (distance > touchStartThreshold) {
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        const direction = isHorizontal
          ? deltaX > 0 ? 'right' : 'left'
          : deltaY > 0 ? 'down' : 'up'

        setSwipeState({
          isSwipeDetected: true,
          swipeDirection: direction,
          swipeDistance: distance
        })

        callbacks.onSwipeStart?.(direction)

        if (preventDefault) {
          e.preventDefault()
        }
      }
    },

    onTouchEnd: (e: TouchEvent) => {
      if (!touchStart.current || !touchCurrent.current) {
        touchStart.current = null
        touchCurrent.current = null
        return
      }

      const deltaX = touchCurrent.current.x - touchStart.current.x
      const deltaY = touchCurrent.current.y - touchStart.current.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const time = Date.now() - touchStart.current.time

      // Check if it's a valid swipe
      if (distance >= minSwipeDistance && time <= maxSwipeTime) {
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        
        if (isHorizontal) {
          if (deltaX > 0) {
            callbacks.onSwipeRight?.()
          } else {
            callbacks.onSwipeLeft?.()
          }
        } else {
          if (deltaY > 0) {
            callbacks.onSwipeDown?.()
          } else {
            callbacks.onSwipeUp?.()
          }
        }
      }

      // Reset state
      setSwipeState({
        isSwipeDetected: false,
        swipeDirection: null,
        swipeDistance: 0
      })

      callbacks.onSwipeEnd?.()

      touchStart.current = null
      touchCurrent.current = null

      if (preventDefault) {
        e.preventDefault()
      }
    },

    onTouchCancel: (e: TouchEvent) => {
      setSwipeState({
        isSwipeDetected: false,
        swipeDirection: null,
        swipeDistance: 0
      })

      callbacks.onSwipeEnd?.()

      touchStart.current = null
      touchCurrent.current = null

      if (preventDefault) {
        e.preventDefault()
      }
    }
  }

  return {
    ...swipeState,
    handlers,
    bind: {
      onTouchStart: handlers.onTouchStart,
      onTouchMove: handlers.onTouchMove,
      onTouchEnd: handlers.onTouchEnd,
      onTouchCancel: handlers.onTouchCancel
    }
  }
}

// Higher-order component for adding swipe gestures
export function withSwipeGesture<P extends object>(
  Component: React.ComponentType<P>,
  callbacks: SwipeCallbacks,
  options?: SwipeOptions
) {
  return function SwipeableComponent(props: P) {
    const { bind } = useSwipeGesture(callbacks, options)
    
    return React.createElement('div', { ...bind, style: { touchAction: 'none' } },
      React.createElement(Component, props)
    )
  }
}

// Hook for swipe navigation between pages
export function useSwipeNavigation(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const elementRef = useRef<HTMLElement>(null)

  const { bind } = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight
  }, {
    minSwipeDistance: 100,
    maxSwipeTime: 300,
    preventDefault: false
  })

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const touchStart = bind.onTouchStart
    const touchMove = bind.onTouchMove
    const touchEnd = bind.onTouchEnd
    const touchCancel = bind.onTouchCancel

    element.addEventListener('touchstart', touchStart, { passive: false })
    element.addEventListener('touchmove', touchMove, { passive: false })
    element.addEventListener('touchend', touchEnd, { passive: false })
    element.addEventListener('touchcancel', touchCancel, { passive: false })

    return () => {
      element.removeEventListener('touchstart', touchStart)
      element.removeEventListener('touchmove', touchMove)
      element.removeEventListener('touchend', touchEnd)
      element.removeEventListener('touchcancel', touchCancel)
    }
  }, [bind])

  return elementRef
}

// Component for swipeable transaction cards
// Note: This component would be implemented in a .tsx file for JSX support