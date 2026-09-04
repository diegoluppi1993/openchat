import { useContext } from 'react';
import { ThemeContext, isDark } from '@librechat/client';
import type { TBrandingConfig } from 'librechat-data-provider';

export default function BrandLogo({
  branding,
  appTitle,
  className,
}: {
  branding?: TBrandingConfig;
  appTitle: string;
  className?: string;
}) {
  const { theme } = useContext(ThemeContext);
  const logoUrl = isDark(theme) ? (branding?.logoDarkUrl ?? branding?.logoUrl) : branding?.logoUrl;

  return <img src={logoUrl || 'assets/logo.svg'} className={className} alt={`${appTitle} logo`} />;
}
