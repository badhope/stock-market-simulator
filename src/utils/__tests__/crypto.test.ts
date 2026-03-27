import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt, generateKey, hashPassword, generateId } from '../crypto';

describe('Crypto Utils', () => {
  describe('generateKey', () => {
    it('should generate a 64 character hex string', () => {
      const key = generateKey();
      
      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(key)).toBe(true);
    });
    
    it('should generate unique keys', () => {
      const key1 = generateKey();
      const key2 = generateKey();
      
      expect(key1).not.toBe(key2);
    });
  });
  
  describe('encrypt and decrypt', () => {
    const testKey = generateKey();
    
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'This is a secret message';
      
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(plaintext);
    });
  
    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'Same message';
      
      const encrypted1 = encrypt(plaintext, testKey);
      const encrypted2 = encrypt(plaintext, testKey);
      
      expect(encrypted1.data).not.toBe(encrypted2.data);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
    
    it('should include iv, data, and tag in encrypted result', () => {
      const plaintext = 'Test message';
      
      const encrypted = encrypt(plaintext, testKey);
      
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('tag');
    });
    
    it('should fail to decrypt with wrong key', () => {
      const plaintext = 'Secret';
      const wrongKey = generateKey();
      
      const encrypted = encrypt(plaintext, testKey);
      
      expect(() => decrypt(encrypted, wrongKey)).toThrow();
    });
  });
  
  describe('hashPassword', () => {
    it('should produce consistent hash for same password', () => {
      const password = 'mypassword';
      
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      
      expect(hash1).toBe(hash2);
    });
    
    it('should produce 64 character hex string', () => {
      const hash = hashPassword('password');
      
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });
  });
  
  describe('generateId', () => {
    it('should generate a 32 character hex string', () => {
      const id = generateId();
      
      expect(id).toHaveLength(32);
      expect(/^[0-9a-f]+$/.test(id)).toBe(true);
    });
    
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      
      expect(ids.size).toBe(100);
    });
  });
});
