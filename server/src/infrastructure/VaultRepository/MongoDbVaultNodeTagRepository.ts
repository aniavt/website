import { VaultNodeTagEntity } from "@domain/entities/Vault";
import type { VaultNodeTagRepository } from "@domain/repositories/VaultRepository";
import mongoose from "mongoose";

const vaultNodeTagSchema = new mongoose.Schema({
    nodeId: { type: String, required: true },
    tagId: { type: String, required: true },
});

interface VaultNodeTagDocument {
    nodeId: string;
    tagId: string;
}

vaultNodeTagSchema.index({ nodeId: 1, tagId: 1 }, { unique: true });

function toDocument(tag: VaultNodeTagEntity): VaultNodeTagDocument {
    return {
        nodeId: tag.nodeId,
        tagId: tag.tagId,
    };
}

function toEntity(doc: VaultNodeTagDocument): VaultNodeTagEntity {
    return new VaultNodeTagEntity({
        nodeId: doc.nodeId,
        tagId: doc.tagId,
    });
}

export class MongoDbVaultNodeTagRepository implements VaultNodeTagRepository {
    private readonly model: mongoose.Model<VaultNodeTagDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<VaultNodeTagDocument>("VaultNodeTag", vaultNodeTagSchema);
    }

    async add(tag: VaultNodeTagEntity): Promise<void> {
        const doc = toDocument(tag);
        await this.model.updateOne(
            { nodeId: doc.nodeId, tagId: doc.tagId },
            { $setOnInsert: doc },
            { upsert: true },
        ).exec();
    }

    async remove(nodeId: string, tagId: string): Promise<void> {
        await this.model.deleteOne({ nodeId, tagId }).exec();
    }

    async findByNodeId(nodeId: string): Promise<VaultNodeTagEntity[]> {
        const docs = await this.model.find({ nodeId }).exec();
        return docs.map((d) => toEntity(d));
    }

    async findByTagId(tagId: string): Promise<VaultNodeTagEntity[]> {
        const docs = await this.model.find({ tagId }).exec();
        return docs.map((d) => toEntity(d));
    }

    async deleteByTagId(tagId: string): Promise<void> {
        await this.model.deleteMany({ tagId }).exec();
    }
}

