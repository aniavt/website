import type { CreateChapterUseCase } from "./use-cases/CreateChapter";
import type { UpdateChapterUseCase } from "./use-cases/UpdateChapter";
import type { DeleteChapterUseCase } from "./use-cases/DeleteChapter";
import type { ListChaptersByAnimeUseCase } from "./use-cases/ListChaptersByAnime";

export interface IChapterUseCases {
   createChapter: CreateChapterUseCase;
   updateChapter: UpdateChapterUseCase;
   deleteChapter: DeleteChapterUseCase;
   listChaptersByAnime: ListChaptersByAnimeUseCase;
}
