import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { COLORS, BORDER_RADIUS, SPACING } from '../../utils/constants';

interface TagProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  color = COLORS.cardBorder,
  textColor = COLORS.textSecondary,
  size = 'medium',
  style,
}) => {
  const isSmall = size === 'small';
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color },
        isSmall && styles.small,
        style,
      ]}
    >
      <Typography
        variant={isSmall ? 'micro' : 'caption'}
        color={textColor}
        letterSpacing={isSmall ? 0.5 : 1.2}
      >
        {label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.tag,
  },
  small: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
  },
});