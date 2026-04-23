import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { GameState, RoundResult } from '../../types';
import { BentoCard } from '../../components/ui/BentoCard';
import { Typography } from '../../components/ui/Typography';
import { CircularTimer } from '../../components/ui/CircularTimer';
import { Tag } from '../../components/ui/Tag';
import { COLORS, SPACING, TIMER_DURATION_SECONDS, BORDER_RADIUS } from '../../utils/constants';
import { useHaptics } from '../../hooks/useHaptics';
import { getRandomQuestions } from '../../utils/questions';
import { simulateOpponentAnswer, getBotElo } from '../../utils/matchSimulator';
import { usePvPGame } from '../../hooks/useMatchmaking';

type AnswerState = 'default' | 'selected' | 'correct' | 'incorrect' | 'hidden';

interface AnswerOptionProps {
  label: string;
  text: string;
  state: AnswerState;
  onPress: () => void;
}

function AnswerOption({ label, text, state, onPress }: AnswerOptionProps) {
  const getBackgroundColor = () => {
    switch (state) {
      case 'selected':
        return 'rgba(184, 25, 8, 0.12)';
      case 'correct':
        return 'rgba(116, 162, 102, 0.15)';
      case 'incorrect':
        return 'rgba(184, 25, 8, 0.15)';
      case 'hidden':
        return 'rgba(26, 26, 26, 0.3)';
      default:
        return COLORS.cardSurface;
    }
  };

  const getBorderColor = () => {
    switch (state) {
      case 'selected':
        return COLORS.primary;
      case 'correct':
        return COLORS.secondary;
      case 'incorrect':
        return COLORS.primary;
      case 'hidden':
        return COLORS.cardBorder;
      default:
        return COLORS.cardBorder;
    }
  };

  const getIcon = () => {
    if (state === 'correct') return 'checkmark-circle';
    if (state === 'incorrect') return 'close-circle';
    return null;
  };

  return (
    <Pressable
      onPress={state === 'default' ? onPress : undefined}
      disabled={state !== 'default'}
      style={[
        styles.answerOption,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          opacity: state === 'hidden' ? 0.2 : 1,
        },
      ]}
    >
      <View style={styles.answerLabel}>
        <View style={[styles.answerLabelCircle, state !== 'default' && state !== 'selected' && {
          backgroundColor: state === 'correct' ? COLORS.secondary : COLORS.primary,
        }]}>
          <Typography variant="subheading" color={COLORS.textPrimary}>
            {label}
          </Typography>
        </View>
      </View>
      <View style={styles.answerText}>
        <Typography variant="body" numberOfLines={2}>
          {text}
        </Typography>
      </View>
      {getIcon() && (
        <View style={styles.answerIcon}>
          <Ionicons
            name={getIcon() as any}
            size={24}
            color={state === 'correct' ? COLORS.secondary : COLORS.primary}
          />
        </View>
      )}
    </Pressable>
  );
}

