import { applyBrandingTheme } from './branding';

describe('applyBrandingTheme', () => {
  afterEach(() => {
    document.getElementById('runtime-branding-theme')?.remove();
    document.documentElement.classList.remove('dark');
  });

  it('creates scoped light and dark theme overrides', () => {
    applyBrandingTheme({
      light: { primary: '#123456', surface: '#ffffff' },
      dark: { primary: '#abcdef', text: '#eeeeee' },
    });

    const css = document.getElementById('runtime-branding-theme')?.textContent;
    expect(css).toContain(':root:not(.dark)');
    expect(css).toContain('--accent-primary: 18 52 86 !important');
    expect(css).toContain(':root.dark');
    expect(css).toContain('--text-primary: 238 238 238 !important');
  });

  it('updates the favicon and restores the default when branding is cleared', () => {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);

    applyBrandingTheme({ faviconUrl: 'https://example.com/favicon.png' });
    expect(favicon.href).toBe('https://example.com/favicon.png');

    applyBrandingTheme(undefined);
    expect(favicon.getAttribute('href')).toContain('assets/favicon-32x32.png');
    favicon.remove();
  });
});
