import { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';
import { ANIMATION } from '../utils/constants';

interface UseAnimatedEntryOptions {
  delay?: number;
  enabled?: boolean;
}

export function useAnimatedEntry(options: UseAnimatedEntryOptions = {}) {
  const { delay = 0, enabled = true } = options;
  
  const opacity = useSharedValue(enabled ? 0 : 1);
  const translateY = useSharedValue(enabled ? 20 : 0);
  
  useEffect(() => {
    if (enabled) {
      const timeout = setTimeout(() => {
        opacity.value = withTiming(1, {
          duration: ANIMATION.cardMount,
          easing: Easing.out(Easing.cubic),
        });
        translateY.value = withTiming(0, {
          duration: ANIMATION.cardMount,
          easing: Easing.out(Easing.cubic),
        });
      }, delay);
      
      return () => clearTimeout(timeout);
    }
  }, [enabled, delay, opacity, translateY]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return animatedStyle;
}