import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto } from "../dto";
import { resolveItemToPublicDto } from "../resolveFaqItem";
import { assertPermission } from "@application/shared/auth";
import { saveWithHistory } from "@application/shared/saveWithHistory";

export class DeleteFaqItemUseCase {
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
            { type: "faq", permission: FAQPermission.DELETE_FAQ },
            "faq_not_authorized",
        );
        if (auth.isError()) return auth;

        const item = await this.faqItemRepository.findById(id);
        if (!item) return err("faq_item_not_found");
        if (!item.markDeleted()) return err("faq_invalid_transition");

        const saved = await saveWithHistory({
            tx: this.transactionManager,
            persist: () => this.faqItemRepository.save(item),
            append: () =>
                this.faqHistoryRepository.append(
                    new FaqHistoryEntry({
                        id: this.idGenerator.generateUUID(),
                        faqId: item.id,
                        queryId: item.queryId,
                        answerId: item.answerId,
                        action: "deleted",
                        by: auth.data.id,
                        timestamp: new Date(),
                    }),
                ),
            saveFailed: "faq_save_failed",
        });
        if (saved.isError()) return saved;

        return resolveItemToPublicDto(this.faqTextRepository, item);
    }
}
