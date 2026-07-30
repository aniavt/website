import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { NavItemsPermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { NavItemsError } from "../errors";
import { toNavItemsDto, type NavItemsDto, type CreateNavItemsInput } from "../dto";
import { NavItems } from "@domain/entities/NavItems";
import type { NavItemsRepository } from "@domain/repositories/NavItemsRepository";
import { assertPermission } from "@application/shared/auth";
import { saveOrErr } from "@application/shared/saveOrErr";

export type { CreateNavItemsInput };

export class CreateNavItemsUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly idGenerator: IdGenerator,
    private readonly navRepository: NavItemsRepository,
  ) { }

  async execute(requesterId: string, input: CreateNavItemsInput): Promise<Result<NavItemsDto, NavItemsError>> {
    const auth = await assertPermission(
      this.userRepository,
      requesterId,
      { type: "navItems", permission: NavItemsPermission.CREATE_NAVITEMS },
      "navItems_not_authorized",
    );
    if (auth.isError()) return auth;

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

    const saved = await saveOrErr(this.navRepository.save(navItem), "navItems_save_failed");
    if (saved.isError()) return saved;

    return ok(toNavItemsDto(navItem));
  }
}
