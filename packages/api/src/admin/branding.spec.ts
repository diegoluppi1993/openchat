import type { Response } from 'express';
import type { ServerRequest } from '~/types/http';
import { createAdminBrandingHandlers } from './branding';

function mockReq(body: object = {}) {
  return { body, user: { id: 'u1', role: 'ADMIN' } } as Partial<ServerRequest> as ServerRequest;
}

interface MockResponse {
  statusCode: number;
  body: unknown;
  status: jest.Mock;
  json: jest.Mock;
}

function mockRes() {
  const response: MockResponse = {
    statusCode: 200,
    body: undefined as unknown,
    status: jest.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: jest.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response as Partial<Response> as Response & typeof response;
}

function createHandlers(overrides = {}) {
  const deps = {
    findConfigByPrincipal: jest.fn().mockResolvedValue(null),
    patchConfigFields: jest
      .fn()
      .mockImplementation((_type, _id, _model, fields) => Promise.resolve({ overrides: fields })),
    unsetConfigField: jest.fn().mockResolvedValue({ overrides: {} }),
    toggleConfigActive: jest.fn().mockResolvedValue({ overrides: {} }),
    invalidateConfigCaches: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return { handlers: createAdminBrandingHandlers(deps), deps };
}

describe('createAdminBrandingHandlers', () => {
  it('persists a valid branding configuration', async () => {
    const { handlers, deps } = createHandlers();
    const response = mockRes();
    const branding = {
      appTitle: 'OpenChat',
      welcomeMessage: 'Ciao {{user.name}}',
      logoUrl: '/assets/openchat.svg',
      light: { primary: '#123456' },
    };

    await handlers.updateBranding(mockReq(branding), response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(branding);
    expect(deps.patchConfigFields).toHaveBeenCalledWith(
      'role',
      '__base__',
      'Role',
      { branding },
      10,
    );
  });

  it('rejects unsafe asset URLs and invalid colors', async () => {
    const { handlers, deps } = createHandlers();
    const response = mockRes();

    await handlers.updateBranding(
      mockReq({ logoUrl: 'javascript:alert(1)', light: { primary: 'red' } }),
      response,
    );

    expect(response.statusCode).toBe(400);
    expect(deps.patchConfigFields).not.toHaveBeenCalled();
  });

  it('removes only the branding override on reset', async () => {
    const { handlers, deps } = createHandlers();
    const response = mockRes();

    await handlers.resetBranding(mockReq(), response);

    expect(response.statusCode).toBe(200);
    expect(deps.unsetConfigField).toHaveBeenCalledWith('role', '__base__', 'branding');
  });
});
