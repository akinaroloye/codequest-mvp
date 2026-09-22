// CodeQuest Design System — "Precision"
// Developer-focused, typographically sound, semantically clear.

export const colors = {
  // Surfaces — layered elevation model
  bg:           '#0C0C0F',
  surface:      '#131316',
  surfaceHigh:  '#1C1C21',
  overlay:      '#28282F',

  // Borders
  border:       '#222228',
  borderStrong: '#34343C',

  // Text hierarchy
  text:         '#F2F2F7',
  textSub:      '#8E8E93',
  textMuted:    '#48484F',

  // Accent — indigo (interactive elements only)
  accent:    '#7C7CFF',
  accentSub: 'rgba(124,124,255,0.10)',

  // Semantic
  success:    '#30D158',
  successSub: 'rgba(48,209,88,0.10)',
  warning:    '#FF9F0A',
  warningSub: 'rgba(255,159,10,0.10)',
  error:      '#FF453A',
  errorSub:   'rgba(255,69,58,0.10)',

  // Gamification (contextual)
  xp:     '#30D158',
  streak: '#FF9F0A',
  gem:    '#BF5AF2',
  heart:  '#FF453A',

  difficultyColor: {
    rookie: '#30D158',
    junior: '#7C7CFF',
    mid:    '#FF9F0A',
    senior: '#FF6B35',
    staff:  '#FF453A',
  } as Record<string, string>,
} as const;

export const space = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
} as const;

export const font = {
  size: {
    caption: 11,
    label:   13,
    body:    15,
    h3:      17,
    h2:      20,
    h1:      24,
    hero:    32,
  },
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    heavy:    '800' as const,
  },
  mono: 'Menlo',
} as const;

// Legacy aliases — lets existing code import without breaking immediately
export const spacing = {
  xs:  space[1],
  sm:  space[2],
  md:  space[4],
  lg:  space[6],
  xl:  space[8],
  xxl: space[12],
} as const;

export const typography = {
  sizes: {
    xs:   font.size.caption,
    sm:   font.size.label,
    md:   font.size.body,
    lg:   font.size.h3,
    xl:   font.size.h2,
    xxl:  font.size.h1,
    hero: font.size.hero,
  },
  weights: {
    regular:  font.weight.regular,
    medium:   font.weight.medium,
    semibold: font.weight.semibold,
    bold:     font.weight.bold,
    black:    font.weight.heavy,
  },
  mono: font.mono,
} as const;

export const shadows = {
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;
