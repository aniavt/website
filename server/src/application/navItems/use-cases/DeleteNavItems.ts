import type { UserRepository } from "@domain/repositories/UserRepository";
import { NavItemsPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";

export class DeleteNavItemsUseCase {
   constructor(
      private readonly userRepository: UserRepository,
      private readonly navItemsRepository: NavItemsRepository
   ) { }

   async execute(requesterId: string, id: string): Promise<Result<void, NavItemsError>> {
      const requester = await this.userRepository.findById(requesterId);
      if (!requester) return err("navItems_not_authorized");
      if (!requester.hasPermission({ type: "navItems", permission: NavItemsPermission.DELETE_NAVITEMS })) {
         return err("navItems_not_authorized");
      }

      const navItem = await this.navItemsRepository.findById(id);
      if (!navItem) return err("navItems_not_found");

      if (!navItem.canTransitionTo("deleted")) return err("navItems_invalid_transition");

      navItem.active = false;
      navItem.lastAction = "deleted";
      navItem.updatedAt = new Date();

      try {
         await this.navItemsRepository.save(navItem);
      } catch {
         return err("navItems_save_failed");
      }

      return ok(undefined);
   }
}
