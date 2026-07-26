import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('monitoring production feature gate', () => {
  const source = fs.readFileSync('src/routes/monitoring.ts', 'utf8');

  it('defaults to no approved tenants', () => {
    expect(source).toContain("process.env.MONITORING_ENABLED_TENANT_IDS || ''");
  });

  it('derives tenant identity from authenticated server context', () => {
    expect(source).toContain("approved.has(req.user!.tenantId)");
    expect(source).not.toMatch(/approved\.has\(req\.(body|query|params)/);
  });

  it('returns the standardized safe disabled response with request correlation', () => {
    expect(source).toContain("code: 'MONITORING_NOT_ENABLED'");
    expect(source).toContain("requestId: res.locals.requestId");
    expect(source).toContain("res.setHeader('x-request-id', requestId)");
  });
});
