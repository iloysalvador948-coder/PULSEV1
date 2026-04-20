import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS, BORDER_RADIUS, SPACING } from '../../utils/constants';

interface BentoCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  entering?: boolean;
  exiting?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  style,
  noPadding = false,
  entering = true,
  exiting = false,
}) => {
  return (
    <Animated.View
      entering={entering ? FadeIn.duration(400).delay(60) : undefined}
      exiting={exiting ? FadeOut.duration(300) : undefined}
      style={[
        styles.card,
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  noPadding: {
    padding: 0,
  },
});