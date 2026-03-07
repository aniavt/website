import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
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
    ) {}

    async execute(options?: ListFaqItemsOptions): Promise<Result<FaqItemPublicDto[], FaqError>> {
        const items = await this.faqItemRepository.findAll(
            options?.activeOnly === true ? { isActive: true } : undefined,
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
