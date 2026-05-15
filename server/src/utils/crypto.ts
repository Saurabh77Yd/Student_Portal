import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

/**
 * Always produces a valid 32-byte key regardless of what is in .env
 * Uses SHA-256 hash of your key string → always exactly 32 bytes
 */
function getBackendKey(): Buffer {
  const rawKey = process.env.BACKEND_ENCRYPTION_KEY || "fallback_dev_key_change_in_prod";
  // SHA-256 always outputs exactly 32 bytes — solves Invalid key length forever
  return crypto.createHash("sha256").update(rawKey).digest();
}

export function encrypt(plainText: string): string {
  const key = getBackendKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf-8"),
    cipher.final(),
  ]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(cipherText: string): string {
  const key = getBackendKey();
  const [ivHex, encryptedHex] = cipherText.split(":");
  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid cipher text format. Expected <iv>:<ciphertext>");
  }
  const iv = Buffer.from(ivHex, "hex");
  const encryptedBuffer = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);
  return decrypted.toString("utf-8");
}