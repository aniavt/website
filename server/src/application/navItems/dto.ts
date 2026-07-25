import type { NavItems } from "@domain/entities/NavItems";

export interface NavItemsDto {
   readonly id: string;
   readonly title: string;
   readonly path: string;
   readonly position: number;
   readonly active: boolean;
   readonly lastAction: string;
   readonly createdAt: Date;
   readonly updatedAt: Date;
}

export function toNavItemsDto(entity: NavItems): NavItemsDto {
   return {
      id: entity.id,
      title: entity.title,
      path: entity.path,
      position: entity.position,
      active: entity.active,
      lastAction: entity.lastAction,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
   };
}
