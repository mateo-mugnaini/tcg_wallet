import crypto from "crypto";

/* ====================================
          HASHEAR TOKEN
==================================== */
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
