import EncryptionService from "../security/encryption";

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize(encryptionKey) {
    this.encryptionKey = encryptionKey;
    this.isInitialized = true;
    console.log("Database initialized (using localStorage for development");
    return true;
  }

  save(key, data) {
    if (!this.isInitialized) throw new Error("Database not initialized");
    const encrypted = EncryptionService.encrypt(data, this.encryptionKey);
    localStorage.setItem(key, JSON.stringify(encrypted));
  }

  // Load data from localStorage
  load(key) {
    if (!this.isInitialized) throw new Error("Database not initialized");
    const encrypted = JSON.parse(localStorage.getItem(key) || "null");
    if (!encrypted) return null;
    return EncryptionService.decrypt(
      encrypted.ciphertext,
      this.encryptionKey,
      encrypted.iv,
    );
  }

  // Remove data
  remove(key) {
    localStorage.removeItem(key);
  }

  // Clear all data
  clear() {
    localStorage.clear();
  }

  close() {
    this.isInitialized = false;
    console.log("Database connection closed");
  }
}

export default new DatabaseConnection();
