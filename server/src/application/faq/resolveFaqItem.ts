import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqText } from "@domain/entities/FaqText";
import type { FaqItem } from "@domain/entities/FaqItem";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "./errors";
import type { FaqItemPublicDto } from "./dto";
import { toFaqItemPublicDto } from "./dto";


export function resolveItemToPublicDtoFromTexts(
    item: FaqItem,
    texts: Map<string, FaqText>,
): Result<FaqItemPublicDto, FaqError> {
    const queryText = texts.get(item.queryId);
    const answerText = texts.get(item.answerId);
    if (!queryText || !answerText) return err("faq_text_not_found");
    return ok(toFaqItemPublicDto(item, queryText.value, answerText.value));
}

export async function resolveItemToPublicDto(
    faqTextRepository: FaqTextRepository,
    item: FaqItem,
): Promise<Result<FaqItemPublicDto, FaqError>> {
    const texts = await faqTextRepository.findByIds([item.queryId, item.answerId]);
    return resolveItemToPublicDtoFromTexts(item, texts);
}
