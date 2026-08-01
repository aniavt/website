import { err, ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import type { NavItemsDto } from "../dto";
import { toNavItemsDto } from "../dto";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";

export class GetNavItemsByIdUseCase {
   constructor(
      private readonly navItemsRepository: NavItemsRepository
   ) { }

   async execute(id: string): Promise<Result<NavItemsDto, NavItemsError>> {
      const navItem = await this.navItemsRepository.findById(id);
      if (!navItem) return err("nav_items_not_found");
      return ok(toNavItemsDto(navItem));
   }
}
