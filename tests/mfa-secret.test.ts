import { afterEach, describe, expect, it } from 'vitest';
import {
  decryptMfaSecret,
  encryptMfaSecret,
  isEncryptedMfaSecret,
} from '../src/utils/mfa-secret.ts';

const previousKey = process.env.MFA_ENCRYPTION_KEY;

afterEach(() => {
  if (previousKey === undefined) delete process.env.MFA_ENCRYPTION_KEY;
  else process.env.MFA_ENCRYPTION_KEY = previousKey;
});

describe('MFA secret encryption', () => {
  it('round-trips through an authenticated AES-256-GCM envelope', () => {
    process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const encrypted = encryptMfaSecret('JBSWY3DPEHPK3PXP');
    expect(isEncryptedMfaSecret(encrypted)).toBe(true);
    expect(encrypted).not.toContain('JBSWY3DPEHPK3PXP');
    expect(decryptMfaSecret(encrypted)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('fails closed when ciphertext is modified', () => {
    process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 8).toString('base64');
    const encrypted = encryptMfaSecret('JBSWY3DPEHPK3PXP');
    const parts = encrypted.split(':');
    const ciphertext = Buffer.from(parts[4], 'base64url');
    ciphertext[0] ^= 0x01;
    parts[4] = ciphertext.toString('base64url');
    expect(() => decryptMfaSecret(parts.join(':')))
      .toThrow('MFA_SECRET_DECRYPTION_FAILED');
  });

  it('rejects missing and invalid keys', () => {
    delete process.env.MFA_ENCRYPTION_KEY;
    expect(() => encryptMfaSecret('secret')).toThrow('MFA_ENCRYPTION_KEY_MISSING');
    process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(16).toString('base64');
    expect(() => encryptMfaSecret('secret')).toThrow('MFA_ENCRYPTION_KEY_INVALID');
  });
});
