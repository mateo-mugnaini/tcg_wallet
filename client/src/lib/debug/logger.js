const debugEnabled = Boolean(
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_COLLECTION_VALUE === "true",
);

export function debugLog(message, metadata = {}) {
  if (!debugEnabled) return;

  console.debug(`[TCG Wallet] ${message}`, metadata);
}
