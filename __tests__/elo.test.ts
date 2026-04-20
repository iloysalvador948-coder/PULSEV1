import { calculateExpectedScore, calculateNewRating, getKFactor } from '../utils/elo';

describe('ELO System', () => {
  describe('calculateExpectedScore', () => {
    it('calculates expected score correctly for equal ratings', () => {
      const result = calculateExpectedScore(1500, 1500);
      expect(result).toBe(0.5);
    });

    it('returns higher expected score for higher rated player', () => {
      const result = calculateExpectedScore(1600, 1400);
      expect(result).toBeGreaterThan(0.5);
    });

    it('returns lower expected score for lower rated player', () => {
      const result = calculateExpectedScore(1400, 1600);
      expect(result).toBeLessThan(0.5);
    });
  });

  describe('getKFactor', () => {
    it('returns 40 for new players below 1200', () => {
      expect(getKFactor(1199)).toBe(40);
    });

    it('returns 24 for intermediate players between 1200 and 1600', () => {
      expect(getKFactor(1200)).toBe(24);
      expect(getKFactor(1599)).toBe(24);
    });

    it('returns 16 for advanced players 1600 and above', () => {
      expect(getKFactor(1600)).toBe(16);
      expect(getKFactor(2000)).toBe(16);
    });
  });

  describe('calculateNewRating', () => {
    it('new rating increases by correct K-factor amount after a win', () => {
      const currentRating = 1200;
      const opponentRating = 1200;
      const actualScore = 1.0;
      
      const newRating = calculateNewRating(currentRating, opponentRating, actualScore);
      const expectedScore = calculateExpectedScore(currentRating, opponentRating);
      const kFactor = getKFactor(currentRating);
      
      const expectedNewRating = currentRating + kFactor * (actualScore - expectedScore);
      expect(newRating).toBe(Math.round(expectedNewRating));
    });

    it('new rating decreases after a loss', () => {
      const newRating = calculateNewRating(1500, 1500, 0);
      expect(newRating).toBeLessThan(1500);
    });

    it('new rating stays the same after a draw', () => {
      const newRating = calculateNewRating(1500, 1500, 0.5);
      expect(newRating).toBe(1500);
    });
  });
});