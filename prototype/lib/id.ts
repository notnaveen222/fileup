import { customAlphabet } from "nanoid";

const idAlphabet = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  10
);

const tokenAlphabet = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  16
);

export function newId(prefix: string): string {
  return `${prefix}_${idAlphabet()}`;
}

/** Unguessable client-link token — this string is the /u/[token] link. */
export function newToken(): string {
  return tokenAlphabet();
}
