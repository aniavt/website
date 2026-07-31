import { z } from "zod";
import type { SoftDeleteLastAction } from "@ania/domain-shared/soft-delete";
import { nonEmptyMax } from "./zod-helpers";

export interface FaqTextDto {
  readonly id: string;
  readonly value: string;
}

/** Internal: ids for versioning. */
export interface FaqItemDto {
  readonly id: string;
  readonly queryId: string;
  readonly answerId: string;
  readonly isActive: boolean;
  readonly lastAction: SoftDeleteLastAction;
}

/** Public response: query and answer as text. */
export interface FaqItemPublicDto {
  readonly id: string;
  readonly query: string;
  readonly answer: string;
  readonly isActive: boolean;
  readonly lastAction: SoftDeleteLastAction;
}

export interface FaqHistoryEntryDto {
  readonly id: string;
  readonly faqId: string;
  readonly queryId: string;
  readonly answerId: string;
  readonly action: SoftDeleteLastAction;
  readonly by: string;
  readonly byUsername: string;
  readonly timestamp: string;
}

export const CreateFaqItemInputSchema = z
  .object({
    query: nonEmptyMax(500),
    answer: nonEmptyMax(5000),
  })
  .strict();

export type CreateFaqItemInput = z.infer<typeof CreateFaqItemInputSchema>;

/** HTTP body for FAQ update (id comes from the route). */
export const UpdateFaqItemInputSchema = z
  .object({
    query: nonEmptyMax(500).optional(),
    answer: nonEmptyMax(5000).optional(),
  })
  .strict();

export type UpdateFaqItemInput = z.infer<typeof UpdateFaqItemInputSchema>;
