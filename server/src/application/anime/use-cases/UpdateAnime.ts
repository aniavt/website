import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import type { AnimeDto, UpdateAnimeInput as UpdateAnimeBody } from "../dto";
import { toAnimeDto } from "../dto";
import { assertPermission } from "@application/shared/auth";
import { saveOrErr } from "@application/shared/saveOrErr";

export type UpdateAnimeInput = UpdateAnimeBody & { id: string };

export class UpdateAnimeUseCase {
   constructor(
      private readonly animeRepository: AnimeRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string, input: UpdateAnimeInput): Promise<Result<AnimeDto, AnimeError>> {
      const auth = await assertPermission(
         this.userRepository,
         requesterId,
         { type: "anime", permission: AnimePermission.UPDATE_ANIME },
         "anime_not_authorized",
      );
      if (auth.isError()) return auth;

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

      const saved = await saveOrErr(this.animeRepository.save(anime), "anime_save_failed");
      if (saved.isError()) return saved;

      return ok(toAnimeDto(anime));
   }
}
