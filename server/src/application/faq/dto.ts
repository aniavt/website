import type { FaqText } from "@domain/entities/FaqText";
import type { FaqItem } from "@domain/entities/FaqItem";
import type { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";


export interface FaqTextDto {
    readonly id: string;
    readonly value: string;
}

/** Internal: ids para versionado. No exponer al cliente. */
export interface FaqItemDto {
    readonly id: string;
    readonly queryId: string;
    readonly answerId: string;
    readonly isActive: boolean;
    readonly lastAction: string;
}

/** Respuesta pública: query y answer como texto. */
export interface FaqItemPublicDto {
    readonly id: string;
    readonly query: string;
    readonly answer: string;
    readonly isActive: boolean;
    readonly lastAction: string;
}

export interface FaqHistoryEntryDto {
    readonly id: string;
    readonly faqId: string;
    readonly queryId: string;
    readonly answerId: string;
    readonly action: string;
    readonly by: string;
    readonly timestamp: Date;
}

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

export function toFaqHistoryEntryDto(entity: FaqHistoryEntry): FaqHistoryEntryDto {
    return {
        id: entity.id,
        faqId: entity.faqId,
        queryId: entity.queryId,
        answerId: entity.answerId,
        action: entity.action,
        by: entity.by,
        timestamp: entity.timestamp,
    };
}
