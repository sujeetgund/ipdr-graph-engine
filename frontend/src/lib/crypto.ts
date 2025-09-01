
'use server';

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('Invalid ENCRYPTION_KEY. It must be a 64-character hex string (32 bytes).');
}

const key = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plaintext to encrypt.
 * @returns A string containing the IV, auth tag, and encrypted data, hex-encoded.
 */
export async function encrypt(text: string): Promise<string> {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Combine IV, auth tag, and encrypted data into a single buffer
        const combined = Buffer.concat([iv, authTag, encrypted]);

        return combined.toString('hex');
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Could not encrypt data.');
    }
}

/**
 * Decrypts an AES-256-GCM encrypted hex string.
 * @param encryptedHex The hex-encoded encrypted string (IV + auth tag + data).
 * @returns The original plaintext string.
 */
export async function decrypt(encryptedHex: string): Promise<string> {
    try {
        const combined = Buffer.from(encryptedHex, 'hex');

        // Extract IV, auth tag, and encrypted data
        const iv = combined.slice(0, IV_LENGTH);
        const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Could not decrypt data. The encryption key may be incorrect or the data may be corrupted.');
    }
}
