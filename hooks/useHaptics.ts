import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useHaptics() {
  const impactLight = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  const impactMedium = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
  
  const impactHeavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  
  const selection = useCallback(() => {
    Haptics.selectionAsync();
  }, []);
  
  const notificationSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  const notificationWarning = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);
  
  const notificationError = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);
  
  return {
    impactLight,
    impactMedium,
    impactHeavy,
    selection,
    notificationSuccess,
    notificationWarning,
    notificationError,
  };
}