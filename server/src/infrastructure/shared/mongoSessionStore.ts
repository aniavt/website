import { AsyncLocalStorage } from "node:async_hooks";
import type { ClientSession } from "mongoose";

export const mongoSessionStore = new AsyncLocalStorage<ClientSession>();

export function getMongoSession(): ClientSession | undefined {
    return mongoSessionStore.getStore();
}

export function mongoSessionOption(): { session: ClientSession } | Record<string, never> {
    const session = getMongoSession();
    return session ? { session } : {};
}
