import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { generateRealSbom } from '../src/utils/sbom.ts';

const TARGET_EMAIL = 'stackdigitz@gmail.com';
const CLIENT_ID = 'client-spr-workspace';
const PASSPORT_ID = 'pass-spr-repository';

const sslMode = process.env.SQL_SSL?.trim().toLowerCase();
const client = new Client({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  ssl: sslMode === 'true' || sslMode === 'require'
    ? { rejectUnauthorized: true }
    : undefined,
});

const hashTrackedSource = () => {
  const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'buffer' })
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .sort();
  const digest = crypto.createHash('sha256');
  for (const relativePath of tracked) {
    const absolutePath = path.resolve(relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) continue;
    digest.update(relativePath, 'utf8');
    digest.update('\0');
    digest.update(fs.readFileSync(absolutePath));
    digest.update('\0');
  }
  return `sha256:${digest.digest('hex')}`;
};

await client.connect();
try {
  await client.query('BEGIN');
  const userResult = await client.query(
    'SELECT tenant_id, role FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [TARGET_EMAIL],
  );
  const user = userResult.rows[0];
  if (!user) throw new Error('TARGET_WORKSPACE_USER_NOT_FOUND');
  if (user.role !== 'Admin') throw new Error('TARGET_WORKSPACE_USER_IS_NOT_ADMIN');

  const tenantId = user.tenant_id as string;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const sourceDigest = hashTrackedSource();
  const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  const { components } = generateRealSbom();
  const observedComponents = components.map(component => ({
    ...component,
    ecosystem: 'npm',
  }));

  await client.query(`
    INSERT INTO clients (
      id, tenant_id, name, domain, industry, trust_score, risk_level,
      avatar_color, subscription_tier, joined_date, team_count, passport_count,
      critical_risks_count, compliance_progress, software_inventory,
      compliance_status, team_members, activity_timeline
    )
    VALUES ($1, $2, 'Software Passport Registry', $3, 'Software Supply Chain Security',
      0, 'Unknown', 'indigo', 'Standard', $4, 1, 1, 0, 0, $5, '[]', '[]', $6)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      name = EXCLUDED.name,
      domain = EXCLUDED.domain,
      industry = EXCLUDED.industry,
      passport_count = 1,
      software_inventory = EXCLUDED.software_inventory,
      activity_timeline = EXCLUDED.activity_timeline
  `, [
    CLIENT_ID,
    tenantId,
    'software-passport-registry.stackdigitz.chatgpt.site',
    today,
    JSON.stringify([{ id: PASSPORT_ID, name: 'Software Passport Registry', version: sourceCommit }]),
    JSON.stringify([{
      date: today,
      event: 'Workspace client registered',
      user: TARGET_EMAIL,
      details: 'SPR was registered from the deployed application workspace. No subscription or trust status was inferred.',
    }]),
  ]);

  await client.query(`
    INSERT INTO passports (
      id, tenant_id, client_id, name, version, publisher, category,
      overall_score, security_score, compliance_score, vendor_reputation_score,
      release_date, file_hash, license_type, ai_summary, sbom, evidence,
      vulnerabilities, timeline
    )
    VALUES ($1, $2, $3, 'Software Passport Registry', $4,
      'Software Passport Registry (SPR)', 'Source Repository Application',
      0, 0, 0, 0, $5, $6, $7, $8, $9, '[]', '[]', $10)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      client_id = EXCLUDED.client_id,
      version = EXCLUDED.version,
      release_date = EXCLUDED.release_date,
      file_hash = EXCLUDED.file_hash,
      license_type = EXCLUDED.license_type,
      ai_summary = EXCLUDED.ai_summary,
      sbom = EXCLUDED.sbom,
      evidence = '[]',
      vulnerabilities = '[]',
      timeline = EXCLUDED.timeline,
      overall_score = 0,
      security_score = 0,
      compliance_score = 0,
      vendor_reputation_score = 0
  `, [
    PASSPORT_ID,
    tenantId,
    CLIENT_ID,
    sourceCommit,
    today,
    sourceDigest,
    packageJson.license || 'Unspecified',
    'Source inventory and package-lock SBOM recorded. Trust scores remain unavailable until qualifying evidence is collected.',
    JSON.stringify(observedComponents),
    JSON.stringify([{
      date: today,
      event: 'Source inventory registered',
      user: TARGET_EMAIL,
      details: `Recorded Git commit ${sourceCommit} and ${observedComponents.length} package-lock components. No GitHub connection was claimed.`,
    }]),
  ]);

  const activeJob = await client.query(`
    SELECT id FROM agent_jobs
    WHERE tenant_id = $1 AND passport_id = $2 AND job_type = 'osv_manifest_scan'
      AND status IN ('Pending', 'Running')
    LIMIT 1
  `, [tenantId, PASSPORT_ID]);

  let jobId = activeJob.rows[0]?.id as string | undefined;
  if (!jobId) {
    jobId = `job-${crypto.randomUUID()}`;
    await client.query(`
      INSERT INTO agent_jobs (
        id, tenant_id, agent_id, passport_id, job_type, status, progress
      ) VALUES ($1, $2, 'osv-worker', $3, 'osv_manifest_scan', 'Pending', 0)
    `, [jobId, tenantId, PASSPORT_ID]);
    await client.query(`
      INSERT INTO agent_logs (job_id, agent_id, message, level)
      VALUES ($1, 'osv-worker',
        'OSV manifest scan job persisted for the registered SPR source inventory.',
        'Info')
    `, [jobId]);
  }

  await client.query('COMMIT');
  console.log(JSON.stringify({
    tenantId,
    clientId: CLIENT_ID,
    passportId: PASSPORT_ID,
    sourceCommit,
    sourceDigest,
    componentCount: observedComponents.length,
    jobId,
    githubConnection: 'pending',
  }));
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
