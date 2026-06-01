// Dark gaming theme — high contrast, amber/orange accent, monospace code surfaces

export const colors = {
  background:    '#0D0D0F',
  surface:       '#16161A',
  surfaceRaised: '#1E1E24',
  border:        '#2A2A35',

  accent:        '#F59E0B',  // amber-400
  accentDim:     '#92400E',
  accentGlow:    'rgba(245, 158, 11, 0.18)',

  success:       '#22C55E',
  successDim:    'rgba(34, 197, 94, 0.15)',
  error:         '#EF4444',
  errorDim:      'rgba(239, 68, 68, 0.15)',
  info:          '#38BDF8',

  text:          '#F1F1F3',
  textSecondary: '#9CA3AF',
  textMuted:     '#4B5563',

  streak:        '#FF6B35',
  gem:           '#A78BFA',
  heart:         '#F43F5E',
  xp:            '#34D399',

  difficultyColor: {
    rookie:  '#6EE7B7',
    junior:  '#60A5FA',
    mid:     '#F59E0B',
    senior:  '#F97316',
    staff:   '#EF4444',
  } as Record<string, string>,
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  // Code surfaces
  mono: 'Courier New',
  // UI
  sans: 'System',
  sizes: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 36,
  },
  weights: {
    regular: '400',
    medium:  '500',
    semibold:'600',
    bold:    '700',
    black:   '900',
  },
} as const;

export const shadows = {
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
