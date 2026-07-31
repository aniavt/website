import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { FaqText } from "@domain/entities/FaqText";
import { FaqItem } from "@domain/entities/FaqItem";
import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto, UpdateFaqItemInput as UpdateFaqItemBody } from "../dto";
import { resolveItemToPublicDto } from "../resolveFaqItem";
import { assertPermission } from "@application/shared/auth";

export type UpdateFaqItemInput = UpdateFaqItemBody & { id: string };

export class UpdateFaqItemUseCase {
    constructor(
        private readonly faqTextRepository: FaqTextRepository,
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqHistoryRepository: FaqHistoryRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
        private readonly transactionManager: TransactionManager,
    ) {}

    async execute(requester: UserEntity | string, input: UpdateFaqItemInput): Promise<Result<FaqItemPublicDto, FaqError>> {
        const auth = await assertPermission(
            this.userRepository,
            requester,
            { type: "faq", permission: FAQPermission.UPDATE_FAQ },
            "faq_not_authorized",
        );
        if (auth.isError()) return auth;

        const item = await this.faqItemRepository.findById(input.id);
        if (!item) return err("faq_item_not_found");
        if (!item.canTransitionTo("updated")) return err("faq_invalid_transition");

        if (input.query === undefined && input.answer === undefined) {
            return resolveItemToPublicDto(this.faqTextRepository, item);
        }

        try {
            const updated = await this.transactionManager.runInTransaction(async () => {
                let queryId = item.queryId;
                let answerId = item.answerId;
                if (input.query !== undefined) {
                    queryId = (await this.findOrCreateFaqText(input.query)).id;
                }
                if (input.answer !== undefined) {
                    answerId = (await this.findOrCreateFaqText(input.answer)).id;
                }

                const updated = new FaqItem({
                    id: item.id,
                    queryId,
                    answerId,
                    isActive: item.isActive,
                    lastAction: "updated",
                });

                await this.faqItemRepository.save(updated);
                await this.faqHistoryRepository.append(
                    new FaqHistoryEntry({
                        id: this.idGenerator.generateUUID(),
                        faqId: updated.id,
                        queryId: updated.queryId,
                        answerId: updated.answerId,
                        action: "updated",
                        by: auth.data.id,
                        timestamp: new Date(),
                    }),
                );

                return updated;
            });

            return resolveItemToPublicDto(this.faqTextRepository, updated);
        } catch (error) {
            console.error("faq_save_failed", error);
            return err("faq_save_failed");
        }
    }

    private async findOrCreateFaqText(value: string): Promise<FaqText> {
        const existing = await this.faqTextRepository.findByValue(value);
        if (existing) return existing;
        const text = new FaqText({ id: this.idGenerator.generateUUID(), value });
        await this.faqTextRepository.save(text);
        return text;
    }
}
