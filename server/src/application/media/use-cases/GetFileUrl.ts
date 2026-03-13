import type { FileRepository } from "@domain/repositories/FileRepository";
import type { MediaService } from "@domain/services/MediaService";

export class GetFileUrlUseCase {
    constructor(
        private readonly fileRepository: FileRepository,
        private readonly mediaService: MediaService,
    ) {}

    async execute(id: string): Promise<string | null> {
        const file = await this.fileRepository.findById(id);
        if (!file) return null;

        return await this.mediaService.getObjectUrl(file.id);
    }
}

