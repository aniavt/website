import type { FileEntity } from "@domain/entities/File";
import type { FileRepository } from "@domain/repositories/FileRepository";

export class InMemoryFileRepository implements FileRepository {
  private items: FileEntity[] = [];

  async save(file: FileEntity): Promise<void> {
    const idx = this.items.findIndex((f) => f.id === file.id);
    if (idx >= 0) this.items[idx] = file;
    else this.items.push(file);
  }

  async findById(id: string): Promise<FileEntity | null> {
    return this.items.find((f) => f.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Map<string, FileEntity>> {
    const result = new Map<string, FileEntity>();
    for (const id of [...new Set(ids)]) {
      const item = this.items.find((f) => f.id === id);
      if (item) result.set(id, item);
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((f) => f.id !== id);
  }
}
