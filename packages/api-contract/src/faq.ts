import type { SoftDeleteLastAction } from "./soft-delete";

export type FaqItemLastAction = SoftDeleteLastAction;

export type FaqHistoryAction = FaqItemLastAction;

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
  readonly lastAction: FaqItemLastAction;
}

/** Public response: query and answer as text. */
export interface FaqItemPublicDto {
  readonly id: string;
  readonly query: string;
  readonly answer: string;
  readonly isActive: boolean;
  readonly lastAction: FaqItemLastAction;
}

export interface FaqHistoryEntryDto {
  readonly id: string;
  readonly faqId: string;
  readonly queryId: string;
  readonly answerId: string;
  readonly action: FaqHistoryAction;
  readonly by: string;
  readonly byUsername: string;
  readonly timestamp: string;
}

export interface CreateFaqItemInput {
  query: string;
  answer: string;
}

/** HTTP body for FAQ update (id comes from the route). */
export interface UpdateFaqItemInput {
  query?: string;
  answer?: string;
}
