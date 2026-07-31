import type { FaqItem } from "@domain/entities/FaqItem";
import type { FaqItemFindAllOptions, FaqItemRepository } from "@domain/repositories/FaqItemRepository";

export class InMemoryFaqItemRepository implements FaqItemRepository {
  private items: FaqItem[] = [];

  async save(entity: FaqItem): Promise<void> {
    const idx = this.items.findIndex((i) => i.id === entity.id);
    if (idx >= 0) this.items[idx] = entity;
    else this.items.push(entity);
  }

  async findById(id: string): Promise<FaqItem | null> {
    return this.items.find((i) => i.id === id) ?? null;
  }

  async findAll(options?: FaqItemFindAllOptions): Promise<FaqItem[]> {
    if (options?.isActive === undefined) return [...this.items];
    return this.items.filter((i) => i.isActive === options.isActive);
  }
}
