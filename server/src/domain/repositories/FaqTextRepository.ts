import type { FaqText } from "@domain/entities/FaqText";


export interface FaqTextRepository {
    save(entity: FaqText): Promise<void>;
    findById(id: string): Promise<FaqText | null>;
    findByValue(value: string): Promise<FaqText | null>;
}
