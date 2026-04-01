import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import type { AnimeDto } from "../dto";
import { toAnimeDto } from "../dto";

export interface UpdateAnimeInput {
   id: string;
   title?: string;
   description?: string;
   coverImageURL?: string;
   genre?: string;
   status?: "watching" | "completed" | "upcoming";
}

export class UpdateAnimeUseCase {
   constructor(
      private readonly animeRepository: AnimeRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string, input: UpdateAnimeInput): Promise<Result<AnimeDto, AnimeError>> {
      const requester = await this.userRepository.findById(requesterId);
      if (!requester) return err("anime_not_authorized");
      if (!requester.hasPermission({ type: "anime", permission: AnimePermission.UPDATE_ANIME })) {
         return err("anime_not_authorized");
      }

      const anime = await this.animeRepository.findById(input.id);
      if (!anime) return err("anime_not_found");

      if (!anime.canTransitionTo("updated")) return err("anime_invalid_transition");

      if (input.title !== undefined) anime.title = input.title;
      if (input.description !== undefined) anime.description = input.description;
      if (input.coverImageURL !== undefined) anime.coverImageURL = input.coverImageURL;
      if (input.genre !== undefined) anime.genre = input.genre;
      if (input.status !== undefined) anime.status = input.status;
      anime.lastAction = "updated";
      anime.updatedAt = new Date();

      try {
         await this.animeRepository.save(anime);
      } catch {
         return err("anime_save_failed");
      }

      return ok(toAnimeDto(anime));
   }
}
