import type { FaqText } from "@domain/entities/FaqText";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";

export class InMemoryFaqTextRepository implements FaqTextRepository {
  private items: FaqText[] = [];

  async save(entity: FaqText): Promise<void> {
    const idx = this.items.findIndex((t) => t.id === entity.id);
    if (idx >= 0) this.items[idx] = entity;
    else this.items.push(entity);
  }

  async findById(id: string): Promise<FaqText | null> {
    return this.items.find((t) => t.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Map<string, FaqText>> {
    const result = new Map<string, FaqText>();
    for (const id of [...new Set(ids)]) {
      const item = this.items.find((t) => t.id === id);
      if (item) result.set(id, item);
    }
    return result;
  }

  async findByValue(value: string): Promise<FaqText | null> {
    return this.items.find((t) => t.value === value) ?? null;
  }
}
