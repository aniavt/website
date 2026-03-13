import type { FileEntity } from "@domain/entities/File";

export interface FileRepository {
    save(file: FileEntity): Promise<void>;
    findById(id: string): Promise<FileEntity | null>;
    delete(id: string): Promise<void>;
}
