import type { MediaService } from "@domain/services/MediaService";
import type { FileRepository } from "@domain/repositories/FileRepository";
import { err, ok, type Result } from "@lib/result";
import type { MediaError } from "../errors";
import type { FileDto } from "../dto";
import { toFileDto } from "../dto";

export interface UploadFileInput {
    readonly name: string;
    readonly contentType: string;
    readonly size: number;
    readonly body: Uint8Array;
    readonly isPrivate: boolean;
}

export class UploadFileUseCase {
    constructor(
        private readonly mediaService: MediaService,
        private readonly fileRepository: FileRepository,
    ) {}

    async execute(input: UploadFileInput): Promise<Result<FileDto, MediaError>> {
        if (!input.name || input.size <= 0) {
            return err("media_invalid_input");
        }

        let fileEntity;
        try {
            fileEntity = await this.mediaService.upload({
                name: input.name,
                contentType: input.contentType,
                size: input.size,
                body: input.body,
                isPrivate: input.isPrivate,
            });

            await this.fileRepository.save(fileEntity);
        } catch {
            // Si falla guardar metadata o subir, intentamos limpiar en el storage
            if (fileEntity) {
                try {
                    await this.mediaService.delete(fileEntity.id);
                } catch {
                    // si el rollback falla, dejamos el archivo huérfano
                }
            }
            return err("media_upload_failed");
        }

        return ok(toFileDto(fileEntity));
    }
}

