import crypto from "crypto";

/* ====================================
          HASHEAR TOKEN
==================================== */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/* ====================================
      GENERAR TOKEN FAMILY ID
==================================== */
export function generateTokenFamilyId() {
  return crypto.randomUUID();
}
