'use client';

import { useState, useEffect, useRef } from 'react';

interface SwipeGestureConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  preventDefaultTouchmove?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
}

export function useSwipeGesture(config: SwipeGestureConfig = {}) {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 500,
    preventDefaultTouchmove = true,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown
  } = config;

  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false
  });

  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setTouchState({
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isSwiping: true
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmove && touchState.isSwiping) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchState.isSwiping) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - touchState.startX;
      const deltaY = endY - touchState.startY;
      const deltaTime = endTime - touchState.startTime;

      setTouchState(prev => ({ ...prev, isSwiping: false }));

      // Check if swipe is within time limit
      if (deltaTime > maxSwipeTime) return;

      // Determine swipe direction based on larger delta
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else if (absDeltaY > minSwipeDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    };

    const handleTouchCancel = () => {
      setTouchState(prev => ({ ...prev, isSwiping: false }));
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [touchState.isSwiping, minSwipeDistance, maxSwipeTime, preventDefaultTouchmove, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    ref: elementRef,
    isSwiping: touchState.isSwiping
  };
}