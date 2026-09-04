import { brandingConfigSchema } from '../src/config';

describe('brandingConfigSchema', () => {
  it('accepts global assets and separate light and dark palettes', () => {
    expect(
      brandingConfigSchema.parse({
        appTitle: 'OpenChat',
        welcomeMessage: 'Welcome, {{user.name}}!',
        footer: '[Privacy](/privacy)',
        logoUrl: '/assets/openchat.svg',
        faviconUrl: 'https://example.com/favicon.png',
        light: { primary: '#123456', surface: '#ffffff' },
        dark: { primary: '#abcdef', surface: '#111111' },
      }),
    ).toEqual({
      appTitle: 'OpenChat',
      welcomeMessage: 'Welcome, {{user.name}}!',
      footer: '[Privacy](/privacy)',
      logoUrl: '/assets/openchat.svg',
      faviconUrl: 'https://example.com/favicon.png',
      light: { primary: '#123456', surface: '#ffffff' },
      dark: { primary: '#abcdef', surface: '#111111' },
    });
  });

  it.each([
    { logoUrl: 'javascript:alert(1)' },
    { faviconUrl: 'data:image/svg+xml,test' },
    { light: { primary: '#fff' } },
  ])('rejects unsafe or malformed values: %o', (branding) => {
    expect(brandingConfigSchema.safeParse(branding).success).toBe(false);
  });
});
