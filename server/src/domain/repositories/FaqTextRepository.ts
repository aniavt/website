import type { FaqText } from "@domain/entities/FaqText";


export interface FaqTextRepository {
    save(entity: FaqText): Promise<void>;
    findById(id: string): Promise<FaqText | null>;
    findByIds(ids: string[]): Promise<Map<string, FaqText>>;
    findByValue(value: string): Promise<FaqText | null>;
}
