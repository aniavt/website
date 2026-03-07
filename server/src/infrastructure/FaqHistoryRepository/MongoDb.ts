import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import mongoose from "mongoose";

const faqHistorySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    faqId: { type: String, required: true },
    queryId: { type: String, required: true },
    answerId: { type: String, required: true },
    action: { type: String, required: true, enum: ["created", "updated", "deleted", "restore"] },
    by: { type: String, required: true },
    timestamp: { type: Date, required: true },
});

interface FaqHistoryDocument {
    id: string;
    faqId: string;
    queryId: string;
    answerId: string;
    action: "created" | "updated" | "deleted" | "restore";
    by: string;
    timestamp: Date;
}

faqHistorySchema.index({ faqId: 1 });

function toDocument(entry: FaqHistoryEntry): FaqHistoryDocument {
    return {
        id: entry.id,
        faqId: entry.faqId,
        queryId: entry.queryId,
        answerId: entry.answerId,
        action: entry.action,
        by: entry.by,
        timestamp: entry.timestamp,
    };
}

export class MongoDbFaqHistoryRepository implements FaqHistoryRepository {
    private readonly model: mongoose.Model<FaqHistoryDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<FaqHistoryDocument>("FaqHistory", faqHistorySchema);
    }

    async append(entry: FaqHistoryEntry): Promise<void> {
        await this.model.create(toDocument(entry));
    }

    async findByFaqId(faqId: string): Promise<FaqHistoryEntry[]> {
        const docs = await this.model.find({ faqId }).sort({ timestamp: 1 }).exec();
        return docs.map((d) => FaqHistoryEntry.fromPersistence(d));
    }
}
