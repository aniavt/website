import type { SecureHasher } from "@domain/services/SecureHasher";

/** Deterministic hasher: hash is `hash:<password>`; verify checks exact match. */
export class FakeSecureHasher implements SecureHasher {
  async hash(password: string): Promise<string> {
    return `hash:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hash:${password}`;
  }
}
