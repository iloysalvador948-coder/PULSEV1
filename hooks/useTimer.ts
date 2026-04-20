import { useCallback, useEffect, useRef } from 'react';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { TIMER_DURATION_SECONDS } from '../utils/constants';

interface UseTimerOptions {
  onTimeUp?: () => void;
  autoStart?: boolean;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { onTimeUp, autoStart = false } = options;
  
  const timeRemaining = useSharedValue(TIMER_DURATION_SECONDS);
  const isRunning = useSharedValue(autoStart ? 1 : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);
  
  const tick = useCallback(() => {
    const newValue = timeRemaining.value - 1;
    if (newValue <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isRunning.value = 0;
      onTimeUpRef.current?.();
      timeRemaining.value = 0;
    } else {
      timeRemaining.value = newValue;
    }
  }, [timeRemaining, isRunning]);
  
  const start = useCallback(() => {
    isRunning.value = 1;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      runOnJS(tick)();
    }, 1000);
  }, [isRunning, tick]);
  
  const pause = useCallback(() => {
    isRunning.value = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning]);
  
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timeRemaining.value = TIMER_DURATION_SECONDS;
    isRunning.value = 0;
  }, [timeRemaining, isRunning]);
  
  const setTime = useCallback((time: number) => {
    timeRemaining.value = Math.max(0, Math.min(time, TIMER_DURATION_SECONDS));
  }, [timeRemaining]);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);
  
  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset,
    setTime,
  };
}