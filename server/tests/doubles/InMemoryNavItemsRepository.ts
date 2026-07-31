import type { NavItems } from "@domain/entities/NavItems";
import type { NavItemsFindAllOptions, NavItemsRepository } from "@domain/repositories/NavItemsRepository";

export class InMemoryNavItemsRepository implements NavItemsRepository {
  private items: NavItems[] = [];

  async save(entity: NavItems): Promise<void> {
    const idx = this.items.findIndex((n) => n.id === entity.id);
    if (idx >= 0) this.items[idx] = entity;
    else this.items.push(entity);
  }

  async findById(id: string): Promise<NavItems | null> {
    return this.items.find((n) => n.id === id) ?? null;
  }

  async findAll(options?: NavItemsFindAllOptions): Promise<NavItems[]> {
    if (options?.active === undefined) return [...this.items];
    return this.items.filter((n) => n.active === options.active);
  }
}
