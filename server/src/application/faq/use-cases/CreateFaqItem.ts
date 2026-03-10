import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { FaqText } from "@domain/entities/FaqText";
import { FaqItem } from "@domain/entities/FaqItem";
import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto } from "../dto";
import { toFaqItemPublicDto } from "../dto";


export interface CreateFaqItemInput {
    query: string;
    answer: string;
}

export class CreateFaqItemUseCase {
    constructor(
        private readonly faqTextRepository: FaqTextRepository,
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqHistoryRepository: FaqHistoryRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
    ) {}

    async execute(requesterId: string, input: CreateFaqItemInput): Promise<Result<FaqItemPublicDto, FaqError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("faq_not_authorized");
        if (!requester.hasPermission({ type: "faq", permission: FAQPermission.CREATE_FAQ })) return err("faq_not_authorized");

        const queryText = await this.findOrCreateFaqText(input.query);
        const answerText = await this.findOrCreateFaqText(input.answer);

        if (queryText.isError() || answerText.isError()) return err("faq_save_failed");

        const itemId = this.idGenerator.generateFaqItemId();
        const item = new FaqItem({
            id: itemId,
            queryId: queryText.data.id,
            answerId: answerText.data.id,
            isActive: true,
            lastAction: "created",
        });

        try {
            await this.faqItemRepository.save(item);
            const historyId = this.idGenerator.generateFaqHistoryId();
            await this.faqHistoryRepository.append(
                new FaqHistoryEntry({
                    id: historyId,
                    faqId: item.id,
                    queryId: item.queryId,
                    answerId: item.answerId,
                    action: "created",
                    by: requesterId,
                    timestamp: new Date(),
                }),
            );
        } catch {
            return err("faq_save_failed");
        }

        return ok(toFaqItemPublicDto(item, queryText.data.value, answerText.data.value));
    }

    private async findOrCreateFaqText(value: string): Promise<Result<FaqText, FaqError>> {
        const existing = await this.faqTextRepository.findByValue(value);
        if (existing) return ok(existing);
        try {
            const text = new FaqText({ id: this.idGenerator.generateFaqTextId(), value });
            await this.faqTextRepository.save(text);
            return ok(text);
        } catch {
            return err("faq_save_failed");
        }
    }
}
