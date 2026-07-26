import crypto from 'node:crypto';

const PREFIX = 'enc:v1';

function encryptionKey() {
  const encoded = process.env.MFA_ENCRYPTION_KEY?.trim();
  if (!encoded) throw new Error('MFA_ENCRYPTION_KEY_MISSING');
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('MFA_ENCRYPTION_KEY_INVALID');
  return key;
}

export function isEncryptedMfaSecret(value: string) {
  return value.startsWith(`${PREFIX}:`);
}

export function encryptMfaSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

export function decryptMfaSecret(envelope: string) {
  const [marker, version, ivEncoded, tagEncoded, ciphertextEncoded, extra] =
    envelope.split(':');
  if (
    marker !== 'enc' ||
    version !== 'v1' ||
    !ivEncoded ||
    !tagEncoded ||
    !ciphertextEncoded ||
    extra !== undefined
  ) {
    throw new Error('MFA_SECRET_NOT_ENCRYPTED');
  }
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      encryptionKey(),
      Buffer.from(ivEncoded, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextEncoded, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error('MFA_SECRET_DECRYPTION_FAILED');
  }
}
