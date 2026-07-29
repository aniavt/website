import type { UserRepository } from "@domain/repositories/UserRepository";
import { NavItemsPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import type { NavItemsDto, UpdateNavItemsInput as UpdateNavItemsBody } from "../dto";
import { toNavItemsDto } from "../dto";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";

export type UpdateNavItemsInput = UpdateNavItemsBody & { id: string };

export class UpdateNavItemsUseCase {
   constructor(
      private readonly userRepository: UserRepository,
      private readonly navItemsRepository: NavItemsRepository
   ) { }

   async execute(requesterId: string, input: UpdateNavItemsInput): Promise<Result<NavItemsDto, NavItemsError>> {
      const requester = await this.userRepository.findById(requesterId);
      if (!requester) return err("navItems_not_authorized");
      if (!requester.hasPermission({ type: "navItems", permission: NavItemsPermission.UPDATE_NAVITEMS })) {
         return err("navItems_not_authorized");
      }

      const navItem = await this.navItemsRepository.findById(input.id);
      if (!navItem) return err("navItems_not_found");

      if (!navItem.canTransitionTo("updated")) return err("navItems_invalid_transition");

      if (input.title !== undefined) navItem.title = input.title;
      if (input.path !== undefined) navItem.path = input.path;
      if (input.position !== undefined) navItem.position = input.position;
      navItem.lastAction = "updated";
      navItem.updatedAt = new Date();

      try {
         await this.navItemsRepository.save(navItem);
      } catch {
         return err("navItems_save_failed");
      }

      return ok(toNavItemsDto(navItem));
   }
}
