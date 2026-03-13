import type { FileEntity } from '../entities/File';

/** Parámetros para subir un archivo. body: contenido binario (Buffer en Node/Bun extiende Uint8Array). */
export interface UploadParams {
    isPrivate: boolean;
    name: string;
    contentType: string;
    size: number;
    body: Uint8Array;
}

export interface MediaService {
    upload(params: UploadParams): Promise<FileEntity>;
    delete(id: string): Promise<void>;
    getObjectUrl(id: string): Promise<string>;
}
