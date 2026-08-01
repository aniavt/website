import { FaqItem, type FaqItemLastAction } from "@domain/entities/FaqItem";
import type { FaqItemRepository, FaqItemFindAllOptions } from "@domain/repositories/FaqItemRepository";
import { SOFT_DELETE_LAST_ACTIONS } from "@ania/domain-shared/soft-delete";
import { upsertById } from "@infrastructure/shared/upsertById";
import { mongoSessionOption } from "@infrastructure/shared/mongoSessionStore";
import mongoose from "mongoose";

const faqItemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    queryId: { type: String, required: true },
    answerId: { type: String, required: true },
    isActive: { type: Boolean, required: true },
    lastAction: { type: String, required: true, enum: [...SOFT_DELETE_LAST_ACTIONS] },
});

interface FaqItemDocument {
    id: string;
    queryId: string;
    answerId: string;
    isActive: boolean;
    lastAction: FaqItemLastAction;
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
        await upsertById(this.model, toDocument(entity));
    }

    async findById(id: string): Promise<FaqItem | null> {
        const doc = await this.model.findOne({ id }, null, mongoSessionOption());
        return doc ? FaqItem.fromPersistence(doc) : null;
    }

    async findAll(options?: FaqItemFindAllOptions): Promise<FaqItem[]> {
        const query: { isActive?: boolean } = {};
        if (options?.isActive !== undefined) {
            query.isActive = options.isActive;
        }
        const docs = await this.model.find(query, null, mongoSessionOption()).exec();
        return docs.map((d) => FaqItem.fromPersistence(d));
    }
}
