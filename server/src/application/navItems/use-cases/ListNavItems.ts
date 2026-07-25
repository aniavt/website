import type { UserRepository } from "@domain/repositories/UserRepository";
import { NavItemsPermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import type { NavItemsDto } from "../dto";
import { toNavItemsDto } from "../dto";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";

export interface ListNavItemsOptions {
   activeOnly?: boolean;
}

export class ListNavItemsUseCase {
   constructor(
      private readonly userRepository: UserRepository,
      private readonly navItemsRepository: NavItemsRepository
   ) { }

   async execute(requesterId: string | null, options?: ListNavItemsOptions): Promise<Result<NavItemsDto[], NavItemsError>> {
      const canSeeInactive =
         requesterId !== null &&
         (await this.userRepository.findById(requesterId))?.hasPermission({
            type: "navItems",
            permission: NavItemsPermission.READ_NAVITEMS,
         }) === true;

      const effectiveActiveOnly = options?.activeOnly === true || !canSeeInactive;

      const navItems = await this.navItemsRepository.findAll(
         effectiveActiveOnly ? { active: true } : undefined,
      );

      return ok(navItems.map(toNavItemsDto));
   }
}