export default function BattleScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const profile = useUserStore((state) => state.profile);

  // ALWAYS call all selectors first (Rules of Hooks)
  const currentQuestion = useGameStore((state) => state.currentQuestion);
  const activeConfig = useGameStore((state) => state.config);
  const gameState = useGameStore((state) => state.state);
  const roundResults = useGameStore((state) => state.roundResults);
  const selectedAnswer = useGameStore((state) => state.selectedAnswer);
  const playerScore = useGameStore((state) => state.playerScore);
  const opponentScore = useGameStore((state) => state.opponentScore);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const isTimerRunning = useGameStore((state) => state.isTimerRunning);
  const answerSubmitted = useGameStore((state) => state.answerSubmitted);
  const opponentProfile = useGameStore((state) => state.opponentProfile);

  const transition = useGameStore((state) => state.transition);
  const setTimeRemaining = useGameStore((state) => state.setTimeRemaining);
  const useLifeline = useGameStore((state) => state.useLifeline);

  const isPvP = activeConfig?.matchMode === 'pvp';
  const opponentName = opponentProfile?.username || 'BOT';
  
  const pvpGame = usePvPGame();
  
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{isCorrect: boolean, points: number} | null>(null);
  
  // Listen for PvP round results
  useEffect(() => {
    if (pvpGame.roundResult && !showResult) {
      const { playerResult, opponentResult } = pvpGame.roundResult;
      
      useGameStore.setState((state) => ({
        roundResults: [...state.roundResults, playerResult],
        opponentResults: [...state.opponentResults, opponentResult],
        playerScore: playerResult.pointsEarned,
        opponentScore: opponentResult.pointsEarned,
        state: GameState.ROUND_RESULTS,
        isTimerRunning: false,
        answerSubmitted: true,
      }));
      
      setLastResult({ isCorrect: playerResult.isCorrect, points: playerResult.pointsEarned });
      setShowResult(true);
      pvpGame.clearRoundResult();
      
      setTimeout(() => goToNextRound(), 2000);
    }
  }, [pvpGame.roundResult, showResult, pvpGame]);

  const isReady = activeConfig && currentQuestion;

  const handleTimeUp = () => {
    const currentQuestion = useGameStore.getState().currentQuestion;
    if (currentQuestion) {
      const store = useGameStore.getState();
      const isCorrect = false;
      const roundResult = {
        roundNumber: store.config!.currentRound,
        questionId: currentQuestion.id,
        playerAnswer: null,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
        pointsEarned: 0,
        timeUsed: TIMER_DURATION_SECONDS,
        lifelineUsedThisRound: store.config!.lifelineUsed,
      };
      
      const opponentResult = simulateOpponentAnswer(currentQuestion, store.botElo, store.config!.currentRound);
      
      useGameStore.setState((state) => ({
        roundResults: [...state.roundResults, roundResult],
        opponentResults: [...state.opponentResults, opponentResult],
        playerScore: state.playerScore + roundResult.pointsEarned,
        opponentScore: state.opponentScore + opponentResult.pointsEarned,
        state: GameState.ROUND_RESULTS,
        isTimerRunning: false,
        answerSubmitted: true,
      }));
      
      setLastResult({ isCorrect, points: roundResult.pointsEarned });
      setShowResult(true);
      
      setTimeout(() => goToNextRound(), 2000);
    }
  };

  const goToNextRound = () => {
    const state = useGameStore.getState();
    const nextRound = state.config!.currentRound + 1;
    
    if (nextRound <= state.config!.totalRounds) {
      const nextQuestion = state.questions[nextRound - 1];
      
      useGameStore.setState({
        state: GameState.ROUND_ACTIVE,
        config: { ...state.config!, currentRound: nextRound },
        currentQuestion: nextQuestion,
        selectedAnswer: null,
        answerSubmitted: false,
        timeRemaining: TIMER_DURATION_SECONDS,
        isTimerRunning: true,
      });
    } else {
      // Game over - go to summary
      useGameStore.setState({
        state: GameState.GAME_SUMMARY,
        isTimerRunning: false,
      });
      router.push('/(match)/summary');
      return;
    }
    
    setShowResult(false);
    setLastResult(null);
    setLifelineUsed(false);
    setHiddenOptions([]);
  };

  const handleSelectAnswer = useCallback((answer: string) => {
    const store = useGameStore.getState();
    if (showResult || !store.currentQuestion) return;
    
    haptics.impactLight();
    
    const timeUsed = TIMER_DURATION_SECONDS - store.timeRemaining;
    
    if (isPvP) {
      // For PvP, send answer to server
      pvpGame.submitAnswer(answer, timeUsed);
      
      const isCorrect = answer === store.currentQuestion.correctAnswer;
      useGameStore.setState({
        selectedAnswer: answer,
        answerSubmitted: true,
        isTimerRunning: false,
      });
    } else {
      // For bot matches, simulate locally
      const isCorrect = answer === store.currentQuestion.correctAnswer;
      const basePoints = 100;
      const timeBonus = Math.max(0, Math.round((store.timeRemaining / TIMER_DURATION_SECONDS) * 20));
      const isLifelineUsed = store.config?.lifelineUsed || false;
      const pointsEarned = isCorrect ? (isLifelineUsed ? Math.floor((basePoints + timeBonus) / 2) : basePoints + timeBonus) : 0;
      
      const roundResult: RoundResult = {
        roundNumber: store.config!.currentRound,
        questionId: store.currentQuestion.id,
        playerAnswer: answer,
        correctAnswer: store.currentQuestion.correctAnswer,
        isCorrect,
        pointsEarned,
        timeUsed,
        lifelineUsedThisRound: isLifelineUsed && isCorrect,
      };
      
      const opponentResult = simulateOpponentAnswer(store.currentQuestion, store.botElo, store.config!.currentRound);
      
      useGameStore.setState((state) => ({
        selectedAnswer: answer,
        roundResults: [...state.roundResults, roundResult],
        opponentResults: [...state.opponentResults, opponentResult],
        playerScore: state.playerScore + pointsEarned,
        opponentScore: state.opponentScore + opponentResult.pointsEarned,
        state: GameState.ROUND_RESULTS,
        isTimerRunning: false,
        answerSubmitted: true,
      }));
      
      setLastResult({ isCorrect, points: pointsEarned });
      setShowResult(true);
      
      setTimeout(() => goToNextRound(), 2000);
    }
  }, [haptics, showResult, isPvP, pvpGame]);

  const handleUseLifeline = useCallback(() => {
    const store = useGameStore.getState();
    if (lifelineUsed || !store.currentQuestion) return;

    haptics.notificationSuccess();
    useLifeline();
    setLifelineUsed(true);

    const wrongOptions = ['A', 'B', 'C', 'D']
      .filter(opt => opt !== store.currentQuestion!.correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    setHiddenOptions(wrongOptions);
  }, [lifelineUsed, haptics, useLifeline]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const tick = () => {
      const store = useGameStore.getState();
      if (store.isTimerRunning && store.timeRemaining > 0 && !store.answerSubmitted) {
        const newTime = store.timeRemaining - 1;
        store.setTimeRemaining(newTime);

        if (newTime <= 0) {
          haptics.notificationError();
          handleTimeUp();
        }
      } else {
        clearInterval(interval);
      }
    };

    interval = setInterval(tick, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [haptics]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Typography variant="body" color={COLORS.textSecondary}>
          Loading...
        </Typography>
      </View>
    );
  }

  const getDifficultyDots = () => {
    const q = useGameStore.getState().currentQuestion;
    if (!q) return [];
    const count = q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 2 : 3;
    return Array(count).fill(null);
  };

  const getAnswerState = (label: string): AnswerState => {
    const selected = useGameStore.getState().selectedAnswer;
    if (hiddenOptions.includes(label)) return 'hidden';
    if (selected === label) return 'selected';
    return 'default';
  };

  // Show result overlay when answer is submitted
  if (showResult && lastResult && currentQuestion) {
    const correctOptionText = currentQuestion.options[currentQuestion.correctAnswer];
    const selectedOptionText = selectedAnswer ? currentQuestion.options[selectedAnswer as keyof typeof currentQuestion.options] : 'No answer';
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Ionicons
              name={lastResult.isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={80}
              color={lastResult.isCorrect ? COLORS.secondary : COLORS.primary}
            />
            <Typography variant="display" style={styles.resultTitle}>
              {lastResult.isCorrect ? 'CORRECT!' : 'WRONG!'}
            </Typography>
            {lastResult.isCorrect && (
              <Typography variant="heading" color={COLORS.secondary}>
                +{lastResult.points} points
              </Typography>
            )}
          </View>
          
          <View style={styles.answerFeedbackCard}>
            <View style={styles.answerFeedbackRow}>
              <View style={styles.answerFeedbackItem}>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  YOUR ANSWER
                </Typography>
                <Typography 
                  variant="subheading" 
                  color={lastResult.isCorrect ? COLORS.secondary : COLORS.primary}
                >
                  {selectedAnswer}: {selectedOptionText}
                </Typography>
              </View>
            </View>
            <View style={styles.answerFeedbackDivider} />
            <View style={styles.answerFeedbackRow}>
              <View style={styles.answerFeedbackItem}>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  CORRECT ANSWER
                </Typography>
                <Typography variant="subheading" color={COLORS.secondary}>
                  {currentQuestion.correctAnswer}: {correctOptionText}
                </Typography>
              </View>
            </View>
          </View>
          
          <View style={styles.scoreUpdateCard}>
            <View style={styles.scoreUpdateRow}>
              <View style={styles.scoreUpdateItem}>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  YOUR SCORE
                </Typography>
                <Typography variant="display" color={COLORS.textPrimary}>
                  {playerScore}
                </Typography>
              </View>
              <View style={styles.scoreUpdateDivider} />
              <View style={styles.scoreUpdateItem}>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  {opponentName.toUpperCase()} SCORE
                </Typography>
                <Typography variant="display" color={COLORS.textPrimary}>
                  {opponentScore}
                </Typography>
              </View>
            </View>
          </View>
          <Typography variant="caption" color={COLORS.textMuted}>
            Next round coming...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.playerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={COLORS.textSecondary} />
          </View>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {profile.username.slice(0, 8)}
          </Typography>
        </View>

        <View style={styles.roundIndicator}>
          <Typography variant="caption" letterSpacing={1.2} color={COLORS.textSecondary}>
            ROUND {activeConfig.currentRound} / {activeConfig.totalRounds}
          </Typography>
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.avatar}>
            <Typography variant="caption" color={COLORS.textSecondary}>
              {opponentName.slice(0, 6).toUpperCase()}
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.timerSection}>
        <BentoCard style={styles.timerCard}>
          <View style={styles.timerContent}>
            <View style={styles.scoreSection}>
              <Typography variant="subheading" color={COLORS.textSecondary}>
                YOU
              </Typography>
              <Typography variant="display" color={COLORS.textPrimary}>
                {playerScore}
              </Typography>
            </View>

            <CircularTimer
              timeRemaining={timeRemaining}
              isRunning={isTimerRunning}
              size={120}
            />

            <View style={styles.scoreSection}>
              <Typography variant="subheading" color={COLORS.textSecondary}>
                {opponentName.toUpperCase()}
              </Typography>
              <Typography variant="display" color={COLORS.textPrimary}>
                {opponentScore}
              </Typography>
            </View>
          </View>
        </BentoCard>
      </View>

      <View style={styles.questionSection}>
        <BentoCard style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Tag
              label={currentQuestion.category}
              color={COLORS.cardBorder}
              size="small"
            />
            <View style={styles.difficultyDots}>
              {getDifficultyDots().map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
          </View>
          <ScrollView style={styles.questionText} showsVerticalScrollIndicator={false}>
            <Typography variant="body" style={styles.scenario}>
              {currentQuestion.scenario}
            </Typography>
          </ScrollView>
        </BentoCard>
      </View>

      <View style={styles.answersSection}>
        <View style={styles.answersGrid}>
          {(['A', 'B', 'C', 'D'] as const).map((label) => (
            <AnswerOption
              key={label}
              label={label}
              text={currentQuestion.options[label]}
              state={getAnswerState(label)}
              onPress={() => handleSelectAnswer(label)}
            />
          ))}
        </View>
      </View>

      <View style={styles.lifelineSection}>
        <Pressable
          onPress={handleUseLifeline}
          disabled={lifelineUsed}
          style={[
            styles.lifelineButton,
            lifelineUsed && styles.lifelineButtonDisabled,
          ]}
        >
          <Ionicons
            name="shield-outline"
            size={18}
            color={lifelineUsed ? COLORS.textMuted : COLORS.tertiary}
          />
          <Typography
            variant="caption"
            color={lifelineUsed ? COLORS.textMuted : COLORS.tertiary}
            letterSpacing={1.2}
          >
            {lifelineUsed ? 'USED' : 'SYSTEM BYPASS'}
          </Typography>
        </Pressable>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  playerInfo: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundIndicator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.cardSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  timerSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  timerCard: {
    height: 140,
    justifyContent: 'center',
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreSection: {
    alignItems: 'center',
    width: 60,
  },
  questionSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  questionCard: {
    flex: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  difficultyDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.tertiary,
  },
  questionText: {
    flex: 1,
  },
  scenario: {
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  answersSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  answerOption: {
    width: '48%',
    height: 70,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  answerLabel: {
    marginRight: SPACING.sm,
  },
  answerLabelCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerText: {
    flex: 1,
  },
  answerIcon: {
    marginLeft: SPACING.xs,
  },
  lifelineSection: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  lifelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
  },
  lifelineButtonDisabled: {
    borderColor: COLORS.textMuted,
    opacity: 0.3,
  },
  resultOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  resultCard: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  resultTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  scoreUpdateCard: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  scoreUpdateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreUpdateItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreUpdateDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.divider,
  },
  answerFeedbackCard: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  answerFeedbackRow: {
    paddingVertical: SPACING.sm,
  },
  answerFeedbackItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  answerFeedbackDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
});