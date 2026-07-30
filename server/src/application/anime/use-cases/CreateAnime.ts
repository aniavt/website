import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { Anime } from "@domain/entities/Anime";
import { AnimePermission } from "@domain/value-object/Permissions";
import { ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import type { AnimeDto, CreateAnimeInput } from "../dto";
import { toAnimeDto } from "../dto";
import { assertPermission } from "@application/shared/auth";
import { saveOrErr } from "@application/shared/saveOrErr";

export type { CreateAnimeInput };

export class CreateAnimeUseCase {
  constructor(
    private readonly animeRepository: AnimeRepository,
    private readonly userRepository: UserRepository,
    private readonly idGenerator: IdGenerator,
  ) { }

  async execute(requesterId: string, input: CreateAnimeInput): Promise<Result<AnimeDto, AnimeError>> {
    const auth = await assertPermission(
      this.userRepository,
      requesterId,
      { type: "anime", permission: AnimePermission.CREATE_ANIME },
      "anime_not_authorized",
    );
    if (auth.isError()) return auth;

    const now = new Date();
    const anime = new Anime({
      id: this.idGenerator.generateUUID(),
      title: input.title,
      description: input.description,
      coverImageURL: input.coverImageURL,
      genre: input.genre,
      status: input.status,
      active: true,
      lastAction: "created",
      createdAt: now,
      updatedAt: now,
    });

    const saved = await saveOrErr(this.animeRepository.save(anime), "anime_save_failed");
    if (saved.isError()) return saved;

    return ok(toAnimeDto(anime));
  }
}
