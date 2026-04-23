import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { useThemeContext } from '../../context/ThemeContext';
import { BentoCard } from '../../components/ui/BentoCard';
import { Typography } from '../../components/ui/Typography';
import { Tag } from '../../components/ui/Tag';
import { SPACING, darkColors } from '../../utils/constants';
import { getRankTier, getRankTierColor } from '../../utils/elo';
import { RankTier, LeaderboardEntry } from '../../types';

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'CyberNinja', elo: 2180, tier: 'Diamond' },
  { rank: 2, username: 'SecurityPro', elo: 2050, tier: 'Diamond' },
  { rank: 3, username: 'HackBuster', elo: 1920, tier: 'Platinum' },
  { rank: 4, username: 'NetDefender', elo: 1850, tier: 'Platinum' },
  { rank: 5, username: 'DataGuard', elo: 1780, tier: 'Platinum' },
  { rank: 6, username: 'FirewallX', elo: 1650, tier: 'Gold' },
  { rank: 7, username: 'ThreatHunter', elo: 1580, tier: 'Gold' },
  { rank: 8, username: 'SecureStack', elo: 1450, tier: 'Gold' },
  { rank: 9, username: 'CryptoMaster', elo: 1380, tier: 'Silver' },
  { rank: 10, username: 'CodeBreaker', elo: 1250, tier: 'Silver' },
  { rank: 11, username: 'MalwareKiller', elo: 1150, tier: 'Bronze' },
  { rank: 12, username: 'PacketSniffer', elo: 1100, tier: 'Bronze' },
];

export default function LeaderboardScreen() {
  const profile = useUserStore((state) => state.profile);
  const { colors: COLORS } = useThemeContext();
  const [filter, setFilter] = useState<'ALL' | 'WEEKLY'>('ALL');
  
  const combinedLeaderboard = useMemo(() => {
    const userEntry: LeaderboardEntry = {
      rank: 0,
      username: profile.username,
      elo: profile.elo,
      tier: getRankTier(profile.elo),
      isCurrentUser: true,
    };
    
    const all = [...MOCK_LEADERBOARD, userEntry].sort((a, b) => b.elo - a.elo);
    
    return all.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }, [profile]);
  
  const topThree = combinedLeaderboard.slice(0, 3);
  const rest = combinedLeaderboard.slice(3);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Typography variant="display">LEADERBOARD</Typography>
      </View>
      
      <View style={styles.filterTabs}>
        <Pressable 
          style={[styles.filterTab, filter === 'ALL' && styles.filterTabActive]}
          onPress={() => setFilter('ALL')}
        >
          <Typography 
            variant="caption" 
            color={filter === 'ALL' ? COLORS.textPrimary : COLORS.textMuted}
          >
            ALL
          </Typography>
        </Pressable>
        <Pressable 
          style={[styles.filterTab, filter === 'WEEKLY' && styles.filterTabActive]}
          onPress={() => setFilter('WEEKLY')}
        >
          <Typography 
            variant="caption" 
            color={filter === 'WEEKLY' ? COLORS.textPrimary : COLORS.textMuted}
          >
            WEEKLY
          </Typography>
        </Pressable>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.podium}>
          {topThree.map((entry, index) => {
            const isCenter = index === 1;
            return (
              <View 
                key={entry.rank} 
                style={[
                  styles.podiumItem,
                  isCenter && styles.podiumItemCenter,
                ]}
              >
                <BentoCard style={[
                  styles.podiumCard,
                  ...(isCenter ? [styles.podiumCardCenter] : []),
                ]}>
                  <View style={styles.podiumRank}>
                    <Typography 
                      variant="display" 
                      color={index === 0 ? COLORS.tertiary : COLORS.textMuted}
                    >
                      {entry.rank}
                    </Typography>
                  </View>
                  <View style={styles.podiumAvatar}>
                    <Ionicons name="person" size={24} color={COLORS.textSecondary} />
                  </View>
                  <Typography variant="subheading">{entry.username}</Typography>
                  <Typography variant="caption" color={getRankTierColor(entry.tier)}>
                    {entry.elo} ELO
                  </Typography>
                  <Tag 
                    label={entry.tier} 
                    color={getRankTierColor(entry.tier)}
                    textColor={entry.tier === 'Diamond' ? COLORS.background : COLORS.textPrimary}
                    size="small"
                  />
                </BentoCard>
              </View>
            );
          })}
        </View>
        
        <View style={styles.list}>
          {rest.map((entry) => (
            <BentoCard 
              key={entry.rank} 
              style={[
                styles.playerRow,
                ...(entry.isCurrentUser ? [styles.currentUserRow] : []),
              ]}
            >
              <View style={styles.playerRank}>
                <Typography variant="subheading" color={COLORS.textSecondary}>
                  #{entry.rank}
                </Typography>
              </View>
              <View style={styles.playerAvatar}>
                <Ionicons name="person" size={20} color={COLORS.textSecondary} />
              </View>
              <View style={styles.playerInfo}>
                <Typography variant="body">{entry.username}</Typography>
                <Tag 
                  label={entry.tier} 
                  color={getRankTierColor(entry.tier)}
                  textColor={entry.tier === 'Diamond' ? COLORS.background : COLORS.textPrimary}
                  size="small"
                />
              </View>
              <View style={styles.playerElo}>
                <Typography variant="subheading">{entry.elo}</Typography>
                <Typography variant="caption" color={COLORS.textMuted}>ELO</Typography>
              </View>
            </BentoCard>
          ))}
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
  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: darkColors.cardSurface,
    borderWidth: 1,
    borderColor: darkColors.cardBorder,
  },
  filterTabActive: {
    borderColor: darkColors.primary,
    backgroundColor: 'rgba(184, 25, 8, 0.15)',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 80,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  podiumItem: {
    flex: 1,
    maxWidth: 100,
  },
  podiumItemCenter: {
    marginBottom: 20,
  },
  podiumCard: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  podiumCardCenter: {
    borderColor: darkColors.tertiary,
    borderWidth: 2,
  },
  podiumRank: {
    marginBottom: SPACING.xs,
  },
  podiumAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  list: {
    gap: SPACING.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  currentUserRow: {
    borderLeftWidth: 3,
    borderLeftColor: darkColors.primary,
  },
  playerRank: {
    width: 40,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkColors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  playerElo: {
    alignItems: 'flex-end',
  },
});