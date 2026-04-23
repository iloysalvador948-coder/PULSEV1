import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGameStore } from '../../store/useGameStore';
import { BentoCard } from '../../components/ui/BentoCard';
import { Typography } from '../../components/ui/Typography';
import { darkColors, SPACING, ROUND_COUNTS, FONT_SIZES } from '../../utils/constants';
import { RoundCount, MatchMode } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';

const COLORS = darkColors;

const MATCH_MODES: { mode: MatchMode; label: string; icon: string; description: string }[] = [
  { mode: 'bot', label: 'Bot', icon: 'hardware-chip', description: 'Practice vs AI' },
  { mode: 'pvp', label: 'PvP', icon: 'people', description: 'Real opponent' },
];

export default function ConfigScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [selectedRounds, setSelectedRounds] = useState<RoundCount>(5);
  const [selectedMode, setSelectedMode] = useState<MatchMode>('bot');
  
  const transition = useGameStore((state) => state.transition);
  const setConfig = useGameStore((state) => state.setConfig);
  
  const handleSelectRound = useCallback((rounds: RoundCount) => {
    haptics.selection();
    setSelectedRounds(rounds);
  }, [haptics]);
  
  const handleSelectMode = useCallback((mode: MatchMode) => {
    haptics.selection();
    setSelectedMode(mode);
  }, [haptics]);
  
  const gameState = useGameStore((state) => state.state);
  
  const handleConfirm = useCallback(() => {
    haptics.impactMedium();
    const store = useGameStore.getState();
    if (store.state !== 'IDLE' && store.state !== 'PRE_MATCH_CONFIG') {
      store.reset();
    }
    setConfig(selectedRounds, selectedMode);
    transition('confirmConfig');
    router.push('/(match)/matchmaking');
  }, [haptics, selectedRounds, selectedMode, setConfig, transition, router]);
  
  const handleCancel = useCallback(() => {
    haptics.impactLight();
    useGameStore.getState().reset();
    router.back();
  }, [haptics, router]);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Typography variant="heading">CONFIGURE BATTLE</Typography>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BentoCard style={styles.roundCard}>
          <Typography 
            variant="caption" 
            color={COLORS.textSecondary} 
            letterSpacing={1.2}
            style={styles.sectionLabel}
          >
            SELECT ROUNDS
          </Typography>
          <View style={styles.roundOptions}>
            {ROUND_COUNTS.map((rounds) => (
              <Pressable
                key={rounds}
                onPress={() => handleSelectRound(rounds)}
                style={[
                  styles.roundOption,
                  selectedRounds === rounds && styles.roundOptionSelected,
                ]}
              >
                <Typography 
                  variant="display" 
                  color={
                    selectedRounds === rounds 
                      ? COLORS.primary 
                      : COLORS.textSecondary
                  }
                >
                  {rounds}
                </Typography>
              </Pressable>
            ))}
          </View>
        </BentoCard>
        
        <BentoCard style={styles.roundCard}>
          <Typography 
            variant="caption" 
            color={COLORS.textSecondary} 
            letterSpacing={1.2}
            style={styles.sectionLabel}
          >
            SELECT MODE
          </Typography>
          <View style={styles.modeOptions}>
            {MATCH_MODES.map((item) => (
              <Pressable
                key={item.mode}
                onPress={() => handleSelectMode(item.mode)}
                style={[
                  styles.modeOption,
                  selectedMode === item.mode && styles.modeOptionSelected,
                ]}
              >
                <Ionicons 
                  name={item.icon as any}
                  size={28}
                  color={selectedMode === item.mode ? COLORS.primary : COLORS.textSecondary}
                />
                <Typography 
                  variant="subheading" 
                  color={
                    selectedMode === item.mode 
                      ? COLORS.primary 
                      : COLORS.textSecondary
                  }
                  style={styles.modeLabel}
                >
                  {item.label}
                </Typography>
                <Typography 
                  variant="caption" 
                  color={COLORS.textMuted}
                >
                  {item.description}
                </Typography>
              </Pressable>
            ))}
          </View>
        </BentoCard>
        
        <BentoCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="timer-outline" size={20} color={COLORS.textSecondary} />
            <Typography variant="body" color={COLORS.textPrimary}>
              15 seconds per question
            </Typography>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-outline" size={20} color={COLORS.textSecondary} />
            <Typography variant="body" color={COLORS.textPrimary}>
              1× System Bypass lifeline
            </Typography>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="trending-up-outline" size={20} color={COLORS.textSecondary} />
            <Typography variant="body" color={COLORS.textPrimary}>
              ELO ranking updated after match
            </Typography>
          </View>
        </BentoCard>
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable onPress={handleConfirm} style={({ pressed }) => [
          styles.confirmButton,
          pressed && styles.confirmButtonPressed
        ]}>
          <View style={styles.confirmContent}>
            <Text style={styles.confirmButtonText}>FIND OPPONENT</Text>
            <Ionicons name="search" size={24} color={COLORS.textPrimary} />
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sectionLabel: {
    marginBottom: SPACING.md,
  },
  roundCard: {
    marginBottom: SPACING.md,
  },
  roundOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roundOption: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.cardSurface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(184, 25, 8, 0.15)',
  },
  modeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modeOption: {
    width: '45%',
    height: 100,
    borderRadius: 20,
    backgroundColor: COLORS.cardSurface,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(184, 25, 8, 0.15)',
  },
  modeLabel: {
    marginTop: SPACING.xs,
  },
  infoCard: {
    gap: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  confirmButton: {
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  confirmButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});