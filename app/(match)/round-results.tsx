import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGameStore } from '../../store/useGameStore';
import { BentoCard } from '../../components/ui/BentoCard';
import { PressableCard } from '../../components/ui/PressableCard';
import { Typography } from '../../components/ui/Typography';
import { Tag } from '../../components/ui/Tag';
import { Divider } from '../../components/ui/Divider';
import { COLORS, SPACING } from '../../utils/constants';
import { useHaptics } from '../../hooks/useHaptics';

export default function RoundResultsScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  
  const config = useGameStore((state) => state.config);
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const roundResults = useGameStore((state) => state.roundResults);
  const playerScore = useGameStore((state) => state.playerScore);
  const opponentScore = useGameStore((state) => state.opponentScore);
  
  const transition = useGameStore((state) => state.transition);
  
  const latestResult = roundResults[roundResults.length - 1];
  
  const isCorrect = latestResult?.isCorrect;
  const pointsEarned = latestResult?.pointsEarned || 0;
  const timeUsed = latestResult?.timeUsed?.toFixed(1) || '0.0';
  const lifelineUsed = latestResult?.lifelineUsedThisRound || false;
  
  const handleNextRound = useCallback(() => {
    haptics.impactMedium();
    transition('nextRound');
  }, [haptics, transition]);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleNextRound();
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [handleNextRound]);
  
  if (!config || !currentQuestion || !latestResult) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Typography variant="body" color={COLORS.textSecondary}>
          Loading results...
        </Typography>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BentoCard style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={64}
              color={isCorrect ? COLORS.secondary : COLORS.primary}
            />
            <Typography 
              variant="heading" 
              color={isCorrect ? COLORS.secondary : COLORS.primary}
              style={styles.resultTitle}
            >
              {isCorrect ? 'CORRECT' : 'INCORRECT'}
            </Typography>
            <Typography variant="display" style={styles.pointsEarned}>
              {isCorrect ? `+${pointsEarned}` : '+0'} pts
            </Typography>
            {lifelineUsed && (
              <Tag 
                label="LIFELINE USED"
                color={COLORS.tertiary}
                textColor={COLORS.background}
                size="small"
              />
            )}
          </View>
        </BentoCard>
        
        <BentoCard style={styles.breakdownCard}>
          <Typography 
            variant="caption" 
            color={COLORS.textSecondary} 
            letterSpacing={1.2}
            style={styles.sectionLabel}
          >
            ANSWER BREAKDOWN
          </Typography>
          
          <View style={styles.answerRow}>
            <Typography variant="body" color={COLORS.textSecondary}>
              Your answer:
            </Typography>
            <View style={styles.answerValue}>
              <Typography 
                variant="subheading"
                color={isCorrect ? COLORS.secondary : COLORS.primary}
              >
                {latestResult.playerAnswer || 'TIMEOUT'}
              </Typography>
            </View>
          </View>
          
          <View style={styles.answerRow}>
            <Typography variant="body" color={COLORS.textSecondary}>
              Correct answer:
            </Typography>
            <View style={styles.answerValue}>
              <Typography variant="subheading" color={COLORS.secondary}>
                {latestResult.correctAnswer}
              </Typography>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.timeRow}>
            <Typography variant="body" color={COLORS.textSecondary}>
              Time taken:
            </Typography>
            <Typography variant="subheading" color={COLORS.textPrimary}>
              {timeUsed}s
            </Typography>
          </View>
        </BentoCard>
        
        <BentoCard style={styles.explanationCard}>
          <Typography 
            variant="caption" 
            color={COLORS.textSecondary} 
            letterSpacing={1.2}
            style={styles.sectionLabel}
          >
            EXPLANATION
          </Typography>
          <Typography variant="body" color={COLORS.textPrimary}>
            {currentQuestion.explanation}
          </Typography>
        </BentoCard>
        
        <BentoCard style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                YOUR SCORE
              </Typography>
              <Typography variant="display" color={COLORS.textPrimary}>
                {playerScore}
              </Typography>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                BOT SCORE
              </Typography>
              <Typography variant="display" color={COLORS.textPrimary}>
                {opponentScore}
              </Typography>
            </View>
          </View>
        </BentoCard>
      </ScrollView>
      
      <View style={styles.footer}>
        <PressableCard onPress={handleNextRound} style={styles.nextButton}>
          <Typography variant="heading" color={COLORS.textPrimary}>
            NEXT ROUND
          </Typography>
        </PressableCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  resultCard: {
    marginBottom: SPACING.md,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  resultTitle: {
    marginTop: SPACING.sm,
  },
  pointsEarned: {
    color: COLORS.textPrimary,
  },
  breakdownCard: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    marginBottom: SPACING.md,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  answerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  divider: {
    marginVertical: SPACING.md,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  explanationCard: {
    marginBottom: SPACING.md,
  },
  scoreCard: {
    marginBottom: SPACING.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.divider,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  nextButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});