import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * AES-256-GCM ile şifreleme
 */
export function encrypt(text: string, secretKey: string): string {
  // Key'i 32 byte'a dönüştür (SHA-256)
  const key = crypto.createHash('sha256').update(secretKey).digest();

  // Random IV oluştur
  const iv = crypto.randomBytes(IV_LENGTH);

  // Cipher oluştur
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Şifrele
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Auth tag al
  const authTag = cipher.getAuthTag();

  // IV + AuthTag + Encrypted data birleştir
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * AES-256-GCM ile şifre çözme
 */
export function decrypt(encryptedText: string, secretKey: string): string {
  // Key'i 32 byte'a dönüştür (SHA-256)
  const key = crypto.createHash('sha256').update(secretKey).digest();

  // Parçaları ayır
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  // Decipher oluştur
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Şifre çöz
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
