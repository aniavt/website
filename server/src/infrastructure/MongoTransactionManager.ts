import type { Connection } from "mongoose";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { mongoSessionStore } from "./shared/mongoSessionStore";

export class MongoTransactionManager implements TransactionManager {
    constructor(private readonly connection: Connection) {}

    async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
        const session = await this.connection.startSession();
        try {
            let result!: T;
            await session.withTransaction(async () => {
                result = await mongoSessionStore.run(session, fn);
            });
            return result;
        } finally {
            await session.endSession();
        }
    }
}
