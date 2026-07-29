import type { NavItems } from "@domain/entities/NavItems";
import type { NavItemsDto } from "@ania/api-contract/nav-items";

export type { NavItemsDto, NavItemsLastAction, CreateNavItemsInput, UpdateNavItemsInput } from "@ania/api-contract/nav-items";

export function toNavItemsDto(entity: NavItems): NavItemsDto {
   return {
      id: entity.id,
      title: entity.title,
      path: entity.path,
      position: entity.position,
      active: entity.active,
      lastAction: entity.lastAction,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
   };
}
