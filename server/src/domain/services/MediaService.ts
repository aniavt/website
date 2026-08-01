import type { FileEntity } from "../entities/File";
import type { UploadParams } from "./ObjectStorage";

export type { UploadParams };

export interface MediaService {
    upload(params: UploadParams): Promise<FileEntity>;
    delete(id: string): Promise<void>;
    getUrl(id: string): Promise<string | null>;
}
