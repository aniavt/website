import type { FaqText } from "@domain/entities/FaqText";
import type { FaqItem } from "@domain/entities/FaqItem";
import type { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import type {
    FaqTextDto,
    FaqItemDto,
    FaqItemPublicDto,
    FaqHistoryEntryDto,
} from "@ania/api-contract/faq";

export type {
    FaqTextDto,
    FaqItemDto,
    FaqItemPublicDto,
    FaqHistoryEntryDto,
    CreateFaqItemInput,
    UpdateFaqItemInput,
} from "@ania/api-contract/faq";

export function toFaqTextDto(entity: FaqText): FaqTextDto {
    return { id: entity.id, value: entity.value };
}

export function toFaqItemDto(entity: FaqItem): FaqItemDto {
    return {
        id: entity.id,
        queryId: entity.queryId,
        answerId: entity.answerId,
        isActive: entity.isActive,
        lastAction: entity.lastAction,
    };
}

export function toFaqItemPublicDto(item: FaqItem, queryValue: string, answerValue: string): FaqItemPublicDto {
    return {
        id: item.id,
        query: queryValue,
        answer: answerValue,
        isActive: item.isActive,
        lastAction: item.lastAction,
    };
}

export function toFaqHistoryEntryDto(entity: FaqHistoryEntry, byUsername: string): FaqHistoryEntryDto {
    return {
        id: entity.id,
        faqId: entity.faqId,
        queryId: entity.queryId,
        answerId: entity.answerId,
        action: entity.action,
        by: entity.by,
        byUsername,
        timestamp: entity.timestamp.toISOString(),
    };
}
