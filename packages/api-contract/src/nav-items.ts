import type { SoftDeleteLastAction } from "@ania/domain-shared/soft-delete";

export interface NavItemsDto {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly position: number;
  readonly active: boolean;
  readonly lastAction: SoftDeleteLastAction;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateNavItemsInput {
  title: string;
  path: string;
  position: number;
}

export interface UpdateNavItemsInput {
  title?: string;
  path?: string;
  position?: number;
}
