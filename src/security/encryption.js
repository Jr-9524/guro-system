// src/security/encryption.js
import CryptoJS from "crypto-js";

class EncryptionService {
  static generateKey() {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  static encrypt(data, key) {
    try {
      const iv = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        CryptoJS.enc.Hex.parse(key),
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      return {
        ciphertext: encrypted.toString(),
        iv: iv.toString(),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`, { cause: error });
    }
  }

  static decrypt(ciphertext, key, iv) {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        ciphertext,
        CryptoJS.enc.Hex.parse(key),
        {
          iv: CryptoJS.enc.Hex.parse(iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`, { cause: error });
    }
  }
}

export default EncryptionService;
