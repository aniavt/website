import type { CreateAnimeUseCase } from "./use-cases/CreateAnime";
import type { UpdateAnimeUseCase } from "./use-cases/UpdateAnime";
import type { DeleteAnimeUseCase } from "./use-cases/DeleteAnime";
import type { RestoreAnimeUseCase } from "./use-cases/RestoreAnime";
import type { ListAnimesUseCase } from "./use-cases/ListAnimes";
import type { GetAnimeByIdUseCase } from "./use-cases/GetAnimeById";

export interface IAnimeUseCases {
   createAnime: CreateAnimeUseCase;
   updateAnime: UpdateAnimeUseCase;
   deleteAnime: DeleteAnimeUseCase;
   restoreAnime: RestoreAnimeUseCase;
   listAnimes: ListAnimesUseCase;
   getAnimeById: GetAnimeByIdUseCase;
}
