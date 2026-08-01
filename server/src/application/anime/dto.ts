import type { Anime } from "@domain/entities/Anime";
import type { AnimeDto } from "@ania/api-contract/anime";

export type { AnimeDto, CreateAnimeInput, UpdateAnimeInput } from "@ania/api-contract/anime";

export function toAnimeDto(entity: Anime): AnimeDto {
   return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      coverImageURL: entity.coverImageURL,
      genre: entity.genre,
      status: entity.status,
      active: entity.active,
      lastAction: entity.lastAction,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
   };
}
