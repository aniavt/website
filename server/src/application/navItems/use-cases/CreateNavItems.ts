
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { NavItemsPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import { toNavItemsDto, type NavItemsDto, type CreateNavItemsInput } from "../dto";
import { NavItems } from "@domain/entities/NavItems";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";

export type { CreateNavItemsInput };

export class CreateNavItemsUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly idGenerator: IdGenerator,
    private readonly navRepository: NavItemsRepository,
  ) { }

  async execute(requesterId: string, input: CreateNavItemsInput): Promise<Result<NavItemsDto, NavItemsError>> {
    const requester = await this.userRepository.findById(requesterId);
    if (!requester) return err("navItems_not_authorized");
    if (!requester.hasPermission({ type: "navItems", permission: NavItemsPermission.CREATE_NAVITEMS })) {
      return err("navItems_not_authorized");
    }

    const now = new Date();
    const navItem = new NavItems({
      id: this.idGenerator.generateUUID(),
      title: input.title,
      path: input.path,
      position: input.position,
      active: true,
      lastAction: "created",
      createdAt: now,
      updatedAt: now,
    });

    try {
      await this.navRepository.save(navItem);
    } catch {
      return err("navItems_save_failed");
    }

    return ok(toNavItemsDto(navItem));
  }
}
