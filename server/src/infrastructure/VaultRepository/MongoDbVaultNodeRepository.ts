import { VaultNodeEntity } from "@domain/entities/Vault";
import type { VaultNodeRepository } from "@domain/repositories/VaultRepository";
import mongoose from "mongoose";

const vaultNodeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    parentId: { type: String, required: false },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ["folder", "file"] },
    createdAt: { type: Date, required: false },
    thumbnailId: { type: String, required: false },
    isPublic: { type: Boolean, required: true, default: false },
});

interface VaultNodeDocument {
    id: string;
    parentId: string | null;
    name: string;
    type: "folder" | "file";
    createdAt: Date | null;
    thumbnailId: string | null;
    isPublic: boolean;
}

vaultNodeSchema.index({ parentId: 1 });
vaultNodeSchema.index({ parentId: 1, name: 1 }, { unique: true });

function toDocument(node: VaultNodeEntity): VaultNodeDocument {
    return {
        id: node.id,
        parentId: node.parentId,
        name: node.name,
        type: node.type,
        createdAt: node.createdAt,
        thumbnailId: node.thumbnailId,
        isPublic: node.isPublic,
    };
}

function toEntity(doc: VaultNodeDocument): VaultNodeEntity {
    return new VaultNodeEntity({
        id: doc.id,
        parentId: doc.parentId,
        name: doc.name,
        type: doc.type,
        createdAt: doc.createdAt,
        thumbnailId: doc.thumbnailId,
        isPublic: doc.isPublic ?? false,
    });
}

export class MongoDbVaultNodeRepository implements VaultNodeRepository {
    private readonly model: mongoose.Model<VaultNodeDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<VaultNodeDocument>("VaultNode", vaultNodeSchema);
    }

    async save(node: VaultNodeEntity): Promise<void> {
        const doc = toDocument(node);
        const existing = await this.model.findOne({ id: node.id });
        if (existing) {
            await this.model.updateOne({ id: node.id }, { $set: doc });
        } else {
            await this.model.create(doc);
        }
    }

    async findById(id: string): Promise<VaultNodeEntity | null> {
        const doc = await this.model.findOne({ id }).exec();
        return doc ? toEntity(doc) : null;
    }

    async findByParentAndName(parentId: string | null, name: string): Promise<VaultNodeEntity | null> {
        const doc = await this.model.findOne({ parentId, name }).exec();
        return doc ? toEntity(doc) : null;
    }

    async findChildren(parentId: string | null): Promise<VaultNodeEntity[]> {
        const docs = await this.model.find({ parentId }).exec();
        return docs.map((d) => toEntity(d));
    }

    async delete(id: string): Promise<void> {
        await this.model.deleteOne({ id }).exec();
    }
}

