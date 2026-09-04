import type { TBrandingConfig, TBrandingPalette } from 'librechat-data-provider';

const STYLE_ID = 'runtime-branding-theme';

const paletteProperties: Record<keyof TBrandingPalette, string[]> = {
  primary: ['accent-primary', 'surface-submit', 'link', 'brand-purple'],
  surface: ['surface-primary', 'surface-chat', 'surface-dialog'],
  text: ['text-primary'],
  secondaryText: ['text-secondary'],
};

function hexToChannels(hex: string): string {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)).join(' ');
}

function shiftColor(hex: string, amount: number): string {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  return channels
    .map((channel) => {
      const shifted = amount < 0 ? channel * (1 + amount) : channel + (255 - channel) * amount;
      return Math.max(0, Math.min(255, Math.round(shifted)));
    })
    .join(' ');
}

function paletteDeclarations(palette?: TBrandingPalette, dark = false): string {
  if (!palette) {
    return '';
  }

  const declarations = Object.entries(palette).flatMap(([key, value]) => {
    if (!value) {
      return [];
    }
    return paletteProperties[key as keyof TBrandingPalette].map(
      (property) => `--${property}: ${hexToChannels(value)} !important;`,
    );
  });

  if (palette.primary) {
    const hover = shiftColor(palette.primary, dark ? 0.18 : -0.18);
    declarations.push(
      `--accent-primary-hover: ${hover} !important;`,
      `--surface-submit-hover: ${hover} !important;`,
      `--link-hover: ${hover} !important;`,
    );
  }

  return declarations.join('');
}

export function applyBrandingTheme(branding?: TBrandingConfig): () => void {
  document.getElementById(STYLE_ID)?.remove();

  const light = paletteDeclarations(branding?.light);
  const dark = paletteDeclarations(branding?.dark, true);
  if (light || dark) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `${light ? `:root:not(.dark){${light}}` : ''}${dark ? `:root.dark{${dark}}` : ''}`;
    document.head.appendChild(style);
  }

  document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((favicon) => {
    favicon.dataset.brandingDefaultHref ??=
      favicon.getAttribute('href') || 'assets/favicon-32x32.png';
    favicon.href = branding?.faviconUrl || favicon.dataset.brandingDefaultHref;
  });

  return () => document.getElementById(STYLE_ID)?.remove();
}
