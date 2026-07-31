import type { UserRepository } from "@domain/repositories/UserRepository";
import { NavItemsPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";
import { assertPermission } from "@application/shared/auth";
import { saveOrErr } from "@application/shared/saveOrErr";

export class DeleteNavItemsUseCase {
   constructor(
      private readonly userRepository: UserRepository,
      private readonly navItemsRepository: NavItemsRepository
   ) { }

   async execute(requesterId: string, id: string): Promise<Result<void, NavItemsError>> {
      const auth = await assertPermission(
         this.userRepository,
         requesterId,
         { type: "navItems", permission: NavItemsPermission.DELETE_NAVITEMS },
         "navItems_not_authorized",
      );
      if (auth.isError()) return auth;

      const navItem = await this.navItemsRepository.findById(id);
      if (!navItem) return err("navItems_not_found");

      if (!navItem.markDeleted()) return err("navItems_invalid_transition");

      const saved = await saveOrErr(this.navItemsRepository.save(navItem), "navItems_save_failed");
      if (saved.isError()) return saved;

      return ok(undefined);
   }
}
