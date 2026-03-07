import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqHistoryEntryDto } from "../dto";
import { toFaqHistoryEntryDto } from "../dto";


export class GetFaqHistoryUseCase {
    constructor(
        private readonly faqHistoryRepository: FaqHistoryRepository,
        private readonly faqItemRepository: FaqItemRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(requesterId: string, faqId: string): Promise<Result<FaqHistoryEntryDto[], FaqError>> {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester) return err("faq_not_authorized");
        if (!requester.isRoot && !requester.isAdmin) return err("faq_not_authorized");

        const item = await this.faqItemRepository.findById(faqId);
        if (!item) return err("faq_item_not_found");

        const entries = await this.faqHistoryRepository.findByFaqId(faqId);
        return ok(entries.map(toFaqHistoryEntryDto));
    }
}
