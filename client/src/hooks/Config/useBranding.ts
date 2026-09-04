import { useEffect } from 'react';
import type { TBrandingConfig } from 'librechat-data-provider';
import { applyBrandingTheme } from '~/utils/branding';

export default function useBranding(branding?: TBrandingConfig): void {
  useEffect(() => applyBrandingTheme(branding), [branding]);
}
