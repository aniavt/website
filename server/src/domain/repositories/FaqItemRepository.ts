import type { FaqItem } from "@domain/entities/FaqItem";


export interface FaqItemFindAllOptions {
    readonly isActive?: boolean;
}

export interface FaqItemRepository {
    save(entity: FaqItem): Promise<void>;
    findById(id: string): Promise<FaqItem | null>;
    findAll(options?: FaqItemFindAllOptions): Promise<FaqItem[]>;
}
