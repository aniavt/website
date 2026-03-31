import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { Anime } from "@domain/entities/Anime";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { AnimeError } from "../errors";
import type { AnimeDto } from "../dto";
import { toAnimeDto } from "../dto";

export interface CreateAnimeInput {
  title: string;
  description?: string;
  coverImageURL?: string;
  genre: string;
  status: "watching" | "completed" | "upcoming";
}

export class CreateAnimeUseCase {
  constructor(
    private readonly animeRepository: AnimeRepository,
    private readonly userRepository: UserRepository,
    private readonly idGenerator: IdGenerator,
  ) { }

  async execute(requesterId: string, input: CreateAnimeInput): Promise<Result<AnimeDto, AnimeError>> {
    const requester = await this.userRepository.findById(requesterId);
    if (!requester) return err("anime_not_authorized");
    if (!requester.hasPermission({ type: "anime", permission: AnimePermission.CREATE_ANIME })) {
      return err("anime_not_authorized");
    }

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

    try {
      await this.animeRepository.save(anime);
    } catch {
      return err("anime_save_failed");
    }

    return ok(toAnimeDto(anime));
  }
}
