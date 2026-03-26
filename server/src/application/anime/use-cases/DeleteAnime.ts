import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";

export class DeleteAnimeUseCase {
   constructor(
      private readonly animeRepository: AnimeRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string, id: string): Promise<Result<void, AnimeError>> {
      const requester = await this.userRepository.findById(requesterId);
      if (!requester) return err("anime_not_authorized");
      if (!requester.hasPermission({ type: "anime", permission: AnimePermission.DELETE_ANIME })) {
         return err("anime_not_authorized");
      }

      const anime = await this.animeRepository.findById(id);
      if (!anime) return err("anime_not_found");

      if (!anime.canTransitionTo("deleted")) return err("anime_invalid_transition");

      anime.active = false;
      anime.lastAction = "deleted";
      anime.updatedAt = new Date();

      try {
         await this.animeRepository.save(anime);
      } catch {
         return err("anime_save_failed");
      }

      return ok(undefined);
   }
}
