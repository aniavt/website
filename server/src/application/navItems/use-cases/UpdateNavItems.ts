import type { UserRepository } from "@domain/repositories/UserRepository";
import { NavItemsPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import type { NavItemsDto, UpdateNavItemsInput as UpdateNavItemsBody } from "../dto";
import { toNavItemsDto } from "../dto";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";
import { assertPermission } from "@application/shared/auth";
import { saveOrErr } from "@application/shared/saveOrErr";

export type UpdateNavItemsInput = UpdateNavItemsBody & { id: string };

export class UpdateNavItemsUseCase {
   constructor(
      private readonly userRepository: UserRepository,
      private readonly navItemsRepository: NavItemsRepository
   ) { }

   async execute(requesterId: string, input: UpdateNavItemsInput): Promise<Result<NavItemsDto, NavItemsError>> {
      const auth = await assertPermission(
         this.userRepository,
         requesterId,
         { type: "navItems", permission: NavItemsPermission.UPDATE_NAVITEMS },
         "navItems_not_authorized",
      );
      if (auth.isError()) return auth;

      const navItem = await this.navItemsRepository.findById(input.id);
      if (!navItem) return err("navItems_not_found");

      if (!navItem.canTransitionTo("updated")) return err("navItems_invalid_transition");

      if (input.title !== undefined) navItem.title = input.title;
      if (input.path !== undefined) navItem.path = input.path;
      if (input.position !== undefined) navItem.position = input.position;
      navItem.lastAction = "updated";
      navItem.updatedAt = new Date();

      const saved = await saveOrErr(this.navItemsRepository.save(navItem), "navItems_save_failed");
      if (saved.isError()) return saved;

      return ok(toNavItemsDto(navItem));
   }
}
