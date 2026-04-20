import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { useMatchHistoryStore } from '../../store/useMatchHistoryStore';
import { BentoCard } from '../../components/ui/BentoCard';
import { Typography } from '../../components/ui/Typography';
import { Tag } from '../../components/ui/Tag';
import { Divider } from '../../components/ui/Divider';
import { COLORS, SPACING } from '../../utils/constants';
import { getRankTier, getRankTierColor } from '../../utils/elo';
import { useHaptics } from '../../hooks/useHaptics';

export default function ProfileScreen() {
  const profile = useUserStore((state) => state.profile);
  const history = useMatchHistoryStore((state) => state.history);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const haptics = useHaptics();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(profile.username);
  
  const tier = useMemo(() => getRankTier(profile.elo), [profile.elo]);
  const tierColor = useMemo(() => getRankTierColor(tier), [tier]);
  
  const winRate = useMemo(() => {
    if (profile.totalMatches === 0) return 0;
    return Math.round((profile.wins / profile.totalMatches) * 100);
  }, [profile.wins, profile.totalMatches]);
  
  const avgScore = useMemo(() => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, match) => sum + match.playerScore, 0);
    return Math.round(total / history.length);
  }, [history]);
  
  const memberSince = useMemo(() => {
    const date = new Date(profile.joinDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  }, [profile.joinDate]);
  
  const initials = profile.username.slice(0, 2).toUpperCase();
  
  const handleEditToggle = () => {
    haptics.impactLight();
    if (isEditing) {
      // Cancel edit
      setEditedUsername(profile.username);
    }
    setIsEditing(!isEditing);
  };
  
  const handleSaveUsername = () => {
    haptics.notificationSuccess();
    if (editedUsername.trim().length > 0) {
      updateProfile({ username: editedUsername.trim() });
    }
    setIsEditing(false);
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BentoCard style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Typography variant="heading" color={COLORS.textPrimary}>
                {initials}
              </Typography>
            </View>
            <View style={styles.eloBadgeContainer}>
              <Tag 
                label={`${profile.elo} ELO`}
                color={tierColor}
                textColor={tier === 'Diamond' ? COLORS.background : COLORS.textPrimary}
              />
            </View>
          </View>
          
          {isEditing ? (
            <View style={styles.editUsernameContainer}>
              <TextInput
                style={styles.usernameInput}
                value={editedUsername}
                onChangeText={setEditedUsername}
                placeholder="Enter username"
                placeholderTextColor={COLORS.textMuted}
                maxLength={20}
                autoFocus
              />
              <View style={styles.editButtonsRow}>
                <Pressable onPress={handleEditToggle} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSaveUsername} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.usernameContainer}>
              <Typography variant="heading" style={styles.username}>
                {profile.username}
              </Typography>
              <Pressable onPress={handleEditToggle} style={styles.editButton}>
                <Ionicons name="pencil" size={18} color={COLORS.textSecondary} />
              </Pressable>
            </View>
          )}
          
          <Typography variant="caption" color={COLORS.textSecondary}>
            Member since {memberSince}
          </Typography>
        </BentoCard>
        
        <View style={styles.statsGrid}>
          <BentoCard style={styles.statCard}>
            <Typography variant="display" color={COLORS.textPrimary}>
              {profile.totalMatches}
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>
              TOTAL MATCHES
            </Typography>
          </BentoCard>
          
          <BentoCard style={styles.statCard}>
            <Typography variant="display" color={COLORS.secondary}>
              {winRate}%
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>
              WIN RATE
            </Typography>
          </BentoCard>
          
          <BentoCard style={styles.statCard}>
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={24} color={COLORS.tertiary} />
              <Typography variant="display" color={COLORS.tertiary}>
                {profile.bestStreak}
              </Typography>
            </View>
            <Typography variant="caption" color={COLORS.textSecondary}>
              BEST STREAK
            </Typography>
          </BentoCard>
          
          <BentoCard style={styles.statCard}>
            <Typography variant="display" color={COLORS.textPrimary}>
              {avgScore}
            </Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>
              AVG SCORE
            </Typography>
          </BentoCard>
        </View>
        
        <BentoCard noPadding style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Typography variant="caption" color={COLORS.textSecondary} letterSpacing={1.2}>
              MATCH HISTORY
            </Typography>
          </View>
          
          {history.length > 0 ? (
            <View style={styles.historyList}>
              {history.slice(0, 10).map((match, index) => (
                <View key={match.id}>
                  <View style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <Typography variant="body">{match.opponent}</Typography>
                      <Typography variant="caption" color={COLORS.textMuted}>
                        {new Date(match.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                    </View>
                    <View style={styles.historyMiddle}>
                      <Typography variant="body">
                        {match.playerScore} – {match.opponentScore}
                      </Typography>
                    </View>
                    <View style={styles.historyRight}>
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
                  {index < history.length - 1 && <Divider style={styles.historyDivider} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noHistory}>
              <Typography variant="body" color={COLORS.textMuted}>
                No matches played yet
              </Typography>
              <Typography variant="caption" color={COLORS.textMuted}>
                Start a battle to see your history
              </Typography>
            </View>
          )}
        </BentoCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 60,
  },
  headerCard: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eloBadgeContainer: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  username: {
    marginBottom: SPACING.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  historyCard: {
    paddingHorizontal: 0,
  },
  historyHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  historyList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  historyLeft: {
    flex: 1,
  },
  historyMiddle: {
    flex: 0.5,
    alignItems: 'center',
  },
  historyRight: {
    flex: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  historyDivider: {
    marginVertical: 0,
  },
  noHistory: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  editButton: {
    padding: SPACING.xs,
  },
  editUsernameContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  usernameInput: {
    width: '80%',
    height: 44,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});