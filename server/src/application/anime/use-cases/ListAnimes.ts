import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import type { AnimeDto } from "../dto";
import { toAnimeDto } from "../dto";

export interface ListAnimesOptions {
   activeOnly?: boolean;
}

export class ListAnimesUseCase {
   constructor(
      private readonly animeRepository: AnimeRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string | null, options?: ListAnimesOptions): Promise<Result<AnimeDto[], AnimeError>> {
      const canSeeInactive =
         requesterId !== null &&
         (await this.userRepository.findById(requesterId))?.hasPermission({
            type: "anime",
            permission: AnimePermission.READ_ANIME,
         }) === true;

      const effectiveActiveOnly = options?.activeOnly === true || !canSeeInactive;

      const animes = await this.animeRepository.findAll(
         effectiveActiveOnly ? { active: true } : undefined,
      );

      return ok(animes.map(toAnimeDto));
   }
}
