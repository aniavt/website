import { FileEntity } from "@domain/entities/File";
import type { ObjectStorage, UploadParams } from "@domain/services/ObjectStorage";

export class FakeObjectStorage implements ObjectStorage {
  private files = new Map<string, FileEntity>();
  private counter = 0;
  deletedIds: string[] = [];

  async upload(params: UploadParams): Promise<FileEntity> {
    this.counter += 1;
    const id = `file-${this.counter}`;
    const file = new FileEntity({
      id,
      name: params.name,
      contentType: params.contentType,
      size: params.size,
      url: `https://fake.local/${id}`,
      isPrivate: params.isPrivate,
    });
    this.files.set(id, file);
    return file;
  }

  async delete(id: string): Promise<void> {
    this.files.delete(id);
    this.deletedIds.push(id);
  }

  async getObjectUrl(id: string): Promise<string> {
    if (!this.files.has(id)) throw new Error(`file_not_found:${id}`);
    return `https://fake.local/${id}`;
  }

  seed(file: FileEntity): void {
    this.files.set(file.id, file);
  }
}
