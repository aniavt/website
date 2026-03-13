import type { MediaService } from "@domain/services/MediaService";
import type { FileRepository } from "@domain/repositories/FileRepository";
import { err, ok, type Result } from "@lib/result";
import type { MediaError } from "../errors";

export class DeleteFileUseCase {
    constructor(
        private readonly mediaService: MediaService,
        private readonly fileRepository: FileRepository,
    ) {}

    async execute(id: string): Promise<Result<null, MediaError>> {
        const file = await this.fileRepository.findById(id);
        if (!file) {
            // nada que borrar; se considera éxito
            return ok(null);
        }

        try {
            await this.mediaService.delete(file.id);
            await this.fileRepository.delete(file.id);
            return ok(null);
        } catch {
            return err("media_delete_failed");
        }
    }
}

