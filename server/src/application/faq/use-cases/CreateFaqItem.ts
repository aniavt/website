import type { FaqTextRepository } from "@domain/repositories/FaqTextRepository";
import type { FaqItemRepository } from "@domain/repositories/FaqItemRepository";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { UserEntity } from "@domain/entities/User";
import type { IdGenerator } from "@domain/services/IdGenerator";
import type { TransactionManager } from "@application/shared/TransactionManager";
import { FaqText } from "@domain/entities/FaqText";
import { FaqItem } from "@domain/entities/FaqItem";
import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import { FAQPermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { FaqError } from "../errors";
import type { FaqItemPublicDto, CreateFaqItemInput } from "../dto";
import { toFaqItemPublicDto } from "../dto";
import { assertPermission } from "@application/shared/auth";
import { saveWithHistory } from "@application/shared/saveWithHistory";

export type { CreateFaqItemInput };

export class CreateFaqItemUseCase {
    constructor(
        private readonly faqTextRepository: FaqTextRepository,
        private readonly faqItemRepository: FaqItemRepository,
        private readonly faqHistoryRepository: FaqHistoryRepository,
        private readonly userRepository: UserRepository,
        private readonly idGenerator: IdGenerator,
        private readonly transactionManager: TransactionManager,
    ) {}

    async execute(requester: UserEntity | string, input: CreateFaqItemInput): Promise<Result<FaqItemPublicDto, FaqError>> {
        const auth = await assertPermission(
            this.userRepository,
            requester,
            { type: "faq", permission: FAQPermission.CREATE_FAQ },
            "faq_not_authorized",
        );
        if (auth.isError()) return auth;

        let item!: FaqItem;
        let queryValue!: string;
        let answerValue!: string;

        const saved = await saveWithHistory({
            tx: this.transactionManager,
            persist: async () => {
                const queryText = await this.findOrCreateFaqText(input.query);
                const answerText = await this.findOrCreateFaqText(input.answer);

                item = new FaqItem({
                    id: this.idGenerator.generateUUID(),
                    queryId: queryText.id,
                    answerId: answerText.id,
                    isActive: true,
                    lastAction: "created",
                });

                await this.faqItemRepository.save(item);
                queryValue = queryText.value;
                answerValue = answerText.value;
            },
            append: () =>
                this.faqHistoryRepository.append(
                    new FaqHistoryEntry({
                        id: this.idGenerator.generateUUID(),
                        faqId: item.id,
                        queryId: item.queryId,
                        answerId: item.answerId,
                        action: "created",
                        by: auth.data.id,
                        timestamp: new Date(),
                    }),
                ),
            saveFailed: "faq_save_failed",
        });
        if (saved.isError()) return saved;

        return ok(toFaqItemPublicDto(item, queryValue, answerValue));
    }

    private async findOrCreateFaqText(value: string): Promise<FaqText> {
        const existing = await this.faqTextRepository.findByValue(value);
        if (existing) return existing;
        const text = new FaqText({ id: this.idGenerator.generateUUID(), value });
        await this.faqTextRepository.save(text);
        return text;
    }
}
