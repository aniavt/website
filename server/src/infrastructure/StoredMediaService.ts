import type { FileEntity } from "@domain/entities/File";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { MediaService } from "@domain/services/MediaService";
import type { ObjectStorage, UploadParams } from "@domain/services/ObjectStorage";

export class StoredMediaService implements MediaService {
    constructor(
        private readonly objectStorage: ObjectStorage,
        private readonly fileRepository: FileRepository,
    ) {}

    async upload(params: UploadParams): Promise<FileEntity> {
        if (!params.name || params.size <= 0) {
            throw new Error("media_invalid_input");
        }

        let fileEntity: FileEntity | undefined;
        try {
            fileEntity = await this.objectStorage.upload(params);
            await this.fileRepository.save(fileEntity);
        } catch (error) {
            console.error("media_upload_failed", error);
            if (fileEntity) {
                try {
                    await this.objectStorage.delete(fileEntity.id);
                } catch (rollbackError) {
                    console.error("media_upload_rollback_failed", rollbackError);
                }
            }
            throw new Error("media_upload_failed");
        }

        return fileEntity;
    }

    async delete(id: string): Promise<void> {
        const file = await this.fileRepository.findById(id);
        if (!file) {
            return;
        }

        try {
            await this.objectStorage.delete(file.id);
            await this.fileRepository.delete(file.id);
        } catch (error) {
            console.error("media_delete_failed", error);
            throw new Error("media_delete_failed");
        }
    }

    async getUrl(id: string): Promise<string | null> {
        const file = await this.fileRepository.findById(id);
        if (!file) return null;

        return await this.objectStorage.getObjectUrl(file.id);
    }
}
