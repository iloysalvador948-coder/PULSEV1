import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useGameStore } from '../../store/useGameStore';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { Typography } from '../../components/ui/Typography';
import { darkColors, SPACING } from '../../utils/constants';
import { GameState, MatchRoom } from '../../types';
import { getRandomQuestions } from '../../utils/questions';
import { getBotElo } from '../../utils/matchSimulator';

const COLORS = darkColors;

export default function MatchmakingScreen() {
  const router = useRouter();
  const transition = useGameStore((state) => state.transition);
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const navigateToBattle = useCallback(() => {
    router.replace('/(match)/battle');
  }, [router]);
  
  const { findMatch, cancelSearch, isSearching } = useMatchmaking({
    onMatchFound: (room: MatchRoom) => {
      console.log('Match found!', room);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      
      const store = useGameStore.getState();
      const questions = room.questions || getRandomQuestions(store.config!.totalRounds);
      
      // Update store with match data
      useGameStore.setState({
        state: GameState.ROUND_ACTIVE,
        questions: questions,
        currentQuestion: questions[0],
        opponentResults: [],
        botElo: room.players[1].elo,
        opponentProfile: room.players[1],
        roundResults: [],
        playerScore: 0,
        opponentScore: 0,
        selectedAnswer: null,
        answerSubmitted: false,
        timeRemaining: 15,
        isTimerRunning: true,
      });
      
      router.replace('/(match)/battle');
    },
  });
  
  useEffect(() => {
    const store = useGameStore.getState();
    
    if (!store.config) {
      router.replace('/(match)/config');
      return;
    }
    
    // Start animations
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1500, easing: (t) => Math.pow(t, 3) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: (t) => Math.pow(t, 3) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    
    // Start matchmaking
    const { matchMode } = store.config;
    console.log('Starting matchmaking, mode:', matchMode);
    findMatch(matchMode, store.playerElo, store.config.totalRounds);
    
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelSearch();
    };
  }, [scale, opacity, findMatch, cancelSearch, router]);
  
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
        {useGameStore.getState().config?.matchMode === 'pvp' 
          ? 'Finding opponent...' 
          : 'Finding bot...'}
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