import { z } from "zod";
import type { SoftDeleteLastAction } from "@ania/domain-shared/soft-delete";
import { nonEmptyMax } from "./zod-helpers";

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

export const CreateNavItemsInputSchema = z
  .object({
    title: nonEmptyMax(100),
    path: nonEmptyMax(500),
    position: z.number().int(),
  })
  .strict();

export type CreateNavItemsInput = z.infer<typeof CreateNavItemsInputSchema>;

export const UpdateNavItemsInputSchema = z
  .object({
    title: nonEmptyMax(100).optional(),
    path: nonEmptyMax(500).optional(),
    position: z.number().int().optional(),
  })
  .strict();

export type UpdateNavItemsInput = z.infer<typeof UpdateNavItemsInputSchema>;
