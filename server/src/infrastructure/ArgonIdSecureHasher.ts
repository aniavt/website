import type { SecureHasher } from "@domain/services/SecureHasher";


export class ArgonIdSecureHasher implements SecureHasher {
    async hash(value: Bun.StringOrBuffer): Promise<string> {
        return await Bun.password.hash(value, {
            algorithm: "argon2id",
            memoryCost: 2 ** 16,
            timeCost: 2,
        });
    }
    async verify(value: Bun.StringOrBuffer, hash: Bun.StringOrBuffer): Promise<boolean> {
        return await Bun.password.verify(value, hash, "argon2id");
    }
}
