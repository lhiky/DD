import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  inspectTree,
  normalizeCycloneDx,
  validateArchiveEntries,
} from '../src/workers/osv-worker.ts';
import { createRepositoryScanSchema } from '../src/middleware/validation.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory =>
    rm(directory, { recursive: true, force: true })
  ));
});

describe('repository scan request boundary', () => {
  it('accepts structured GitHub coordinates without a local path or credential', () => {
    const result = createRepositoryScanSchema.safeParse({
      provider: 'github',
      owner: 'example',
      repository: 'project',
      ref: 'main',
      subdirectory: 'apps/api',
      connectionId: 'connection-1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects path traversal and secret-bearing extra fields', () => {
    expect(createRepositoryScanSchema.safeParse({
      provider: 'github',
      owner: 'example',
      repository: 'project',
      subdirectory: '../../outside',
      connectionId: 'connection-1',
    }).success).toBe(false);
    expect(createRepositoryScanSchema.safeParse({
      provider: 'github',
      owner: 'example',
      repository: 'project',
      connectionId: 'connection-1',
      accessToken: 'must-not-be-accepted',
    }).success).toBe(false);
  });
});

describe('safe manifest discovery', () => {
  it('discovers nested and monorepo manifests while ignoring dependency/build trees', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'spr-manifest-test-'));
    temporaryDirectories.push(root);
    await mkdir(path.join(root, 'apps', 'api'), { recursive: true });
    await mkdir(path.join(root, 'packages', 'web'), { recursive: true });
    await mkdir(path.join(root, 'node_modules', 'ignored'), { recursive: true });
    await mkdir(path.join(root, 'dist'), { recursive: true });
    await writeFile(path.join(root, 'apps', 'api', 'requirements.txt'), 'flask==3.0.0');
    await writeFile(path.join(root, 'packages', 'web', 'package.json'), '{}');
    await writeFile(path.join(root, 'packages', 'web', 'package-lock.json'), '{}');
    await writeFile(path.join(root, 'node_modules', 'ignored', 'package.json'), '{}');
    await writeFile(path.join(root, 'dist', 'package.json'), '{}');

    await expect(inspectTree(root)).resolves.toEqual([
      'apps/api/requirements.txt',
      'packages/web/package-lock.json',
      'packages/web/package.json',
    ]);
  });

  it('fails closed when no supported manifest exists', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'spr-no-manifest-test-'));
    temporaryDirectories.push(root);
    await writeFile(path.join(root, 'README.md'), 'No dependency manifest');
    await expect(inspectTree(root)).rejects.toThrow('NO_SUPPORTED_MANIFESTS');
  });

  it('rejects archive traversal and absolute entries', () => {
    expect(() => validateArchiveEntries(['root/package.json', '../escape'])).toThrow('REPOSITORY_PATH_INVALID');
    expect(() => validateArchiveEntries(['C:/escape'])).toThrow('REPOSITORY_PATH_INVALID');
  });
});

describe('CycloneDX validation and normalization', () => {
  it('retains versions and purls and deterministically removes duplicates', () => {
    const normalized = normalizeCycloneDx({
      bomFormat: 'CycloneDX',
      components: [
        { name: 'lodash', version: '4.17.20', purl: 'pkg:npm/lodash@4.17.20' },
        { name: 'lodash', version: '4.17.20', purl: 'pkg:npm/lodash@4.17.20' },
      ],
    });
    expect(normalized).toEqual([{
      name: 'lodash',
      version: '4.17.20',
      ecosystem: 'npm',
      purl: 'pkg:npm/lodash@4.17.20',
    }]);
  });

  it('retains an unknown version as unknown and rejects invalid or empty SBOMs', () => {
    expect(normalizeCycloneDx({
      bomFormat: 'CycloneDX',
      components: [{ name: 'unknown-package', purl: 'pkg:generic/unknown-package' }],
    })[0]).not.toHaveProperty('version');
    expect(() => normalizeCycloneDx({ components: [] })).toThrow('SBOM_INVALID');
    expect(() => normalizeCycloneDx({ bomFormat: 'CycloneDX', components: [] })).toThrow('SBOM_EMPTY');
    expect(() => normalizeCycloneDx({
      bomFormat: 'CycloneDX',
      components: [{ name: '' }],
    })).toThrow('SBOM_INVALID');
  });
});
