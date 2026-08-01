import type { FileEntity } from "@domain/entities/File";

export interface FileRepository {
    save(file: FileEntity): Promise<void>;
    findById(id: string): Promise<FileEntity | null>;
    findByIds(ids: string[]): Promise<Map<string, FileEntity>>;
    delete(id: string): Promise<void>;
}
