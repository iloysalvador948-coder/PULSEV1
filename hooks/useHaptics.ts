import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';

export function useHaptics() {
  const impactLight = useCallback(() => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  const impactMedium = useCallback(() => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
  
  const impactHeavy = useCallback(() => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  
  const selection = useCallback(() => {
    if (!isWeb) Haptics.selectionAsync();
  }, []);
  
  const notificationSuccess = useCallback(() => {
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  const notificationWarning = useCallback(() => {
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);
  
  const notificationError = useCallback(() => {
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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