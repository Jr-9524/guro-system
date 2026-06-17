// src/security/hashing.js
import CryptoJS from "crypto-js";

class HashingService {
  static async hashPassword(password) {
    // Use PBKDF2 for password hashing (browser-compatible)
    const salt = CryptoJS.lib.WordArray.random(16).toString();
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();

    return `${salt}:${hash}`;
  }

  static async comparePassword(password, storedHash) {
    const [salt, hash] = storedHash.split(":");
    const newHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();

    return hash === newHash;
  }

  static hashData(data) {
    return CryptoJS.SHA256(data).toString();
  }

  static generateToken(length = 32) {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
}

export default HashingService;
