import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS } from '../../utils/constants';

interface ProgressBarProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = COLORS.cardBorder,
  fillColor = COLORS.primary,
  style,
  animated = true,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: animated 
      ? withTiming(`${clampedProgress * 100}%`, { duration: 300 })
      : `${clampedProgress * 100}%`,
  }));
  
  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: fillColor },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});