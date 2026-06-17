const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { app, safeStorage } = require("electron");

const PREFIX = "enc:v1";
const SAFE_KEY_PREFIX = "safe:v1:";
let cachedKey = null;

function getKeyPath() {
  const dir = path.join(app.getPath("userData"), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return path.join(dir, "encryption.key");
}

function getEncryptionKey() {
  if (cachedKey) return cachedKey;

  const keyPath = getKeyPath();
  if (fs.existsSync(keyPath)) {
    cachedKey = readStoredKey(keyPath);
    protectStoredKey(keyPath, cachedKey);
    return cachedKey;
  }

  cachedKey = crypto.randomBytes(32);
  writeStoredKey(keyPath, cachedKey);
  return cachedKey;
}

function canUseSafeStorage() {
  try {
    return safeStorage?.isEncryptionAvailable();
  } catch {
    return false;
  }
}

function readStoredKey(keyPath) {
  const stored = fs.readFileSync(keyPath, "utf8").trim();

  if (stored.startsWith(SAFE_KEY_PREFIX) && !canUseSafeStorage()) {
    throw new Error("Stored encryption key requires OS keychain access.");
  }

  if (stored.startsWith(SAFE_KEY_PREFIX) && canUseSafeStorage()) {
    return Buffer.from(
      safeStorage.decryptString(
        Buffer.from(stored.slice(SAFE_KEY_PREFIX.length), "base64"),
      ),
      "hex",
    );
  }

  return Buffer.from(stored, "hex");
}

function writeStoredKey(keyPath, key) {
  const value = canUseSafeStorage()
    ? `${SAFE_KEY_PREFIX}${safeStorage
        .encryptString(key.toString("hex"))
        .toString("base64")}`
    : key.toString("hex");

  fs.writeFileSync(keyPath, value, { mode: 0o600 });
}

function protectStoredKey(keyPath, key) {
  if (!canUseSafeStorage()) return;

  const stored = fs.readFileSync(keyPath, "utf8").trim();
  if (!stored.startsWith(SAFE_KEY_PREFIX)) {
    writeStoredKey(keyPath, key);
  }
}

function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(`${PREFIX}:`);
}

function encryptValue(value) {
  if (value === null || value === undefined || value === "") return value;
  if (isEncrypted(value)) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

function decryptValue(value) {
  if (!isEncrypted(value)) return value;

  const [, , iv, tag, encrypted] = value.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

module.exports = {
  encryptValue,
  decryptValue,
};
