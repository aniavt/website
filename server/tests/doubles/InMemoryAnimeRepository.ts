import type { Anime } from "@domain/entities/Anime";
import type { AnimeFindAllOptions, AnimeRepository } from "@domain/repositories/AnimeRepository";

export class InMemoryAnimeRepository implements AnimeRepository {
  private items: Anime[] = [];

  async save(entity: Anime): Promise<void> {
    const idx = this.items.findIndex((a) => a.id === entity.id);
    if (idx >= 0) this.items[idx] = entity;
    else this.items.push(entity);
  }

  async findById(id: string): Promise<Anime | null> {
    return this.items.find((a) => a.id === id) ?? null;
  }

  async findAll(options?: AnimeFindAllOptions): Promise<Anime[]> {
    if (options?.active === undefined) return [...this.items];
    return this.items.filter((a) => a.active === options.active);
  }
}
