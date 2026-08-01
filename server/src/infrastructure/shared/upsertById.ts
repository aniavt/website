import type { ClientSession, Model } from "mongoose";
import { getMongoSession } from "./mongoSessionStore";

export async function upsertById<T extends { id: string }>(
    model: Model<T>,
    doc: T,
    session?: ClientSession,
): Promise<void> {
    const activeSession = session ?? getMongoSession();
    const opts = activeSession ? { session: activeSession } : {};
    const existing = await model.findOne({ id: doc.id }, null, opts);
    if (existing) {
        await model.updateOne({ id: doc.id }, { $set: doc }, opts);
    } else if (activeSession) {
        await model.create([doc as Parameters<Model<T>["create"]>[0]], {
            session: activeSession,
        });
    } else {
        await model.create(doc);
    }
}
