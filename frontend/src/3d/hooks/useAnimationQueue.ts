// Animation Queue Hook for managing 3D animations

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Animation } from '../types';

export interface UseAnimationQueueReturn {
  currentAnimation: Animation | null;
  queue: Animation[];
  addAnimation: (animation: Omit<Animation, 'startTime'>) => void;
  skipCurrent: () => void;
  pause: () => void;
  resume: () => void;
  setSpeed: (speed: number) => void;
  clear: () => void;
  isPaused: boolean;
  speed: number;
}

export function useAnimationQueue(): UseAnimationQueueReturn {
  const [queue, setQueue] = useState<Animation[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<Animation | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processNext = useCallback(() => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) {
        setCurrentAnimation(null);
        return prevQueue;
      }

      const sortedQueue = [...prevQueue].sort((a, b) => b.priority - a.priority);
      const next = sortedQueue[0];
      const remaining = sortedQueue.slice(1);

      setCurrentAnimation({
        ...next,
        startTime: Date.now(),
      });

      return remaining;
    });
  }, []);

  useEffect(() => {
    if (currentAnimation && !isPaused) {
      const adjustedDuration = currentAnimation.duration / speed;
      
      timeoutRef.current = setTimeout(() => {
        processNext();
      }, adjustedDuration);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [currentAnimation, isPaused, speed, processNext]);

  useEffect(() => {
    if (!currentAnimation && queue.length > 0 && !isPaused) {
      processNext();
    }
  }, [queue, currentAnimation, isPaused, processNext]);

  const addAnimation = useCallback((animation: Omit<Animation, 'startTime'>) => {
    setQueue((prev) => [...prev, animation as Animation]);
  }, []);

  const skipCurrent = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    processNext();
  }, [processNext]);

  const pause = useCallback(() => {
    setIsPaused(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(Math.max(0.1, Math.min(10, newSpeed)));
  }, []);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setQueue([]);
    setCurrentAnimation(null);
  }, []);

  return {
    currentAnimation,
    queue,
    addAnimation,
    skipCurrent,
    pause,
    resume,
    setSpeed,
    clear,
    isPaused,
    speed,
  };
}

export default useAnimationQueue;
