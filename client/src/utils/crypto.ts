import CryptoJS from "crypto-js";

const FRONTEND_KEY =
  import.meta.env.VITE_FRONTEND_ENCRYPTION_KEY || "frontend_dev_key_change_me";

const DERIVED_KEY = CryptoJS.SHA256(FRONTEND_KEY);
const FIXED_IV    = CryptoJS.MD5(FRONTEND_KEY); 

export function encryptData(plainText: string): string {
  return CryptoJS.AES.encrypt(plainText, DERIVED_KEY, {
    iv:      FIXED_IV,
    mode:    CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

export function decryptData(cipherText: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, DERIVED_KEY, {
      iv:      FIXED_IV,
      mode:    CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error("Decryption produced empty string");
    return decrypted;
  } catch {
    console.error("[decryptData] Failed to decrypt:", cipherText);
    return "";
  }
}

export function encryptObject<T extends Record<string, string>>(
  obj: T
): Record<keyof T, string> {
  const result = {} as Record<keyof T, string>;
  for (const key in obj) {
    result[key] = encryptData(obj[key]);
  }
  return result;
}

export function decryptObject<T extends Record<string, string>>(
  obj: T
): Record<keyof T, string> {
  const result = {} as Record<keyof T, string>;
  for (const key in obj) {
    result[key] = decryptData(obj[key]);
  }
  return result;
}