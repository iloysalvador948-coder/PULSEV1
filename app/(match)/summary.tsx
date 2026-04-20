import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { useMatchHistoryStore } from '../../store/useMatchHistoryStore';
import { BentoCard } from '../../components/ui/BentoCard';
import { Typography } from '../../components/ui/Typography';
import { Tag } from '../../components/ui/Tag';
import { Divider } from '../../components/ui/Divider';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { calculateNewRating, getRankTier, getRankTierColor } from '../../utils/elo';
import { useHaptics } from '../../hooks/useHaptics';

function AnimatedNumber({ to, duration = 1000 }: { to: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);
  
  useEffect(() => {
    animatedValue.value = withTiming(to, { duration }, (finished) => {
      if (finished) {
        runOnJS(setDisplayValue)(to);
      }
    });
  }, [to, duration, animatedValue]);
  
  useAnimatedReaction(
    () => animatedValue.value,
    (value) => {
      if (value !== to) {
        runOnJS(setDisplayValue)(Math.round(value));
      }
    },
    [to]
  );
  
  return <Typography variant="display">{displayValue}</Typography>;
}

export default function SummaryScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  
  const profile = useUserStore((state) => state.profile);
  const updateElo = useUserStore((state) => state.updateElo);
  const recordMatch = useUserStore((state) => state.recordMatch);
  const addMatch = useMatchHistoryStore((state) => state.addMatch);
  
  const playerScore = useGameStore((state) => state.playerScore);
  const opponentScore = useGameStore((state) => state.opponentScore);
  const roundResults = useGameStore((state) => state.roundResults);
  const config = useGameStore((state) => state.config);
  const botElo = useGameStore((state) => state.botElo);
  
  const [calculatedElo, setCalculatedElo] = useState(profile.elo);
  const [eloChange, setEloChange] = useState(0);
  
  const isWin = playerScore > opponentScore;
  
  const oldTier = useMemo(() => getRankTier(profile.elo), [profile.elo]);
  const newTier = useMemo(() => getRankTier(calculatedElo), [calculatedElo]);
  const tierChanged = oldTier !== newTier;
  
  useEffect(() => {
    const score = isWin ? 1 : 0;
    const newElo = calculateNewRating(profile.elo, botElo, score);
    setCalculatedElo(newElo);
    setEloChange(newElo - profile.elo);
    
    updateElo(newElo);
    recordMatch(isWin, newElo - profile.elo);
    
    if (config) {
      addMatch(
        'Bot',
        playerScore,
        opponentScore,
        isWin,
        newElo - profile.elo,
        roundResults
      );
    }
  }, [botElo]);
  
  const accuracy = useMemo(() => {
    if (roundResults.length === 0) return 0;
    const correct = roundResults.filter((r) => r.isCorrect).length;
    return Math.round((correct / roundResults.length) * 100);
  }, [roundResults]);
  
  const avgTime = useMemo(() => {
    if (roundResults.length === 0) return 0;
    const total = roundResults.reduce((sum, r) => sum + r.timeUsed, 0);
    return (total / roundResults.length).toFixed(1);
  }, [roundResults]);
  
  const lifelineUsed = roundResults.some((r) => r.lifelineUsedThisRound);
  
