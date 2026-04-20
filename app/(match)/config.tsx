import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGameStore } from '../../store/useGameStore';
import { BentoCard } from '../../components/ui/BentoCard';
import { PressableCard } from '../../components/ui/PressableCard';
import { Typography } from '../../components/ui/Typography';
import { COLORS, SPACING, ROUND_COUNTS, FONT_SIZES } from '../../utils/constants';
import { RoundCount } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';

export default function ConfigScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [selectedRounds, setSelectedRounds] = useState<RoundCount>(5);
  
  const transition = useGameStore((state) => state.transition);
  const setConfig = useGameStore((state) => state.setConfig);
  
  const handleSelectRound = useCallback((rounds: RoundCount) => {
    haptics.selection();
    setSelectedRounds(rounds);
  }, [haptics]);
  
  const gameState = useGameStore((state) => state.state);
  
  const handleConfirm = useCallback(() => {
    haptics.impactMedium();
    const store = useGameStore.getState();
    // Only proceed if clean state
    if (store.state !== 'IDLE' && store.state !== 'PRE_MATCH_CONFIG') {
      store.reset();
    }
    setConfig(selectedRounds);
    transition('confirmConfig');
    router.push('/(match)/matchmaking');
  }, [haptics, selectedRounds, setConfig, transition, router]);
  
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
        <PressableCard onPress={handleConfirm} style={styles.confirmButton}>
          <View style={styles.confirmContent}>
            <Text style={styles.confirmButtonText}>FIND OPPONENT</Text>
            <Ionicons name="arrow-forward" size={24} color={COLORS.textPrimary} />
          </View>
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
    justifyContent: 'center',
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  confirmButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
  },
});