import type { IMediaUseCases } from "@application/media/IMediaUseCases";
import { UploadFileUseCase } from "@application/media/use-cases/UploadFile";
import { DeleteFileUseCase } from "@application/media/use-cases/DeleteFile";
import { GetFileUrlUseCase } from "@application/media/use-cases/GetFileUrl";
import { MongoDbFileRepository } from "@infrastructure/FileRepository/MongoDb";

import { mongoClient, mediaService } from "./infra";

export const fileRepository = new MongoDbFileRepository(mongoClient);

export const mediaUseCases: IMediaUseCases = {
    uploadFile: new UploadFileUseCase(mediaService, fileRepository),
    deleteFile: new DeleteFileUseCase(mediaService, fileRepository),
    getFileUrl: new GetFileUrlUseCase(fileRepository, mediaService),
};
