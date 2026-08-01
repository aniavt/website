import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import type { AnimeDto, UpdateAnimeInput as UpdateAnimeBody } from "../dto";
import { toAnimeDto } from "../dto";
import { assertPermission } from "@application/shared/auth";
import { assertMediaUrl } from "@application/shared/assertMediaUrl";
import { saveOrErr } from "@application/shared/saveOrErr";

export type UpdateAnimeInput = UpdateAnimeBody & { id: string };

export class UpdateAnimeUseCase {
   constructor(
      private readonly animeRepository: AnimeRepository,
      private readonly userRepository: UserRepository,
      private readonly fileRepository: FileRepository,
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

      if (input.coverImageURL !== undefined) {
         const media = await assertMediaUrl(
            this.fileRepository,
            input.coverImageURL,
            "anime_file_not_found",
         );
         if (media.isError()) return media;
      }

      if (!anime.applyUpdate({
         title: input.title,
         description: input.description,
         coverImageURL: input.coverImageURL,
         genre: input.genre,
         status: input.status,
      })) {
         return err("anime_invalid_transition");
      }

      const saved = await saveOrErr(this.animeRepository.save(anime), "anime_save_failed");
      if (saved.isError()) return saved;

      return ok(toAnimeDto(anime));
   }
}
