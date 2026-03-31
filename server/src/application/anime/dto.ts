import type { Anime, AnimeStatus } from "@domain/entities/Anime";

export interface AnimeDto {
   readonly id: string;
   readonly title: string;
   readonly description?: string;
   readonly coverImageURL?: string;
   readonly genre: string;
   readonly status: AnimeStatus;
   readonly active: boolean;
   readonly lastAction: string;
   readonly createdAt: Date;
   readonly updatedAt: Date;
}

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
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
   };
}
