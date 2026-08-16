const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "refreshToken",
  "authorization",
  "apiKey",
  "secret",
]);

function redact(value) {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEYS.has(key) ? "[REDACTED]" : redact(entryValue),
      ]),
    );
  }

  return value;
}

function write(level, message, metadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(metadata),
  };

  const output = JSON.stringify(entry);
  const writer = level === "error" ? console.error : console.log;
  writer(output);
}

export const logger = {
  debug: (message, metadata) => write("debug", message, metadata),
  info: (message, metadata) => write("info", message, metadata),
  warn: (message, metadata) => write("warn", message, metadata),
  error: (message, metadata) => write("error", message, metadata),
};

export { redact };
