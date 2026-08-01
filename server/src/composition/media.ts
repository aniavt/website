import { MongoDbFileRepository } from "@infrastructure/FileRepository/MongoDb";
import { StoredMediaService } from "@infrastructure/StoredMediaService";

import { mongoClient, objectStorage } from "./infra";

export const fileRepository = new MongoDbFileRepository(mongoClient);

export const mediaService = new StoredMediaService(objectStorage, fileRepository);
