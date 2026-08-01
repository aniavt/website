import type { Chapter } from "@domain/entities/Chapter";
import type { ChapterRepository } from "@domain/repositories/ChapterRepository";

export class InMemoryChapterRepository implements ChapterRepository {
  private items: Chapter[] = [];

  async save(entity: Chapter): Promise<void> {
    const idx = this.items.findIndex((c) => c.id === entity.id);
    if (idx >= 0) this.items[idx] = entity;
    else this.items.push(entity);
  }

  async findById(id: string): Promise<Chapter | null> {
    return this.items.find((c) => c.id === id) ?? null;
  }

  async findByAnimeId(animeId: string): Promise<Chapter[]> {
    return this.items.filter((c) => c.animeId === animeId);
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((c) => c.id !== id);
  }
}
