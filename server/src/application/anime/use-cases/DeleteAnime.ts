import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import { assertPermission } from "@application/shared/auth";
import { saveOrErr } from "@application/shared/saveOrErr";

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

      const anime = await this.animeRepository.findById(id);
      if (!anime) return err("anime_not_found");

      if (!anime.markDeleted()) return err("anime_invalid_transition");

      const saved = await saveOrErr(this.animeRepository.save(anime), "anime_save_failed");
      if (saved.isError()) return saved;

      return ok(undefined);
   }
}
