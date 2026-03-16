import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto } from "../dto";
import { resolveItemToPublicDto } from "../resolveFaqItem";

export interface ListFaqItemsOptions {
    activeOnly?: boolean;
}

export class ListFaqItemsUseCase {
    constructor(
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqTextRepository: FaqTextRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(requesterId: string | null, options?: ListFaqItemsOptions): Promise<Result<FaqItemPublicDto[], FaqError>> {
        const canSeeInactive =
            requesterId !== null &&
            (await this.userRepository.findById(requesterId))?.hasPermission({
                type: "faq",
                permission: FAQPermission.READ_FAQ,
            }) === true;

        const effectiveActiveOnly = options?.activeOnly === true || !canSeeInactive;

        const items = await this.faqItemRepository.findAll(
            effectiveActiveOnly ? { isActive: true } : undefined,
        );
        const out: FaqItemPublicDto[] = [];
        for (const item of items) {
            const resolved = await resolveItemToPublicDto(this.faqTextRepository, item);
            if (resolved.isError()) return err(resolved.error);
            out.push(resolved.data);
        }
        return ok(out);
    }
}
