import { DESIGN_TOKENS } from './app/shared/design-system/design-tokens';

describe('Atlas design tokens', () => {
  it('mantém contraste AA entre texto e superfícies principais', () => {
    const colors = DESIGN_TOKENS.colors;
    const pairs = [
      [colors.text, colors.background],
      [colors.textMuted, colors.surface],
      [colors.action, colors.surface],
      [colors.positive, colors.surface],
      [colors.negative, colors.surface],
      [colors.warning, colors.surface]
    ];
    for (const [foreground, background] of pairs) {
      expect(contrast(foreground, background), `${foreground} em ${background}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('declara escalas e breakpoints reutilizáveis', () => {
    expect(DESIGN_TOKENS.spacing.lg).toBe('1rem');
    expect(DESIGN_TOKENS.radius.large).toBe('1rem');
    expect(DESIGN_TOKENS.breakpoints).toEqual({ mobile: '48rem', desktop: '75rem' });
    expect(DESIGN_TOKENS.navigation.mobileBar).toBe('4.5rem');
  });

  it('inclui políticas globais para movimento reduzido e cores forçadas', () => {
    expect(DESIGN_TOKENS.mediaPolicies).toMatchInlineSnapshot(`
      [
        "prefers-reduced-motion: reduce",
        "forced-colors: active",
      ]
    `);
  });
});

function contrast(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map(index => Number.parseInt(value.slice(index, index + 2), 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
