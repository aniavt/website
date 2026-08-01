import { NavItems, type NavItemsLastAction } from "@domain/entities/NavItems";
import type { NavItemsRepository, NavItemsFindAllOptions } from "@domain/repositories/NavItemsRepository";
import { upsertById } from "@infrastructure/shared/upsertById";
import { SOFT_DELETE_LAST_ACTIONS } from "@ania/domain-shared/soft-delete";
import mongoose from "mongoose";

const navItemsSchema = new mongoose.Schema({
   id: { type: String, required: true, unique: true },
   title: { type: String, required: true },
   path : { type: String, required: true },
   position: { type: Number, required: true },
   active: { type: Boolean, required: true },
   lastAction: {
      type: String,
      required: true,
      enum: [...SOFT_DELETE_LAST_ACTIONS],
   },
   createdAt: { type: Date, required: true },
   updatedAt: { type: Date, required: true },
});

interface NavItemsDocument {
   id: string;
   title: string;
   path: string;
   position: number;
   active: boolean;
   lastAction: NavItemsLastAction;
   createdAt: Date;
   updatedAt: Date;
}

navItemsSchema.index({ active: 1 });

function toDocument(entity: NavItems): NavItemsDocument {
   return {
      id: entity.id,
      title: entity.title,
      path: entity.path,
      position: entity.position,
      active: entity.active,
      lastAction: entity.lastAction,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
   };
}

export class MongoDbNavItemsRepository implements NavItemsRepository {
   private readonly model: mongoose.Model<NavItemsDocument>;

   constructor(private readonly mongoClient: mongoose.Connection) {
      this.model = this.mongoClient.model<NavItemsDocument>("NavItems", navItemsSchema);
   }

   async save(entity: NavItems): Promise<void> {
      await upsertById(this.model, toDocument(entity));
   }

   async findById(id: string): Promise<NavItems | null> {
      const doc = await this.model.findOne({ id });
      return doc ? NavItems.fromPersistence(doc) : null;
   }

   async findAll(options?: NavItemsFindAllOptions): Promise<NavItems[]> {
      const query: { active?: boolean } = {};
      if (options?.active !== undefined) {
         query.active = options.active;
      }
      const docs = await this.model.find(query).exec();
      return docs.map((doc) => NavItems.fromPersistence(doc));
   }
}
