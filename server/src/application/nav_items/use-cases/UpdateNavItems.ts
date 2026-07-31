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
         { type: "nav_items", permission: NavItemsPermission.UPDATE_NAVITEMS },
         "nav_items_not_authorized",
      );
      if (auth.isError()) return auth;

      const navItem = await this.navItemsRepository.findById(input.id);
      if (!navItem) return err("nav_items_not_found");

      if (!navItem.applyUpdate({
         title: input.title,
         path: input.path,
         position: input.position,
      })) {
         return err("nav_items_invalid_transition");
      }

      const saved = await saveOrErr(this.navItemsRepository.save(navItem), "nav_items_save_failed");
      if (saved.isError()) return saved;

      return ok(toNavItemsDto(navItem));
   }
}
