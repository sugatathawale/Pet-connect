/** Design tokens. Every colour, space, and radius in the app comes from here. */

export const colors = {
  // Teal primary: deliberately distinct from the green used for health/success
  // badges, so "Open to breeding" never competes with "Vaccinated".
  primary: '#0E9594',
  primaryDark: '#0A7574',
  primarySoft: '#E4F5F5',

  // Amber accent, used sparingly for availability and highlights.
  accent: '#F4A259',
  accentSoft: '#FDF0E3',

  ink: '#14262B',
  inkMuted: '#5A737A',
  inkFaint: '#93A7AD',

  surface: '#FFFFFF',
  surfaceAlt: '#F4F8F8',
  border: '#E2EDED',

  success: '#2E9E5B',
  successSoft: '#E8F6EE',
  warning: '#C8890B',
  warningSoft: '#FBF2DF',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',

  male: '#3E8BFF',
  maleSoft: '#EAF2FF',
  female: '#F76CA6',
  femaleSoft: '#FDEDF4',
} as const;

/**
 * Translucent overlays, derived from `ink` (#14262B → 20,38,43).
 *
 * Kept as tokens so modal backdrops and photo scrims stay in step with the
 * palette instead of drifting as hardcoded rgba values.
 */
export const overlay = {
  scrimSoft: 'rgba(20,38,43,0.35)',
  scrimStrong: 'rgba(20,38,43,0.92)',
  backdrop: 'rgba(20,38,43,0.55)',
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
    shadowColor: '#14262B',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#14262B',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },
} as const;
