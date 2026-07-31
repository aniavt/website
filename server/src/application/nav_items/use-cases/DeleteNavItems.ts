import type { UserRepository } from "@domain/repositories/UserRepository";
import { NavItemsPermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";
import { assertPermission } from "@application/shared/auth";
import { runSoftDeleteTransition } from "@application/shared/runSoftDeleteTransition";

export class DeleteNavItemsUseCase {
   constructor(
      private readonly userRepository: UserRepository,
      private readonly navItemsRepository: NavItemsRepository
   ) { }

   async execute(requesterId: string, id: string): Promise<Result<void, NavItemsError>> {
      const auth = await assertPermission(
         this.userRepository,
         requesterId,
         { type: "nav_items", permission: NavItemsPermission.DELETE_NAVITEMS },
         "nav_items_not_authorized",
      );
      if (auth.isError()) return auth;

      const result = await runSoftDeleteTransition({
         find: () => this.navItemsRepository.findById(id),
         notFound: "nav_items_not_found",
         transition: (navItem) => navItem.markDeleted(),
         invalidTransition: "nav_items_invalid_transition",
         save: (navItem) => this.navItemsRepository.save(navItem),
         saveFailed: "nav_items_save_failed",
      });
      if (result.isError()) return result;

      return ok(undefined);
   }
}
