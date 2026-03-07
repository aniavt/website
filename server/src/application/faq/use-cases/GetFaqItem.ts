import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto } from "../dto";
import { resolveItemToPublicDto } from "../resolveFaqItem";

export class GetFaqItemUseCase {
    constructor(
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqTextRepository: FaqTextRepository,
    ) {}

    async execute(id: string): Promise<Result<FaqItemPublicDto, FaqError>> {
        const item = await this.faqItemRepository.findById(id);
        if (!item) return err("faq_item_not_found");
        return resolveItemToPublicDto(this.faqTextRepository, item);
    }
}
