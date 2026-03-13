import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { FaqItem } from "@domain/entities/FaqItem";
import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto } from "../dto";
import { resolveItemToPublicDto } from "../resolveFaqItem";

export class RestoreFaqItemUseCase {
    constructor(
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqTextRepository: FaqTextRepository,
        private readonly faqHistoryRepository: FaqHistoryRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
    ) {}

    async execute(requesterId: string, id: string): Promise<Result<FaqItemPublicDto, FaqError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("faq_not_authorized");
        if (!requester.hasPermission({ type: "faq", permission: FAQPermission.RESTORE_FAQ })) return err("faq_not_authorized");

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
            await this.faqItemRepository.save(updated);
            const historyId = this.idGenerator.generateUUID();
            await this.faqHistoryRepository.append(
                new FaqHistoryEntry({
                    id: historyId,
                    faqId: updated.id,
                    queryId: updated.queryId,
                    answerId: updated.answerId,
                    action: "restore",
                    by: requesterId,
                    timestamp: new Date(),
                }),
            );
        } catch {
            return err("faq_save_failed");
        }

        return resolveItemToPublicDto(this.faqTextRepository, updated);
    }
}
