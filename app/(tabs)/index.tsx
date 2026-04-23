import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/useUserStore';
import { useMatchHistoryStore } from '../../store/useMatchHistoryStore';
import { useGameStore } from '../../store/useGameStore';
import { useThemeContext } from '../../context/ThemeContext';
import { BentoCard } from '../../components/ui/BentoCard';
import { Typography } from '../../components/ui/Typography';
import { EloRingBadge } from '../../components/ui/EloRingBadge';
import { Tag } from '../../components/ui/Tag';
import { SPACING, darkColors } from '../../utils/constants';
import { getRankTier, getRankTierColor, getEloProgressToNextTier } from '../../utils/elo';

export default function DashboardScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const history = useMatchHistoryStore((state) => state.history);
  const { colors: COLORS } = useThemeContext();
  
  const tier = useMemo(() => getRankTier(profile.elo), [profile.elo]);
  const tierColor = useMemo(() => getRankTierColor(tier), [tier]);
  const progress = useMemo(() => getEloProgressToNextTier(profile.elo), [profile.elo]);
  
  const winRate = useMemo(() => {
    if (profile.totalMatches === 0) return 0;
    return Math.round((profile.wins / profile.totalMatches) * 100);
  }, [profile.wins, profile.totalMatches]);
  
  const lastMatch = useMemo(() => history[0] || null, [history]);
  
  const startBattle = () => {
    const { transition, syncPlayerElo } = useGameStore.getState();
    syncPlayerElo(profile.elo);
    transition('startMatchSetup');
    router.push('/(match)/config');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="display" style={styles.logo}>
            PULSE
          </Typography>
          <Pressable style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.textSecondary} />
          </Pressable>
        </View>
        
        <View style={styles.row1}>
          <View style={styles.eloCardWrapper}>
            <BentoCard style={styles.eloCard}>
              <View style={styles.eloHeader}>
                <Typography variant="caption" color={COLORS.textSecondary} letterSpacing={1.2}>
                  ELO RATING
                </Typography>
              </View>
              <View style={styles.eloMain}>
                <Typography variant="display" style={styles.eloNumber}>
                  {profile.elo}
                </Typography>
                <EloRingBadge elo={profile.elo} size={50} compact />
              </View>
              <View style={styles.eloTier}>
                <Tag label={tier} color={tierColor} textColor={COLORS.background} size="small" />
              </View>
            </BentoCard>
          </View>
          
          <BentoCard style={styles.statsCard}>
            <View style={styles.statItem}>
              <Typography variant="heading" color={COLORS.secondary}>
                {winRate}%
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                WIN RATE
              </Typography>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Typography variant="heading" color={COLORS.textPrimary}>
                {profile.totalMatches}
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                MATCHES
              </Typography>
            </View>
          </BentoCard>
        </View>
        
        <View style={styles.row2}>
          <Pressable onPress={startBattle} style={({ pressed }) => [
            styles.startBattleCard,
            pressed && styles.startBattleCardPressed
          ]}>
            <View style={styles.startBattleContent}>
              <View style={styles.startBattleTextContainer}>
                <Text style={styles.startBattleTitle}>START BATTLE</Text>
                <Text style={styles.startBattleSubtitle}>Find an opponent in 5 seconds</Text>
              </View>
              <View style={styles.startBattleIcon}>
                <Ionicons name="flash" size={32} color={COLORS.textPrimary} />
              </View>
            </View>
            <View style={styles.startBattleGlow} />
          </Pressable>
        </View>
        
        <View style={styles.row3}>
          <BentoCard style={styles.lastMatchCard}>
            {lastMatch ? (
              <>
                <View style={styles.lastMatchHeader}>
                  <Tag 
                    label={lastMatch.isWin ? 'WIN' : 'LOSS'} 
                    color={lastMatch.isWin ? COLORS.secondary : COLORS.primary}
                    textColor={COLORS.textPrimary}
                    size="small"
                  />
                </View>
                <Typography variant="heading" style={styles.lastMatchScore}>
                  {lastMatch.playerScore} – {lastMatch.opponentScore}
                </Typography>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  vs {lastMatch.opponent}
                </Typography>
                <View style={styles.lastMatchElo}>
                  <Typography 
                    variant="caption" 
                    color={lastMatch.eloChange >= 0 ? COLORS.secondary : COLORS.primary}
                  >
                    {lastMatch.eloChange >= 0 ? '+' : ''}{lastMatch.eloChange} ELO
                  </Typography>
                </View>
              </>
            ) : (
              <>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  NO MATCHES YET
                </Typography>
                <Typography variant="body" color={COLORS.textMuted} style={styles.noMatchText}>
                  Start your first battle to see results here
                </Typography>
              </>
            )}
          </BentoCard>
          
          <BentoCard style={styles.streakCard}>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={24} color={COLORS.tertiary} />
            </View>
            <Typography variant="display" color={COLORS.tertiary}>
              {profile.currentStreak}
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>
              CURRENT STREAK
            </Typography>
            <View style={styles.streakDivider} />
            <View style={styles.bestStreakRow}>
              <Typography variant="caption" color={COLORS.textMuted}>
                Best: {profile.bestStreak}
              </Typography>
            </View>
          </BentoCard>
        </View>
        
        <View style={styles.row4}>
          <BentoCard noPadding style={styles.recentMatchesCard}>
            <View style={styles.recentMatchesHeader}>
              <Typography variant="caption" color={COLORS.textSecondary} letterSpacing={1.2}>
                RECENT BATTLES
              </Typography>
            </View>
            {history.length > 0 ? (
              <View style={styles.recentMatchesList}>
                {history.slice(0, 5).map((match, index) => (
                  <View key={match.id} style={styles.recentMatchItem}>
                    <View style={styles.recentMatchLeft}>
                      <Typography variant="body">{match.opponent}</Typography>
                      <Typography variant="caption" color={COLORS.textMuted}>
                        {match.playerScore} – {match.opponentScore}
                      </Typography>
                    </View>
                    <View style={styles.recentMatchRight}>
                      <Tag 
                        label={match.isWin ? 'W' : 'L'} 
                        color={match.isWin ? COLORS.secondary : COLORS.primary}
                        textColor={COLORS.textPrimary}
                        size="small"
                      />
                      <Typography 
                        variant="caption" 
                        color={match.eloChange >= 0 ? COLORS.secondary : COLORS.primary}
                      >
                        {match.eloChange >= 0 ? '+' : ''}{match.eloChange}
                      </Typography>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noRecentMatches}>
                <Typography variant="body" color={COLORS.textMuted}>
                  No recent matches
                </Typography>
              </View>
            )}
          </BentoCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    color: darkColors.textPrimary,
  },
  notificationButton: {
    padding: SPACING.sm,
  },
  row1: {
    flexDirection: 'row',
    height: 160,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  eloCardWrapper: {
    flex: 1.4,
  },
  eloCard: {
    height: '100%',
    justifyContent: 'space-between',
  },
  eloHeader: {
    marginBottom: SPACING.sm,
  },
  eloMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eloNumber: {
    color: darkColors.textPrimary,
  },
  eloTier: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  statsCard: {
    flex: 1,
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  statDivider: {
    height: 1,
    backgroundColor: darkColors.divider,
    marginVertical: SPACING.xs,
  },
  row2: {
    marginBottom: SPACING.md,
  },
  startBattleCard: {
    height: 120,
    backgroundColor: darkColors.primary,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: darkColors.primary,
    overflow: 'hidden',
  },
  startBattleCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  startBattleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: SPACING.lg,
  },
  startBattleTextContainer: {
    flex: 1,
  },
  startBattleTitle: {
    color: darkColors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  startBattleSubtitle: {
    color: 'rgba(240, 240, 240, 0.7)',
    fontSize: 14,
    fontWeight: '400',
  },
  startBattleGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '35%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    opacity: 0.15,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },
  startBattleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row3: {
    flexDirection: 'row',
    height: 130,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  lastMatchCard: {
    flex: 1,
  },
  lastMatchHeader: {
    marginBottom: SPACING.sm,
  },
  lastMatchScore: {
    marginBottom: SPACING.xs,
  },
  lastMatchElo: {
    marginTop: SPACING.sm,
  },
  noMatchText: {
    marginTop: SPACING.sm,
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIcon: {
    marginBottom: SPACING.xs,
  },
  streakDivider: {
    width: '80%',
    height: 1,
    backgroundColor: darkColors.divider,
    marginVertical: SPACING.sm,
  },
  bestStreakRow: {
    alignItems: 'center',
  },
  row4: {
    marginBottom: SPACING.md,
  },
  recentMatchesCard: {
    paddingHorizontal: 0,
  },
  recentMatchesHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  recentMatchesList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  recentMatchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.divider,
  },
  recentMatchLeft: {
    flex: 1,
  },
  recentMatchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  noRecentMatches: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
});