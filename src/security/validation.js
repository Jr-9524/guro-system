// src/security/validation.js
export const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .trim();
  }
  if (typeof input === "object" && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
};

export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(key) {
    this.cleanup();
    const attempts = this.attempts.get(key) || [];
    return attempts.length >= this.maxAttempts;
  }

  addAttempt(key) {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }

  getRemainingAttempts(key) {
    this.cleanup();
    const attempts = this.attempts.get(key) || [];
    return Math.max(0, this.maxAttempts - attempts.length);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const valid = attempts.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, valid);
      }
    }
  }
}
