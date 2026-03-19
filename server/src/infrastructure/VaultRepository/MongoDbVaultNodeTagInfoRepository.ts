import { VaultNodeTagInfoEntity } from "@domain/entities/Vault";
import type { VaultNodeTagInfoRepository } from "@domain/repositories/VaultRepository";
import mongoose from "mongoose";

const vaultNodeTagInfoSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
});

interface VaultNodeTagInfoDocument {
    id: string;
    name: string;
}

function toDocument(tag: VaultNodeTagInfoEntity): VaultNodeTagInfoDocument {
    return {
        id: tag.id,
        name: tag.name,
    };
}

function toEntity(doc: VaultNodeTagInfoDocument): VaultNodeTagInfoEntity {
    return new VaultNodeTagInfoEntity({
        id: doc.id,
        name: doc.name,
    });
}

export class MongoDbVaultNodeTagInfoRepository implements VaultNodeTagInfoRepository {
    private readonly model: mongoose.Model<VaultNodeTagInfoDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<VaultNodeTagInfoDocument>("VaultNodeTagInfo", vaultNodeTagInfoSchema);
    }

    async save(tag: VaultNodeTagInfoEntity): Promise<void> {
        const doc = toDocument(tag);
        const existing = await this.model.findOne({ id: tag.id });
        if (existing) {
            await this.model.updateOne({ id: tag.id }, { $set: doc });
        } else {
            await this.model.create(doc);
        }
    }

    async findById(id: string): Promise<VaultNodeTagInfoEntity | null> {
        const doc = await this.model.findOne({ id }).exec();
        return doc ? toEntity(doc) : null;
    }

    async findAll(): Promise<VaultNodeTagInfoEntity[]> {
        const docs = await this.model.find({}).exec();
        return docs.map((d) => toEntity(d));
    }

    async findByName(name: string): Promise<VaultNodeTagInfoEntity | null> {
        const doc = await this.model.findOne({ name }).exec();
        return doc ? toEntity(doc) : null;
    }

    async deleteById(id: string): Promise<void> {
        await this.model.deleteOne({ id }).exec();
    }
}

