import type { CreateFaqItemUseCase } from "./use-cases/CreateFaqItem";
import type { UpdateFaqItemUseCase } from "./use-cases/UpdateFaqItem";
import type { DeleteFaqItemUseCase } from "./use-cases/DeleteFaqItem";
import type { RestoreFaqItemUseCase } from "./use-cases/RestoreFaqItem";
import type { ListFaqItemsUseCase } from "./use-cases/ListFaqItems";
import type { GetFaqItemUseCase } from "./use-cases/GetFaqItem";
import type { GetFaqHistoryUseCase } from "./use-cases/GetFaqHistory";


export interface IFaqUseCases {
    createFaqItem: CreateFaqItemUseCase;
    updateFaqItem: UpdateFaqItemUseCase;
    deleteFaqItem: DeleteFaqItemUseCase;
    restoreFaqItem: RestoreFaqItemUseCase;
    listFaqItems: ListFaqItemsUseCase;
    getFaqItem: GetFaqItemUseCase;
    getFaqHistory: GetFaqHistoryUseCase;
}
