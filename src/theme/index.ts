export const colors = {
  background: '#0F1419',
  surface: '#1A2028',
  surfaceElevated: '#232B36',
  border: '#2F3946',
  divider: '#3A4654',

  textPrimary: '#F5F7FA',
  textSecondary: '#9AA5B4',
  textMuted: '#5C6675',

  accent: '#3DDC97',
  accentMuted: '#1F4F3D',

  negative: '#FF6B6B',
  negativeMuted: '#4A1F22',
  positive: '#3DDC97',
  positiveMuted: '#1F4F3D',

  buttonPrimary: '#3DDC97',
  buttonPrimaryText: '#0F1419',
  buttonSecondary: '#232B36',
  buttonSecondaryText: '#F5F7FA',
  buttonDanger: '#FF6B6B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const, letterSpacing: 0.3 },
  number: { fontSize: 18, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as ['tabular-nums'] },
  numberLarge: { fontSize: 28, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as ['tabular-nums'] },
};
