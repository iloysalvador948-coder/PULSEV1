import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useGameStore } from '../../store/useGameStore';
import { Typography } from '../../components/ui/Typography';
import { COLORS, SPACING, MATCHMAKING_DELAY } from '../../utils/constants';
import { GameState } from '../../types';
import { getRandomQuestions } from '../../utils/questions';
import { getBotElo } from '../../utils/matchSimulator';

export default function MatchmakingScreen() {
  const router = useRouter();
  const transition = useGameStore((state) => state.transition);
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  useEffect(() => {
    const store = useGameStore.getState();
    
    // Guard: if no config, redirect to config
    if (!store.config) {
      router.replace('/(match)/config');
      return;
    }
    
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1500, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    
    const delay = 2000;
    
    const timeout = setTimeout(() => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      
      // Directly set up game state and navigate
      const store = useGameStore.getState();
      
      // Get questions and bot
      const questions = getRandomQuestions(store.config!.totalRounds);
      const botElo = getBotElo(store.playerElo);
      
      // Directly update store state (bypassing FSM transition)
      useGameStore.setState({
        state: GameState.ROUND_ACTIVE,
        questions: questions,
        currentQuestion: questions[0],
        opponentResults: [],
        botElo: botElo,
        roundResults: [],
        playerScore: 0,
        opponentScore: 0,
        selectedAnswer: null,
        answerSubmitted: false,
        timeRemaining: 15,
        isTimerRunning: true,
      });
      
      router.replace('/(match)/battle');
    }, delay);
    
    return () => {
      clearTimeout(timeout);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [scale, opacity, transition, router]);
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.pulseRing, animatedStyle]} />
        <View style={styles.innerRing}>
          <View style={styles.searchIcon}>
            <Typography variant="display" color={COLORS.primary}>
              ?
            </Typography>
          </View>
        </View>
      </View>
      
      <Typography variant="heading" style={styles.searchingText}>
        SEARCHING...
      </Typography>
      <Typography variant="caption" color={COLORS.textSecondary}>
        Matching by ELO rank
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  innerRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardSurface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    marginBottom: SPACING.sm,
  },
});