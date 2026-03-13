import { FileEntity } from "@domain/entities/File";
import type { FileRepository } from "@domain/repositories/FileRepository";
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    isPrivate: { type: Boolean, required: true },
});

interface FileDocument {
    id: string;
    name: string;
    contentType: string;
    size: number;
    url: string;
    isPrivate: boolean;
}

function toDocument(file: FileEntity): FileDocument {
    return {
        id: file.id,
        name: file.name,
        contentType: file.contentType,
        size: file.size,
        url: file.url,
        isPrivate: file.isPrivate,
    };
}

function toEntity(doc: FileDocument): FileEntity {
    return new FileEntity({
        id: doc.id,
        name: doc.name,
        contentType: doc.contentType,
        size: doc.size,
        url: doc.url,
        isPrivate: doc.isPrivate,
    });
}

export class MongoDbFileRepository implements FileRepository {
    private readonly model: mongoose.Model<FileDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<FileDocument>("File", fileSchema);
    }

    async save(file: FileEntity): Promise<void> {
        const doc = toDocument(file);
        const existing = await this.model.findOne({ id: file.id });
        if (existing) {
            await this.model.updateOne({ id: file.id }, { $set: doc });
        } else {
            await this.model.create(doc);
        }
    }

    async findById(id: string): Promise<FileEntity | null> {
        const doc = await this.model.findOne({ id });
        return doc ? toEntity(doc) : null;
    }

    async delete(id: string): Promise<void> {
        await this.model.deleteOne({ id });
    }
}
