import type { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";


export interface FaqHistoryRepository {
    append(entry: FaqHistoryEntry): Promise<void>;
    findByFaqId(faqId: string): Promise<FaqHistoryEntry[]>;
}
