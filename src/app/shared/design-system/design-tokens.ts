export const DESIGN_TOKENS = {
  colors: {
    background: '#f5f3ee', surface: '#ffffff', text: '#152033', textMuted: '#5b6b82',
    action: '#1f62d0', positive: '#176b53', negative: '#b4232c', warning: '#855707'
  },
  spacing: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', xxl: '2rem', section: '3rem' },
  radius: { small: '0.5rem', medium: '0.75rem', large: '1rem', pill: '999px' },
  breakpoints: { mobile: '48rem', desktop: '75rem' },
  navigation: { desktopRail: '14rem', tabletRail: '4.875rem', mobileBar: '4rem' },
  mediaPolicies: ['prefers-reduced-motion: reduce', 'forced-colors: active'] as const
} as const;
