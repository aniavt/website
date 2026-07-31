import type { IAnimeUseCases } from "@application/anime/IAnimeUseCases";
import { CreateAnimeUseCase } from "@application/anime/use-cases/CreateAnime";
import { UpdateAnimeUseCase } from "@application/anime/use-cases/UpdateAnime";
import { DeleteAnimeUseCase } from "@application/anime/use-cases/DeleteAnime";
import { RestoreAnimeUseCase } from "@application/anime/use-cases/RestoreAnime";
import { ListAnimesUseCase } from "@application/anime/use-cases/ListAnimes";
import { GetAnimeByIdUseCase } from "@application/anime/use-cases/GetAnimeById";
import type { IChapterUseCases } from "@application/chapter/IChapterUseCases";
import { CreateChapterUseCase } from "@application/chapter/use-cases/CreateChapter";
import { UpdateChapterUseCase } from "@application/chapter/use-cases/UpdateChapter";
import { DeleteChapterUseCase } from "@application/chapter/use-cases/DeleteChapter";
import { ListChaptersByAnimeUseCase } from "@application/chapter/use-cases/ListChaptersByAnime";
import { MongoDbAnimeRepository } from "@infrastructure/AnimeRepository/MongoDb";
import { MongoDbChapterRepository } from "@infrastructure/ChapterRepository/MongoDb";

import { mongoClient, idGenerator } from "./infra";
import { userRepository } from "./users";

const animeRepository = new MongoDbAnimeRepository(mongoClient);
const chapterRepository = new MongoDbChapterRepository(mongoClient);

export const animeUseCases: IAnimeUseCases = {
    createAnime: new CreateAnimeUseCase(animeRepository, userRepository, idGenerator),
    updateAnime: new UpdateAnimeUseCase(animeRepository, userRepository),
    deleteAnime: new DeleteAnimeUseCase(animeRepository, userRepository),
    restoreAnime: new RestoreAnimeUseCase(animeRepository, userRepository),
    listAnimes: new ListAnimesUseCase(animeRepository, userRepository),
    getAnimeById: new GetAnimeByIdUseCase(animeRepository),
};

export const chapterUseCases: IChapterUseCases = {
    createChapter: new CreateChapterUseCase(chapterRepository, animeRepository, userRepository, idGenerator),
    updateChapter: new UpdateChapterUseCase(chapterRepository, userRepository),
    deleteChapter: new DeleteChapterUseCase(chapterRepository, userRepository),
    listChaptersByAnime: new ListChaptersByAnimeUseCase(chapterRepository),
};
