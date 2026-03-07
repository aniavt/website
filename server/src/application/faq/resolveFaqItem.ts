import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqItem } from "@domain/entities/FaqItem";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "./errors";
import type { FaqItemPublicDto } from "./dto";
import { toFaqItemPublicDto } from "./dto";


export async function resolveItemToPublicDto(
    faqTextRepository: FaqTextRepository,
    item: FaqItem,
): Promise<Result<FaqItemPublicDto, FaqError>> {
    const queryText = await faqTextRepository.findById(item.queryId);
    const answerText = await faqTextRepository.findById(item.answerId);
    if (!queryText || !answerText) return err("faq_text_not_found");
    return ok(toFaqItemPublicDto(item, queryText.value, answerText.value));
}
