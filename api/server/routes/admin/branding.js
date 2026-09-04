const express = require('express');
const { createAdminBrandingHandlers } = require('@librechat/api');
const { SystemCapabilities } = require('@librechat/data-schemas');
const { requireCapability } = require('~/server/middleware/roles/capabilities');
const { invalidateConfigCaches } = require('~/server/services/Config');
const { requireJwtAuth } = require('~/server/middleware');
const db = require('~/models');

const router = express.Router();
const requireAdminAccess = requireCapability(SystemCapabilities.ACCESS_ADMIN);

const handlers = createAdminBrandingHandlers({
  findConfigByPrincipal: db.findConfigByPrincipal,
  patchConfigFields: db.patchConfigFields,
  unsetConfigField: db.unsetConfigField,
  toggleConfigActive: db.toggleConfigActive,
  invalidateConfigCaches,
});

router.use(requireJwtAuth, requireAdminAccess);
router.get('/', handlers.getBranding);
router.put('/', handlers.updateBranding);
router.delete('/', handlers.resetBranding);

module.exports = router;
