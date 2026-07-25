import type { NavItems } from "@domain/entities/NavItems";

export interface NavItemsFindAllOptions {
  active?: boolean;
}

export interface NavItemsRepository {
  save(entity: NavItems): Promise<void>;
  findById(id: string): Promise<NavItems | null>;
  findAll(options?: NavItemsFindAllOptions): Promise<NavItems[]>;
}
