import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { FaqText } from "@domain/entities/FaqText";
import { FaqItem } from "@domain/entities/FaqItem";
import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto } from "../dto";
import { resolveItemToPublicDto } from "../resolveFaqItem";


export interface UpdateFaqItemInput {
    id: string;
    query?: string;
    answer?: string;
}

export class UpdateFaqItemUseCase {
    constructor(
        private readonly faqTextRepository: FaqTextRepository,
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqHistoryRepository: FaqHistoryRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
    ) {}

    async execute(requesterId: string, input: UpdateFaqItemInput): Promise<Result<FaqItemPublicDto, FaqError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("faq_not_authorized");
        if (!requester.hasPermission({ type: "faq", permission: FAQPermission.UPDATE_FAQ })) return err("faq_not_authorized");

        const item = await this.faqItemRepository.findById(input.id);
        if (!item) return err("faq_item_not_found");
        if (!item.canTransitionTo("updated")) return err("faq_invalid_transition");

        if (input.query === undefined && input.answer === undefined) {
            return resolveItemToPublicDto(this.faqTextRepository, item);
        }

        let queryId = item.queryId;
        let answerId = item.answerId;
        if (input.query !== undefined) {
            const queryText = await this.findOrCreateFaqText(input.query);
            queryId = queryText.id;
        }
        if (input.answer !== undefined) {
            const answerText = await this.findOrCreateFaqText(input.answer);
            answerId = answerText.id;
        }

        const updated = new FaqItem({
            id: item.id,
            queryId,
            answerId,
            isActive: item.isActive,
            lastAction: "updated",
        });

        try {
            await this.faqItemRepository.save(updated);
            const historyId = this.idGenerator.generateUUID();
            await this.faqHistoryRepository.append(
                new FaqHistoryEntry({
                    id: historyId,
                    faqId: updated.id,
                    queryId: updated.queryId,
                    answerId: updated.answerId,
                    action: "updated",
                    by: requesterId,
                    timestamp: new Date(),
                }),
            );
        } catch {
            return err("faq_save_failed");
        }

        return resolveItemToPublicDto(this.faqTextRepository, updated);
    }

    private async findOrCreateFaqText(value: string): Promise<FaqText> {
        const existing = await this.faqTextRepository.findByValue(value);
        if (existing) return existing;
        const text = new FaqText({ id: this.idGenerator.generateUUID(), value });
        await this.faqTextRepository.save(text);
        return text;
    }
}
