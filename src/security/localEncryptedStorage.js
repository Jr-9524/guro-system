import EncryptionService from "./encryption";
import { parseJson } from "../utils/jsonUtils";

const LOCAL_ENCRYPTION_KEY = "guro:local-encryption-key";

const getLocalEncryptionKey = () => {
  let key = localStorage.getItem(LOCAL_ENCRYPTION_KEY);
  if (!key) {
    key = EncryptionService.generateKey();
    localStorage.setItem(LOCAL_ENCRYPTION_KEY, key);
  }

  return key;
};

export const loadEncryptedLocal = (key, fallback) => {
  const stored = parseJson(localStorage.getItem(key), null);
  if (!stored) return fallback;

  if (stored.ciphertext && stored.iv) {
    return EncryptionService.decrypt(
      stored.ciphertext,
      getLocalEncryptionKey(),
      stored.iv,
    );
  }

  return stored;
};

export const saveEncryptedLocal = (key, value) => {
  const encrypted = EncryptionService.encrypt(value, getLocalEncryptionKey());
  localStorage.setItem(key, JSON.stringify(encrypted));
  return value;
};
