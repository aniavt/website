import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { FaqItem } from "@domain/entities/FaqItem";
import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto } from "../dto";
import { resolveItemToPublicDto } from "../resolveFaqItem";
import { assertPermission } from "@application/shared/auth";

export class RestoreFaqItemUseCase {
    constructor(
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqTextRepository: FaqTextRepository,
        private readonly faqHistoryRepository: FaqHistoryRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
        private readonly transactionManager: TransactionManager,
    ) {}

    async execute(requester: UserEntity | string, id: string): Promise<Result<FaqItemPublicDto, FaqError>> {
        const auth = await assertPermission(
            this.userRepository,
            requester,
            { type: "faq", permission: FAQPermission.RESTORE_FAQ },
            "faq_not_authorized",
        );
        if (auth.isError()) return auth;

        const item = await this.faqItemRepository.findById(id);
        if (!item) return err("faq_item_not_found");
        if (!item.canTransitionTo("restore")) return err("faq_invalid_transition");

        const updated = new FaqItem({
            id: item.id,
            queryId: item.queryId,
            answerId: item.answerId,
            isActive: true,
            lastAction: "restore",
        });

        try {
            await this.transactionManager.runInTransaction(async () => {
                await this.faqItemRepository.save(updated);
                await this.faqHistoryRepository.append(
                    new FaqHistoryEntry({
                        id: this.idGenerator.generateUUID(),
                        faqId: updated.id,
                        queryId: updated.queryId,
                        answerId: updated.answerId,
                        action: "restore",
                        by: auth.data.id,
                        timestamp: new Date(),
                    }),
                );
            });
        } catch (error) {
            console.error("faq_save_failed", error);
            return err("faq_save_failed");
        }

        return resolveItemToPublicDto(this.faqTextRepository, updated);
    }
}
