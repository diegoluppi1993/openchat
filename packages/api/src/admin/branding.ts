import { BASE_CONFIG_PRINCIPAL_ID, logger } from '@librechat/data-schemas';
import { PrincipalModel, PrincipalType, brandingConfigSchema } from 'librechat-data-provider';
import type { TBrandingConfig } from 'librechat-data-provider';
import type { IConfig } from '@librechat/data-schemas';
import type { ClientSession, Types } from 'mongoose';
import type { Response } from 'express';
import type { ServerRequest } from '~/types/http';

const DEFAULT_PRIORITY = 10;

export interface AdminBrandingDeps {
  findConfigByPrincipal: (
    principalType: PrincipalType,
    principalId: string | Types.ObjectId,
    options?: { includeInactive?: boolean },
    session?: ClientSession,
  ) => Promise<IConfig | null>;
  patchConfigFields: (
    principalType: PrincipalType,
    principalId: string | Types.ObjectId,
    principalModel: PrincipalModel,
    fields: Record<string, unknown>,
    priority: number,
    session?: ClientSession,
  ) => Promise<IConfig | null>;
  unsetConfigField: (
    principalType: PrincipalType,
    principalId: string | Types.ObjectId,
    fieldPath: string,
    session?: ClientSession,
  ) => Promise<IConfig | null>;
  toggleConfigActive: (
    principalType: PrincipalType,
    principalId: string | Types.ObjectId,
    isActive: boolean,
    session?: ClientSession,
  ) => Promise<IConfig | null>;
  invalidateConfigCaches?: (tenantId?: string) => Promise<void>;
}

function getTenantId(req: ServerRequest): string | undefined {
  return (req.user as { tenantId?: string } | undefined)?.tenantId;
}

function readStoredBranding(config: IConfig | null): TBrandingConfig {
  const parsed = brandingConfigSchema.safeParse(config?.overrides?.branding ?? {});
  return parsed.success ? parsed.data : {};
}

export function createAdminBrandingHandlers({
  findConfigByPrincipal,
  patchConfigFields,
  unsetConfigField,
  toggleConfigActive,
  invalidateConfigCaches,
}: AdminBrandingDeps): {
  getBranding: (req: ServerRequest, res: Response) => Promise<Response>;
  updateBranding: (req: ServerRequest, res: Response) => Promise<Response>;
  resetBranding: (req: ServerRequest, res: Response) => Promise<Response>;
} {
  const findBaseConfig = () =>
    findConfigByPrincipal(PrincipalType.ROLE, BASE_CONFIG_PRINCIPAL_ID, {
      includeInactive: true,
    });

  const invalidate = async (req: ServerRequest): Promise<void> => {
    try {
      await invalidateConfigCaches?.(getTenantId(req));
    } catch (error) {
      logger.error('[adminBranding] Cache invalidation failed:', error);
    }
  };

  async function getBranding(req: ServerRequest, res: Response): Promise<Response> {
    try {
      return res.status(200).json(readStoredBranding(await findBaseConfig()));
    } catch (error) {
      logger.error('[adminBranding] getBranding error:', error);
      return res.status(500).json({ error: 'Failed to load branding configuration' });
    }
  }

  async function updateBranding(req: ServerRequest, res: Response): Promise<Response> {
    const parsed = brandingConfigSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid branding configuration',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    try {
      const existing = await findBaseConfig();
      let updated = await patchConfigFields(
        PrincipalType.ROLE,
        BASE_CONFIG_PRINCIPAL_ID,
        PrincipalModel.ROLE,
        { branding: parsed.data },
        existing?.priority ?? DEFAULT_PRIORITY,
      );
      if (updated?.isActive === false) {
        updated = await toggleConfigActive(PrincipalType.ROLE, BASE_CONFIG_PRINCIPAL_ID, true);
      }
      await invalidate(req);
      return res.status(200).json(readStoredBranding(updated));
    } catch (error) {
      logger.error('[adminBranding] updateBranding error:', error);
      return res.status(500).json({ error: 'Failed to update branding configuration' });
    }
  }

  async function resetBranding(req: ServerRequest, res: Response): Promise<Response> {
    try {
      await unsetConfigField(PrincipalType.ROLE, BASE_CONFIG_PRINCIPAL_ID, 'branding');
      await invalidate(req);
      return res.status(200).json({});
    } catch (error) {
      logger.error('[adminBranding] resetBranding error:', error);
      return res.status(500).json({ error: 'Failed to reset branding configuration' });
    }
  }

  return { getBranding, updateBranding, resetBranding };
}
