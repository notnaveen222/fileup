import crypto from "node:crypto";

/**
 * Dev-only signing secret. In the real build this becomes an env var (and
 * real signed URLs come straight from the storage provider, e.g. Supabase
 * Storage / R2's own signed-URL APIs) — this file only exists so the local
 * prototype can demonstrate the same "never a public/permanent URL" shape.
 */
const SECRET = process.env.STORAGE_SIGNING_SECRET ?? "clientcollect-prototype-dev-secret";

const DEFAULT_TTL_SECONDS = 60;

function sign(key: string, exp: number): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${key}:${exp}`)
    .digest("hex");
}

export function signKey(key: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const exp = Date.now() + ttlSeconds * 1000;
  const sig = sign(key, exp);
  return { exp, sig };
}

export function verifyKey(key: string, exp: number, sig: string): boolean {
  if (Number.isNaN(exp) || Date.now() > exp) return false;
  const expected = sign(key, exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
