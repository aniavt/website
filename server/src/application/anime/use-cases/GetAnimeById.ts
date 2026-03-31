import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import { err, ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import type { AnimeDto } from "../dto";
import { toAnimeDto } from "../dto";

export class GetAnimeByIdUseCase {
   constructor(
      private readonly animeRepository: AnimeRepository,
   ) { }

   async execute(id: string): Promise<Result<AnimeDto, AnimeError>> {
      const anime = await this.animeRepository.findById(id);
      if (!anime) return err("anime_not_found");
      return ok(toAnimeDto(anime));
   }
}
