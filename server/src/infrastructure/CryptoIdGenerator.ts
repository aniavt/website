import type { IdGenerator } from "@domain/services/IdGenerator";


export class CryptoIdGenerator implements IdGenerator {
    generateUserId(): string {
        return crypto.randomUUID();
    }

    generateFaqTextId(): string {
        return crypto.randomUUID();
    }

    generateFaqItemId(): string {
        return crypto.randomUUID();
    }

    generateFaqHistoryId(): string {
        return crypto.randomUUID();
    }
}