const handlePlayAgain = useCallback(() => {
    haptics.impactMedium();
    useGameStore.getState().reset();
    router.replace('/(match)/config');
  }, [haptics, router]);

  const handleBackToHome = useCallback(() => {
    haptics.impactLight();
    useGameStore.getState().reset();
    router.replace('/(tabs)');
  }, [haptics, router]);
  
  const glowColor = isWin ? COLORS.secondary : COLORS.primary;
  
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={[styles.glowBackground, { backgroundColor: glowColor, opacity: 0.1 }]} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BentoCard style={styles.resultCard}>
          <View style={styles.resultContent}>
            <Ionicons
              name={isWin ? 'trophy' : 'close-circle'}
              size={64}
              color={isWin ? COLORS.tertiary : COLORS.primary}
            />
            <Typography 
              variant="display" 
              color={isWin ? COLORS.secondary : COLORS.primary}
              style={styles.resultTitle}
            >
              {isWin ? 'VICTORY' : 'DEFEAT'}
            </Typography>
            <Typography variant="heading" color={COLORS.textPrimary}>
              {playerScore} – {opponentScore}
            </Typography>
          </View>
        </BentoCard>
        
        <BentoCard style={styles.eloCard}>
          <View style={styles.eloContent}>
            <View style={styles.eloRow}>
              <View style={styles.eloItem}>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  OLD ELO
                </Typography>
                <Typography variant="heading" color={COLORS.textSecondary}>
                  {profile.elo}
                </Typography>
              </View>
              <Ionicons name="arrow-forward" size={24} color={COLORS.textMuted} />
              <View style={styles.eloItem}>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  NEW ELO
                </Typography>
                <Typography variant="heading" color={COLORS.textPrimary}>
                  {calculatedElo}
                </Typography>
              </View>
            </View>
            
            <View style={styles.eloChangeRow}>
              <Typography 
                variant="display" 
                color={eloChange >= 0 ? COLORS.secondary : COLORS.primary}
              >
                {eloChange >= 0 ? '+' : ''}{eloChange} ELO
              </Typography>
            </View>
            
            {tierChanged && (
              <View style={styles.tierChange}>
                <Tag 
                  label={`PROMOTED TO ${newTier}`}
                  color={getRankTierColor(newTier)}
                  textColor={newTier === 'Diamond' ? COLORS.background : COLORS.textPrimary}
                />
              </View>
            )}
          </View>
        </BentoCard>
        
        <BentoCard noPadding style={styles.breakdownCard}>
          <View style={styles.breakdownHeader}>
            <Typography variant="caption" color={COLORS.textSecondary} letterSpacing={1.2}>
              ROUND BREAKDOWN
            </Typography>
          </View>
          <View style={styles.breakdownList}>
            {roundResults.map((result, index) => (
              <View key={index}>
                <View style={styles.breakdownRow}>
                  <Typography variant="body" color={COLORS.textSecondary}>
                    Round {result.roundNumber}
                  </Typography>
                  <View style={styles.breakdownResult}>
                    <Ionicons
                      name={result.isCorrect ? 'checkmark' : 'close'}
                      size={16}
                      color={result.isCorrect ? COLORS.secondary : COLORS.primary}
                    />
                    <Typography 
                      variant="caption" 
                      color={result.isCorrect ? COLORS.secondary : COLORS.primary}
                    >
                      {result.pointsEarned} pts
                    </Typography>
                    <Typography variant="caption" color={COLORS.textMuted}>
                      {result.timeUsed.toFixed(1)}s
                    </Typography>
                  </View>
                </View>
                {index < roundResults.length - 1 && <Divider style={styles.breakdownDivider} />}
              </View>
            ))}
          </View>
        </BentoCard>
        
        <BentoCard style={styles.statsCard}>
          <Typography variant="caption" color={COLORS.textSecondary} letterSpacing={1.2}>
            PERFORMANCE STATS
          </Typography>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Typography variant="heading" color={COLORS.textPrimary}>
                {accuracy}%
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Accuracy
              </Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="heading" color={COLORS.textPrimary}>
                {avgTime}s
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Avg Time
              </Typography>
            </View>
            <View style={styles.statItem}>
              <Typography variant="heading" color={lifelineUsed ? COLORS.tertiary : COLORS.textMuted}>
                {lifelineUsed ? 'YES' : 'NO'}
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Lifeline
              </Typography>
            </View>
          </View>
        </BentoCard>
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable onPress={handlePlayAgain} style={styles.playAgainButton}>
          <Text style={{ color: '#F0F0F0', fontSize: 22, fontWeight: '600' }}>PLAY AGAIN</Text>
        </Pressable>
        <Pressable onPress={handleBackToHome} style={styles.homeButton}>
          <Text style={{ color: '#8A8A8A', fontSize: 22, fontWeight: '600' }}>BACK TO HOME</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  resultCard: {
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  resultContent: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  resultTitle: {
    marginTop: SPACING.sm,
  },
  eloCard: {
    marginBottom: SPACING.md,
  },
  eloContent: {
    gap: SPACING.md,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eloItem: {
    alignItems: 'center',
  },
  eloChangeRow: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  tierChange: {
    alignItems: 'center',
  },
  breakdownCard: {
    marginBottom: SPACING.md,
  },
  breakdownHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  breakdownList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  breakdownResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  breakdownDivider: {
    marginVertical: 0,
  },
  statsCard: {
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  playAgainButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B81908',
    borderRadius: 28,
    padding: 16,
  },
  homeButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 28,
    padding: 16,
  },
  playAgainText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  homeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 22,
    fontWeight: '600',
  },
});