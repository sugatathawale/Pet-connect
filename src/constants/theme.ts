/** Design tokens. Every colour, space, and radius in the app comes from here. */

export const colors = {
  primary: '#FF7A59',
  primaryDark: '#E85F3D',
  primarySoft: '#FFF0EB',

  accent: '#2EC4B6',
  accentSoft: '#E6F7F5',

  ink: '#1A1523',
  inkMuted: '#6B6577',
  inkFaint: '#9C97A6',

  surface: '#FFFFFF',
  surfaceAlt: '#F7F5F9',
  border: '#EBE7F0',

  success: '#2E9E5B',
  successSoft: '#E8F6EE',
  warning: '#E0A008',
  warningSoft: '#FDF4E0',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',

  male: '#3E8BFF',
  maleSoft: '#EAF2FF',
  female: '#F76CA6',
  femaleSoft: '#FDEDF4',
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
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
} as const;

export const shadow = {
  card: {
    shadowColor: '#1A1523',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#1A1523',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },
} as const;
