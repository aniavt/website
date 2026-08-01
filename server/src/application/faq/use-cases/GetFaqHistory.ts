import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqHistoryEntryDto } from "../dto";
import { toFaqHistoryEntryDto } from "../dto";
import { assertPermission } from "@application/shared/auth";


export class GetFaqHistoryUseCase {
    constructor(
        private readonly faqHistoryRepository: FaqHistoryRepository,
        private readonly faqItemRepository: FaqItemRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requester: UserEntity | string,
        faqId: string,
    ): Promise<Result<FaqHistoryEntryDto[], FaqError>> {
        const auth = await assertPermission(
            this.userRepository,
            requester,
            { type: "faq", permission: FAQPermission.READ_FAQ },
            "faq_not_authorized",
        );
        if (auth.isError()) return auth;

        const item = await this.faqItemRepository.findById(faqId);
        if (!item) return err("faq_item_not_found");

        const entries = await this.faqHistoryRepository.findByFaqId(faqId);

        const userIds = [...new Set(entries.map((e) => e.by))];
        const users = await this.userRepository.findByIds(userIds);
        const usernameMap = new Map(userIds.map((id) => [id, users.get(id)?.username ?? id]));

        return ok(entries.map((e) => toFaqHistoryEntryDto(e, usernameMap.get(e.by)!)));
    }
}
