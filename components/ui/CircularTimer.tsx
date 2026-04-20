import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Typography } from './Typography';
import { COLORS } from '../../utils/constants';
import { TIMER_DURATION_SECONDS } from '../../utils/constants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularTimerProps {
  timeRemaining: number;
  isRunning: boolean;
  onTimeUp?: () => void;
  size?: number;
  strokeWidth?: number;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  timeRemaining,
  isRunning,
  onTimeUp,
  size = 120,
  strokeWidth = 6,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const progress = useSharedValue(timeRemaining / TIMER_DURATION_SECONDS);
  
  useEffect(() => {
    progress.value = withTiming(timeRemaining / TIMER_DURATION_SECONDS, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [timeRemaining, progress]);
  
  useEffect(() => {
    if (timeRemaining <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);
  
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));
  
  const getTimerColor = (): string => {
    if (timeRemaining <= 3) {
      return COLORS.primary;
    }
    if (timeRemaining <= 7) {
      return COLORS.tertiary;
    }
    return COLORS.primary;
  };
  
  const timerColor = getTimerColor();
  
  const isFlashing = timeRemaining <= 3 && isRunning;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.cardBorder}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={timerColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.timeContainer}>
        <Typography
          variant="display"
          style={[
            styles.timeText,
            ...(isFlashing ? [styles.flashing] : []),
          ]}
        >
          {timeRemaining}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  timeContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: COLORS.textPrimary,
  },
  flashing: {
    opacity: 0.7,
  },
});