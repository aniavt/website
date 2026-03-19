import { VaultNodeSourceEntity } from "@domain/entities/Vault";
import type { VaultNodeSourceRepository } from "@domain/repositories/VaultRepository";
import mongoose from "mongoose";

const vaultNodeSourceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    nodeId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ["external", "internal"] },
    server: { type: String, required: false },
    url: { type: String, required: true },
    createdAt: { type: Date, required: true },
});

interface VaultNodeSourceDocument {
    id: string;
    nodeId: string;
    type: "external" | "internal";
    server: string | null;
    url: string;
    createdAt: Date;
}

function toDocument(source: VaultNodeSourceEntity): VaultNodeSourceDocument {
    return {
        id: source.id,
        nodeId: source.nodeId,
        type: source.type,
        server: source.server,
        url: source.url,
        createdAt: source.createdAt,
    };
}

function toEntity(doc: VaultNodeSourceDocument): VaultNodeSourceEntity {
    return new VaultNodeSourceEntity({
        id: doc.id,
        nodeId: doc.nodeId,
        type: doc.type,
        server: doc.server,
        url: doc.url,
        createdAt: doc.createdAt,
    });
}

export class MongoDbVaultNodeSourceRepository implements VaultNodeSourceRepository {
    private readonly model: mongoose.Model<VaultNodeSourceDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<VaultNodeSourceDocument>("VaultNodeSource", vaultNodeSourceSchema);
    }

    async save(source: VaultNodeSourceEntity): Promise<void> {
        const doc = toDocument(source);
        const existing = await this.model.findOne({ id: source.id });
        if (existing) {
            await this.model.updateOne({ id: source.id }, { $set: doc });
        } else {
            await this.model.create(doc);
        }
    }

    async findById(id: string): Promise<VaultNodeSourceEntity | null> {
        const doc = await this.model.findOne({ id }).exec();
        if (!doc) {
            return null;
        }
        return toEntity(doc);
    }

    async findByNodeId(nodeId: string): Promise<VaultNodeSourceEntity[]> {
        const docs = await this.model.find({ nodeId }).exec();
        return docs.map((d) => toEntity(d));
    }

    async update(source: VaultNodeSourceEntity): Promise<void> {
        // Reutiliza la lógica de upsert de save
        await this.save(source);
    }

    async deleteById(id: string): Promise<void> {
        await this.model.deleteOne({ id }).exec();
    }

    async deleteByNodeId(nodeId: string): Promise<void> {
        await this.model.deleteMany({ nodeId }).exec();
    }
}

