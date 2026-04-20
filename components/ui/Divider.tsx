import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../utils/constants';

interface DividerProps {
  style?: ViewStyle;
  color?: string;
}

export const Divider: React.FC<DividerProps> = ({
  style,
  color = COLORS.divider,
}) => {
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: color },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
    marginVertical: SPACING.md,
  },
});