import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import { assertPermission } from "@application/shared/auth";
import { runSoftDeleteTransition } from "@application/shared/runSoftDeleteTransition";

export class DeleteAnimeUseCase {
   constructor(
      private readonly animeRepository: AnimeRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string, id: string): Promise<Result<void, AnimeError>> {
      const auth = await assertPermission(
         this.userRepository,
         requesterId,
         { type: "anime", permission: AnimePermission.DELETE_ANIME },
         "anime_not_authorized",
      );
      if (auth.isError()) return auth;

      const result = await runSoftDeleteTransition({
         find: () => this.animeRepository.findById(id),
         notFound: "anime_not_found",
         transition: (anime) => anime.markDeleted(),
         invalidTransition: "anime_invalid_transition",
         save: (anime) => this.animeRepository.save(anime),
         saveFailed: "anime_save_failed",
      });
      if (result.isError()) return result;

      return ok(undefined);
   }
}
