import { Anime, type AnimeLastAction } from "@domain/entities/Anime";
import { ANIME_STATUSES, type AnimeStatus } from "@ania/domain-shared/anime";
import type { AnimeRepository, AnimeFindAllOptions } from "@domain/repositories/AnimeRepository";
import { upsertById } from "@infrastructure/shared/upsertById";
import { SOFT_DELETE_LAST_ACTIONS } from "@ania/domain-shared/soft-delete";
import mongoose from "mongoose";

const animeSchema = new mongoose.Schema({
   id: { type: String, required: true, unique: true },
   title: { type: String, required: true },
   description: { type: String },
   coverImageURL: { type: String },
   genre: { type: String, required: true },
   status: { type: String, required: true, enum: [...ANIME_STATUSES] },
   active: { type: Boolean, required: true },
   lastAction: {
      type: String,
      required: true,
      enum: [...SOFT_DELETE_LAST_ACTIONS],
   },
   createdAt: { type: Date, required: true },
   updatedAt: { type: Date, required: true },
});

interface AnimeDocument {
   id: string;
   title: string;
   description?: string;
   coverImageURL?: string;
   genre: string;
   status: AnimeStatus;
   active: boolean;
   lastAction: AnimeLastAction;
   createdAt: Date;
   updatedAt: Date;
}

animeSchema.index({ active: 1 });

function toDocument(entity: Anime): AnimeDocument {
   return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      coverImageURL: entity.coverImageURL,
      genre: entity.genre,
      status: entity.status,
      active: entity.active,
      lastAction: entity.lastAction,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
   };
}

export class MongoDbAnimeRepository implements AnimeRepository {
   private readonly model: mongoose.Model<AnimeDocument>;

   constructor(private readonly mongoClient: mongoose.Connection) {
      this.model = this.mongoClient.model<AnimeDocument>("Anime", animeSchema);
   }

   async save(entity: Anime): Promise<void> {
      await upsertById(this.model, toDocument(entity));
   }

   async findById(id: string): Promise<Anime | null> {
      const doc = await this.model.findOne({ id });
      return doc ? Anime.fromPersistence(doc) : null;
   }

   async findAll(options?: AnimeFindAllOptions): Promise<Anime[]> {
      const query: { active?: boolean } = {};
      if (options?.active !== undefined) {
         query.active = options.active;
      }
      const docs = await this.model.find(query).exec();
      return docs.map((doc) => Anime.fromPersistence(doc));
   }
}
