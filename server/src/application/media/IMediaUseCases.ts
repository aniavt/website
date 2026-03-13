import type { UploadFileUseCase } from "@application/media/use-cases/UploadFile";
import type { DeleteFileUseCase } from "@application/media/use-cases/DeleteFile";
import type { GetFileUrlUseCase } from "@application/media/use-cases/GetFileUrl";

export interface IMediaUseCases {
    uploadFile: UploadFileUseCase;
    deleteFile: DeleteFileUseCase;
    getFileUrl: GetFileUrlUseCase;
}

