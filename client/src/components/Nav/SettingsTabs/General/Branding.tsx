import { useEffect, useState } from 'react';
import { Button, Input, Label, Spinner, useToastContext } from '@librechat/client';
import type { TBrandingConfig, TBrandingPalette } from 'librechat-data-provider';
import type { FormEvent } from 'react';
import {
  useGetBrandingConfigQuery,
  useResetBrandingConfigMutation,
  useUpdateBrandingConfigMutation,
} from '~/data-provider';
import { useLocalize } from '~/hooks';

const paletteFields: Array<{
  key: keyof TBrandingPalette;
  label:
    | 'com_ui_branding_primary'
    | 'com_ui_branding_surface'
    | 'com_ui_branding_text'
    | 'com_ui_branding_secondary_text';
  fallback: string;
}> = [
  { key: 'primary', label: 'com_ui_branding_primary', fallback: '#126e6b' },
  { key: 'surface', label: 'com_ui_branding_surface', fallback: '#ffffff' },
  { key: 'text', label: 'com_ui_branding_text', fallback: '#212121' },
  { key: 'secondaryText', label: 'com_ui_branding_secondary_text', fallback: '#424242' },
];

function optional(value: string): string | undefined {
  return value.trim() || undefined;
}

function compactPalette(palette?: TBrandingPalette): TBrandingPalette | undefined {
  const compact = Object.fromEntries(
    Object.entries(palette ?? {}).filter(([, value]) => Boolean(value)),
  ) as TBrandingPalette;
  return Object.keys(compact).length > 0 ? compact : undefined;
}

function compactBranding(branding: TBrandingConfig): TBrandingConfig {
  return {
    appTitle: optional(branding.appTitle ?? ''),
    welcomeMessage: optional(branding.welcomeMessage ?? ''),
    footer: optional(branding.footer ?? ''),
    logoUrl: optional(branding.logoUrl ?? ''),
    logoDarkUrl: optional(branding.logoDarkUrl ?? ''),
    faviconUrl: optional(branding.faviconUrl ?? ''),
    light: compactPalette(branding.light),
    dark: compactPalette(branding.dark),
  };
}

function PaletteEditor({
  title,
  palette,
  onChange,
}: {
  title: string;
  palette?: TBrandingPalette;
  onChange: (palette: TBrandingPalette) => void;
}) {
  const localize = useLocalize();
  return (
    <fieldset className="space-y-3 rounded-lg border border-border-light p-4">
      <legend className="px-1 text-sm font-medium text-text-primary">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {paletteFields.map(({ key, label, fallback }) => {
          const value = palette?.[key] ?? '';
          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`branding-${title}-${key}`}>{localize(label)}</Label>
              <div className="flex gap-2">
                <input
                  id={`branding-${title}-${key}`}
                  type="color"
                  value={value || fallback}
                  onChange={(event) => onChange({ ...palette, [key]: event.target.value })}
                  className="h-10 w-12 cursor-pointer rounded-md border border-border-medium bg-transparent p-1"
                />
                <Input
                  value={value}
                  placeholder={fallback}
                  pattern="#[0-9a-fA-F]{6}"
                  onChange={(event) => onChange({ ...palette, [key]: event.target.value })}
                  aria-label={`${localize(label)} HEX`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function Branding() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { data, isLoading } = useGetBrandingConfigQuery();
  const updateBranding = useUpdateBrandingConfigMutation();
  const resetBranding = useResetBrandingConfigMutation();
  const [form, setForm] = useState<TBrandingConfig>({});

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  const setField = <K extends keyof TBrandingConfig>(key: K, value: TBrandingConfig[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const saved = await updateBranding.mutateAsync(compactBranding(form));
      setForm(saved);
      showToast({ status: 'success', message: localize('com_ui_branding_saved') });
    } catch (_error) {
      showToast({ status: 'error', message: localize('com_ui_branding_save_error') });
    }
  };

  const handleReset = async () => {
    try {
      await resetBranding.mutateAsync();
      setForm({});
      showToast({ status: 'success', message: localize('com_ui_branding_reset_done') });
    } catch (_error) {
      showToast({ status: 'error', message: localize('com_ui_branding_save_error') });
    }
  };

  if (isLoading) {
    return <Spinner className="mx-auto" />;
  }

  const previewPrimary = form.light?.primary || '#126e6b';
  const previewSurface = form.light?.surface || '#ffffff';
  const previewText = form.light?.text || '#212121';

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <p className="text-sm text-text-secondary">{localize('com_ui_branding_description')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="branding-title">{localize('com_ui_branding_app_title')}</Label>
          <Input
            id="branding-title"
            value={form.appTitle ?? ''}
            maxLength={80}
            placeholder="OpenChat"
            onChange={(event) => setField('appTitle', event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="branding-welcome">{localize('com_ui_branding_welcome')}</Label>
          <Input
            id="branding-welcome"
            value={form.welcomeMessage ?? ''}
            maxLength={240}
            placeholder={localize('com_ui_branding_welcome_placeholder')}
            onChange={(event) => setField('welcomeMessage', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="branding-footer">{localize('com_ui_branding_footer')}</Label>
        <Input
          id="branding-footer"
          value={form.footer ?? ''}
          maxLength={500}
          placeholder={localize('com_ui_branding_footer_placeholder')}
          onChange={(event) => setField('footer', event.target.value)}
        />
      </div>

      <div className="space-y-3">
        {(['logoUrl', 'logoDarkUrl', 'faviconUrl'] as const).map((key) => {
          const label = {
            logoUrl: 'com_ui_branding_logo_url',
            logoDarkUrl: 'com_ui_branding_logo_dark_url',
            faviconUrl: 'com_ui_branding_favicon_url',
          }[key] as
            | 'com_ui_branding_logo_url'
            | 'com_ui_branding_logo_dark_url'
            | 'com_ui_branding_favicon_url';
          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`branding-${key}`}>{localize(label)}</Label>
              <Input
                id={`branding-${key}`}
                type="text"
                value={form[key] ?? ''}
                placeholder="https://example.com/logo.svg"
                onChange={(event) => setField(key, event.target.value)}
              />
            </div>
          );
        })}
      </div>

      <PaletteEditor
        title={localize('com_ui_branding_light_palette')}
        palette={form.light}
        onChange={(palette) => setField('light', palette)}
      />
      <PaletteEditor
        title={localize('com_ui_branding_dark_palette')}
        palette={form.dark}
        onChange={(palette) => setField('dark', palette)}
      />

      <div
        className="rounded-lg border border-border-light p-5"
        style={{ backgroundColor: previewSurface, color: previewText }}
      >
        <div className="flex items-center gap-3">
          {form.logoUrl && (
            <img src={form.logoUrl} alt="" className="h-9 max-w-24 object-contain" />
          )}
          <div>
            <p className="font-semibold">{form.appTitle || 'OpenChat'}</p>
            <p className="text-sm">{form.welcomeMessage || localize('com_ui_branding_preview')}</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-4 rounded-md px-3 py-2 text-sm text-white"
          style={{ backgroundColor: previewPrimary }}
        >
          {localize('com_ui_branding_preview_button')}
        </button>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={resetBranding.isLoading || updateBranding.isLoading}
          onClick={handleReset}
        >
          {localize('com_ui_reset')}
        </Button>
        <Button type="submit" disabled={updateBranding.isLoading || resetBranding.isLoading}>
          {updateBranding.isLoading ? <Spinner className="size-4" /> : localize('com_ui_save')}
        </Button>
      </div>
    </form>
  );
}
