import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Typography } from './Typography';
import { COLORS, SPACING } from '../../utils/constants';
import { getRankTier, getRankTierColor, getEloProgressToNextTier } from '../../utils/elo';
import { RankTier } from '../../types';

interface EloRingBadgeProps {
  elo: number;
  size?: number;
  showProgress?: boolean;
  compact?: boolean;
}

export const EloRingBadge: React.FC<EloRingBadgeProps> = ({
  elo,
  size = 80,
  showProgress = true,
  compact = false,
}) => {
  const tier = getRankTier(elo);
  const tierColor = getRankTierColor(tier);
  const progress = getEloProgressToNextTier(elo);
  
  const ringSize = compact ? size * 0.7 : size;
  const strokeWidth = compact ? 3 : 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  const getTierLabel = (tier: RankTier): string => {
    if (compact) return tier.charAt(0);
    return tier;
  };
  
  return (
    <View style={[styles.container, { width: ringSize, height: ringSize }]}>
      <Svg width={ringSize} height={ringSize} style={styles.svg}>
        <Circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          stroke={COLORS.cardBorder}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          stroke={tierColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
        />
      </Svg>
      <View style={styles.content}>
        <Typography
          variant={compact ? 'caption' : 'subheading'}
          style={{ color: tierColor }}
        >
          {getTierLabel(tier)}
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
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});