import type { IdGenerator } from "@domain/services/IdGenerator";


export class CryptoIdGenerator implements IdGenerator {
    generateUUID(): string {
        return crypto.randomUUID();
    }
}