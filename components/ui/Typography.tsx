import React from 'react';
import { Text, TextStyle, StyleSheet, StyleProp } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';

type TypographyVariant = 'display' | 'heading' | 'subheading' | 'body' | 'caption' | 'micro';

interface TypographyProps {
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  numberOfLines?: number;
  uppercase?: boolean;
  letterSpacing?: number;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = COLORS.textPrimary,
  style,
  children,
  numberOfLines,
  uppercase = false,
  letterSpacing,
}) => {
  const textStyle = getVariantStyle(variant);
  
  const content = uppercase ? String(children).toUpperCase() : children;
  
  return (
    <Text
      style={[
        textStyle,
        { color },
        letterSpacing !== undefined && { letterSpacing },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {content}
    </Text>
  );
};

const getVariantStyle = (variant: TypographyVariant): TextStyle => {
  switch (variant) {
    case 'display':
      return styles.display;
    case 'heading':
      return styles.heading;
    case 'subheading':
      return styles.subheading;
    case 'body':
      return styles.body;
    case 'caption':
      return styles.caption;
    case 'micro':
      return styles.micro;
    default:
      return styles.body;
  }
};

const styles = StyleSheet.create({
  display: {
    fontSize: FONT_SIZES.display,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subheading: {
    fontSize: FONT_SIZES.subheading,
    fontWeight: '500',
  },
  body: {
    fontSize: FONT_SIZES.body,
    fontWeight: '400',
  },
  caption: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '400',
  },
  micro: {
    fontSize: FONT_SIZES.micro,
    fontWeight: '400',
  },
});