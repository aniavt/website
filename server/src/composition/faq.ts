import type { IFaqUseCases } from "@application/faq/IFaqUseCases";
import { CreateFaqItemUseCase } from "@application/faq/use-cases/CreateFaqItem";
import { UpdateFaqItemUseCase } from "@application/faq/use-cases/UpdateFaqItem";
import { DeleteFaqItemUseCase } from "@application/faq/use-cases/DeleteFaqItem";
import { RestoreFaqItemUseCase } from "@application/faq/use-cases/RestoreFaqItem";
import { ListFaqItemsUseCase } from "@application/faq/use-cases/ListFaqItems";
import { GetFaqItemUseCase } from "@application/faq/use-cases/GetFaqItem";
import { GetFaqHistoryUseCase } from "@application/faq/use-cases/GetFaqHistory";
import { MongoDbFaqTextRepository } from "@infrastructure/FaqTextRepository/MongoDb";
import { MongoDbFaqItemRepository } from "@infrastructure/FaqItemRepository/MongoDb";
import { MongoDbFaqHistoryRepository } from "@infrastructure/FaqHistoryRepository/MongoDb";

import { mongoClient, idGenerator } from "./infra";
import { userRepository } from "./users";

const faqTextRepository = new MongoDbFaqTextRepository(mongoClient);
const faqItemRepository = new MongoDbFaqItemRepository(mongoClient);
const faqHistoryRepository = new MongoDbFaqHistoryRepository(mongoClient);

export const faqUseCases: IFaqUseCases = {
    createFaqItem: new CreateFaqItemUseCase(
        faqTextRepository,
        faqItemRepository,
        faqHistoryRepository,
        userRepository,
        idGenerator,
    ),
    updateFaqItem: new UpdateFaqItemUseCase(
        faqTextRepository,
        faqItemRepository,
        faqHistoryRepository,
        userRepository,
        idGenerator,
    ),
    deleteFaqItem: new DeleteFaqItemUseCase(
        faqItemRepository,
        faqTextRepository,
        faqHistoryRepository,
        userRepository,
        idGenerator,
    ),
    restoreFaqItem: new RestoreFaqItemUseCase(
        faqItemRepository,
        faqTextRepository,
        faqHistoryRepository,
        userRepository,
        idGenerator,
    ),
    listFaqItems: new ListFaqItemsUseCase(
        faqItemRepository,
        faqTextRepository,
        userRepository,
    ),
    getFaqItem: new GetFaqItemUseCase(faqItemRepository, faqTextRepository),
    getFaqHistory: new GetFaqHistoryUseCase(faqHistoryRepository, faqItemRepository, userRepository),
};
