export const COLORS = {
  background: '#0E0E0F',
  cardSurface: '#1A1A1A',
  cardBorder: '#222222',
  primary: '#B81908',
  secondary: '#74A266',
  tertiary: '#C9A84C',
  textPrimary: '#F0F0F0',
  textSecondary: '#8A8A8A',
  textMuted: '#4A4A4A',
  divider: '#2A2A2A',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  display: 32,
  heading: 22,
  subheading: 16,
  body: 14,
  caption: 12,
  micro: 10,
} as const;

export const BORDER_RADIUS = {
  card: 28,
  button: 20,
  tag: 14,
} as const;

export const TIMER_DURATION_SECONDS = 15;

export const LIFELINE_COUNT = 1;

export const ROUND_COUNTS: [5, 6, 7] = [5, 6, 7];

export const K_FACTOR_THRESHOLDS = {
  newPlayer: 1200,
  intermediate: 1600,
} as const;

export const RANK_TIER_THRESHOLDS = {
  silver: 1200,
  gold: 1400,
  platinum: 1600,
  diamond: 1800,
} as const;

export const ELO_RANGES = {
  min: 800,
  max: 2200,
  botRange: 150,
} as const;

export const ANIMATION = {
  cardMount: 400,
  cardStagger: 60,
  buttonPressDuration: 150,
  fadeInDuration: 300,
} as const;

export const STORAGE_KEYS = {
  userProfile: '@pulse/user_profile',
  matchHistory: '@pulse/match_history',
  settings: '@pulse/settings',
} as const;

export const DEBOUNCE_DELAY = 500;

export const MATCHMAKING_DELAY = {
  min: 2000,
  max: 4000,
} as const;

export const INITIAL_USER_PROFILE = {
  username: 'Player_One',
  elo: 1200,
  wins: 0,
  losses: 0,
  totalMatches: 0,
  currentStreak: 0,
  bestStreak: 0,
  joinDate: new Date().toISOString(),
};