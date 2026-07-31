import { FaqText } from "@domain/entities/FaqText";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import { upsertById } from "@infrastructure/shared/upsertById";
import { mongoSessionOption } from "@infrastructure/shared/mongoSessionStore";
import mongoose from "mongoose";

const faqTextSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    value: { type: String, required: true },
});

interface FaqTextDocument {
    id: string;
    value: string;
}

faqTextSchema.index({ value: 1 }, { unique: true });

function toDocument(entity: FaqText): FaqTextDocument {
    return { id: entity.id, value: entity.value };
}

export class MongoDbFaqTextRepository implements FaqTextRepository {
    private readonly model: mongoose.Model<FaqTextDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<FaqTextDocument>("FaqText", faqTextSchema);
    }

    async save(entity: FaqText): Promise<void> {
        await upsertById(this.model, toDocument(entity));
    }

    async findById(id: string): Promise<FaqText | null> {
        const doc = await this.model.findOne({ id }, null, mongoSessionOption());
        return doc ? FaqText.fromPersistence(doc) : null;
    }

    async findByValue(value: string): Promise<FaqText | null> {
        const doc = await this.model.findOne({ value }, null, mongoSessionOption());
        return doc ? FaqText.fromPersistence(doc) : null;
    }
}
