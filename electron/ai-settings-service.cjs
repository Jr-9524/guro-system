const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { encryptValue, decryptValue } = require("./encryption.cjs");

const PROVIDER_PRESETS = Object.freeze({
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  custom: { baseUrl: "", model: "" },
});
const SETTINGS_FILE = "ai-provider-settings.json";

function getSettingsPath() {
  const directory = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, SETTINGS_FILE);
}

function readSavedSettings() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {
    throw new Error("Saved AI provider settings could not be read.");
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function validateSettings(input = {}, { requireApiKey = true } = {}) {
  const provider = String(input.provider || "").trim().toLowerCase();
  if (!Object.hasOwn(PROVIDER_PRESETS, provider)) {
    throw new Error("Choose Groq, OpenAI, or Custom provider.");
  }
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  let parsedUrl;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error("Enter a valid AI provider base URL.");
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("AI provider URL must use HTTP or HTTPS.");
  }
  const model = String(input.model || "").trim();
  if (!model) throw new Error("Model is required.");
  const temperature = Number(input.temperature);
  if (!Number.isFinite(temperature) || temperature < 0 || temperature > 1) {
    throw new Error("Temperature must be between 0 and 1.");
  }
  const apiKey = String(input.apiKey || "").trim();
  if (requireApiKey && !apiKey) throw new Error("API key is required.");
  return { provider, baseUrl, model, temperature, apiKey };
}

function maskApiKey(apiKey) {
  const value = String(apiKey || "");
  return value ? "************" + value.slice(-4) : "";
}

function toPublicSettings(saved) {
  if (!saved?.encryptedApiKey) {
    return { configured: false, provider: "groq", ...PROVIDER_PRESETS.groq, temperature: 0.3, maskedApiKey: "", updatedAt: null };
  }
  let apiKey;
  try {
    apiKey = decryptValue(saved.encryptedApiKey);
  } catch {
    return { configured: false, provider: saved.provider, baseUrl: saved.baseUrl, model: saved.model, temperature: saved.temperature, maskedApiKey: "", updatedAt: saved.updatedAt || null };
  }
  return {
    configured: Boolean(apiKey),
    provider: saved.provider,
    baseUrl: saved.baseUrl,
    model: saved.model,
    temperature: saved.temperature,
    maskedApiKey: maskApiKey(apiKey),
    updatedAt: saved.updatedAt || null,
  };
}

function getPublicSettings() {
  return toPublicSettings(readSavedSettings());
}

function getRuntimeSettings() {
  const saved = readSavedSettings();
  if (!saved?.encryptedApiKey) return null;
  const apiKey = decryptValue(saved.encryptedApiKey);
  if (!apiKey) return null;
  return { provider: saved.provider, baseUrl: saved.baseUrl, model: saved.model, temperature: saved.temperature, apiKey };
}

function mergeWithSavedKey(input = {}) {
  const existing = getRuntimeSettings();
  const suppliedKey = String(input.apiKey || "").trim();
  return { ...input, apiKey: suppliedKey || existing?.apiKey || "" };
}

function resolveCandidateSettings(input = {}) {
  return validateSettings(mergeWithSavedKey(input), { requireApiKey: true });
}

function saveSettings(input = {}) {
  const settings = resolveCandidateSettings(input);
  const saved = {
    provider: settings.provider,
    baseUrl: settings.baseUrl,
    model: settings.model,
    temperature: settings.temperature,
    encryptedApiKey: encryptValue(settings.apiKey),
    updatedAt: new Date().toISOString(),
  };
  const settingsPath = getSettingsPath();
  const temporaryPath = settingsPath + ".tmp";
  fs.writeFileSync(temporaryPath, JSON.stringify(saved, null, 2), { mode: 0o600 });
  fs.renameSync(temporaryPath, settingsPath);
  return toPublicSettings(saved);
}

function removeSettings() {
  const settingsPath = getSettingsPath();
  if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);
  return { success: true, configured: false };
}

function isConfigured() {
  try {
    return Boolean(getRuntimeSettings());
  } catch {
    return false;
  }
}

module.exports = { PROVIDER_PRESETS, getPublicSettings, getRuntimeSettings, resolveCandidateSettings, saveSettings, removeSettings, isConfigured };
