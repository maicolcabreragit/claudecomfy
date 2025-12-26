/**
 * Encryption utilities for API keys
 * Uses AES-256-GCM for secure encryption/decryption
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment or generate a default
 * In production, ENCRYPTION_KEY should be a 32-byte hex string
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (keyHex && keyHex.length === 64) {
    return Buffer.from(keyHex, "hex");
  }
  // Fallback for development - NOT SECURE FOR PRODUCTION
  console.warn(
    "[Encryption] Using default key - set ENCRYPTION_KEY in production!"
  );
  return Buffer.from(
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "hex"
  );
}

export interface EncryptedData {
  encrypted: string; // Base64 encoded
  iv: string; // Base64 encoded
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export function encryptApiKey(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Append auth tag to encrypted data
  const authTag = cipher.getAuthTag();
  const encryptedWithTag = Buffer.concat([
    Buffer.from(encrypted, "base64"),
    authTag,
  ]).toString("base64");

  return {
    encrypted: encryptedWithTag,
    iv: iv.toString("base64"),
  };
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 */
export function decryptApiKey(encryptedData: string, iv: string): string {
  const key = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, "base64");
  const encryptedBuffer = Buffer.from(encryptedData, "base64");

  // Extract auth tag from end of encrypted data
  const authTag = encryptedBuffer.subarray(-AUTH_TAG_LENGTH);
  const encryptedContent = encryptedBuffer.subarray(0, -AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedContent);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Check if a key looks like an API key (basic validation)
 */
export function isValidApiKeyFormat(key: string): boolean {
  // OpenRouter keys start with "sk-or-"
  // Anthropic keys start with "sk-ant-"
  return /^sk-(or|ant)-[a-zA-Z0-9-_]{20,}$/.test(key);
}
