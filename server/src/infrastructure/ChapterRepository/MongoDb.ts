import { Chapter } from "@domain/entities/Chapter";
import type { ChapterRepository } from "@domain/repositories/ChapterRepository";
import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
   id: { type: String, required: true, unique: true },
   animeId: { type: String, required: true },
   number: { type: Number, required: true },
   title: { type: String },
   videoURL: { type: String },
   coverImageURL: { type: String },
   createdAt: { type: Date, required: true },
   updatedAt: { type: Date, required: true },
});

interface ChapterDocument {
   id: string;
   animeId: string;
   number: number;
   title?: string;
   videoURL?: string;
   coverImageURL?: string;
   createdAt: Date;
   updatedAt: Date;
}

chapterSchema.index({ animeId: 1 });
chapterSchema.index({ animeId: 1, number: 1 }, { unique: true });

function toDocument(entity: Chapter): ChapterDocument {
   return {
      id: entity.id,
      animeId: entity.animeId,
      number: entity.number,
      title: entity.title,
      videoURL: entity.videoURL,
      coverImageURL: entity.coverImageURL,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
   };
}

export class MongoDbChapterRepository implements ChapterRepository {
   private readonly model: mongoose.Model<ChapterDocument>;

   constructor(private readonly mongoClient: mongoose.Connection) {
      this.model = this.mongoClient.model<ChapterDocument>("Chapter", chapterSchema);
   }

   async save(entity: Chapter): Promise<void> {
      const doc = toDocument(entity);
      const existing = await this.model.findOne({ id: entity.id });
      if (existing) {
         await this.model.updateOne({ id: entity.id }, { $set: doc });
      } else {
         await this.model.create(doc);
      }
   }

   async findById(id: string): Promise<Chapter | null> {
      const doc = await this.model.findOne({ id });
      return doc ? Chapter.fromPersistence(doc) : null;
   }

   async findByAnimeId(animeId: string): Promise<Chapter[]> {
      const docs = await this.model.find({ animeId }).exec();
      return docs.map((doc) => Chapter.fromPersistence(doc));
   }

   async delete(id: string): Promise<void> {
      await this.model.deleteOne({ id });
   }
}
