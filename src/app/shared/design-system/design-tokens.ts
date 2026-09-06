export const DESIGN_TOKENS = {
  colors: {
    background: '#f4f7fb', surface: '#ffffff', text: '#172033', textMuted: '#5d6b82',
    action: '#185adb', positive: '#137a4a', negative: '#b4232c', warning: '#815600'
  },
  spacing: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', xxl: '2rem', section: '3rem' },
  radius: { small: '0.5rem', medium: '0.75rem', large: '1rem', pill: '999px' },
  breakpoints: { mobile: '48rem', desktop: '75rem' },
  navigation: { desktopRail: '15.5rem', tabletRail: '5.25rem', mobileBar: '4.5rem' },
  mediaPolicies: ['prefers-reduced-motion: reduce', 'forced-colors: active'] as const
} as const;
