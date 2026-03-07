import { FaqItem } from "@domain/entities/FaqItem";
import type { FaqItemRepository, FaqItemFindAllOptions } from "@domain/repositories/FaqItemRepository";
import mongoose from "mongoose";

const faqItemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    queryId: { type: String, required: true },
    answerId: { type: String, required: true },
    isActive: { type: Boolean, required: true },
    lastAction: { type: String, required: true, enum: ["created", "updated", "deleted", "restore"] },
});

interface FaqItemDocument {
    id: string;
    queryId: string;
    answerId: string;
    isActive: boolean;
    lastAction: "created" | "updated" | "deleted" | "restore";
}

faqItemSchema.index({ isActive: 1 });

function toDocument(entity: FaqItem): FaqItemDocument {
    return {
        id: entity.id,
        queryId: entity.queryId,
        answerId: entity.answerId,
        isActive: entity.isActive,
        lastAction: entity.lastAction,
    };
}

export class MongoDbFaqItemRepository implements FaqItemRepository {
    private readonly model: mongoose.Model<FaqItemDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<FaqItemDocument>("FaqItem", faqItemSchema);
    }

    async save(entity: FaqItem): Promise<void> {
        const doc = toDocument(entity);
        const existing = await this.model.findOne({ id: entity.id });
        if (existing) {
            await this.model.updateOne({ id: entity.id }, { $set: doc });
        } else {
            await this.model.create(doc);
        }
    }

    async findById(id: string): Promise<FaqItem | null> {
        const doc = await this.model.findOne({ id });
        return doc ? FaqItem.fromPersistence(doc) : null;
    }

    async findAll(options?: FaqItemFindAllOptions): Promise<FaqItem[]> {
        const query: { isActive?: boolean } = {};
        if (options?.isActive !== undefined) {
            query.isActive = options.isActive;
        }
        const docs = await this.model.find(query).exec();
        return docs.map((d) => FaqItem.fromPersistence(d));
    }
}
