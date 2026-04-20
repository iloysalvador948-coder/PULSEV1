import { RankTier } from '../types';
import { K_FACTOR_THRESHOLDS, RANK_TIER_THRESHOLDS } from './constants';

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  const exponent = (ratingB - ratingA) / 400;
  return 1 / (1 + Math.pow(10, exponent));
}

export function getKFactor(rating: number): number {
  if (rating < K_FACTOR_THRESHOLDS.newPlayer) {
    return 40;
  }
  if (rating < K_FACTOR_THRESHOLDS.intermediate) {
    return 24;
  }
  return 16;
}

export function calculateNewRating(
  currentRating: number,
  opponentRating: number,
  actualScore: number
): number {
  const expectedScore = calculateExpectedScore(currentRating, opponentRating);
  const kFactor = getKFactor(currentRating);
  const newRating = currentRating + kFactor * (actualScore - expectedScore);
  return Math.round(newRating);
}

export function getRankTier(rating: number): RankTier {
  if (rating < RANK_TIER_THRESHOLDS.silver) {
    return 'Bronze';
  }
  if (rating < RANK_TIER_THRESHOLDS.gold) {
    return 'Silver';
  }
  if (rating < RANK_TIER_THRESHOLDS.platinum) {
    return 'Gold';
  }
  if (rating < RANK_TIER_THRESHOLDS.diamond) {
    return 'Platinum';
  }
  return 'Diamond';
}

export function getRankTierColor(tier: RankTier): string {
  switch (tier) {
    case 'Bronze':
      return '#CD7F32';
    case 'Silver':
      return '#C0C0C0';
    case 'Gold':
      return '#C9A84C';
    case 'Platinum':
      return '#E5E4E2';
    case 'Diamond':
      return '#B9F2FF';
    default:
      return '#8A8A8A';
  }
}

export function getEloProgressToNextTier(rating: number): number {
  const thresholds = [
    RANK_TIER_THRESHOLDS.silver,
    RANK_TIER_THRESHOLDS.gold,
    RANK_TIER_THRESHOLDS.platinum,
    RANK_TIER_THRESHOLDS.diamond,
  ];
  
  for (let i = 0; i < thresholds.length; i++) {
    if (rating < thresholds[i]) {
      const currentThreshold = i === 0 ? 0 : thresholds[i - 1];
      const nextThreshold = thresholds[i];
      return (rating - currentThreshold) / (nextThreshold - currentThreshold);
    }
  }
  return 1;
}