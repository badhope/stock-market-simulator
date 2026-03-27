import crypto from 'crypto';
import CryptoJS from 'crypto-js';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

export function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

export function encrypt(text: string, key: string): { iv: string; data: string; tag: string } {
  const derivedKey = crypto.scryptSync(key, 'salt', KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    data: encrypted,
    tag: tag.toString('hex')
  };
}

export function decrypt(encrypted: { iv: string; data: string; tag: string }, key: string): string {
  const derivedKey = crypto.scryptSync(key, 'salt', KEY_LENGTH);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    derivedKey,
    Buffer.from(encrypted.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
  
  let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}
