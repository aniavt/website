import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto } from "../dto";
import { resolveItemToPublicDtoFromTexts } from "../resolveFaqItem";
import { resolveRequester } from "@application/shared/auth";

export interface ListFaqItemsOptions {
    activeOnly?: boolean;
}

export class ListFaqItemsUseCase {
    constructor(
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqTextRepository: FaqTextRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        requester: UserEntity | string | null,
        options?: ListFaqItemsOptions,
    ): Promise<Result<FaqItemPublicDto[], FaqError>> {
        const user = await resolveRequester(this.userRepository, requester);
        const canSeeInactive =
            user?.hasPermission({
                type: "faq",
                permission: FAQPermission.READ_FAQ,
            }) === true;

        const effectiveActiveOnly = options?.activeOnly === true || !canSeeInactive;

        const items = await this.faqItemRepository.findAll(
            effectiveActiveOnly ? { isActive: true } : undefined,
        );
        const textIds = items.flatMap((item) => [item.queryId, item.answerId]);
        const texts = await this.faqTextRepository.findByIds(textIds);

        const out: FaqItemPublicDto[] = [];
        for (const item of items) {
            const resolved = resolveItemToPublicDtoFromTexts(item, texts);
            if (resolved.isError()) return err(resolved.error);
            out.push(resolved.data);
        }
        return ok(out);
    }
}
