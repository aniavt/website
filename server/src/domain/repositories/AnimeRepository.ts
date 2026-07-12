import type { Anime } from "@domain/entities/Anime";

export interface AnimeFindAllOptions {
  active?: boolean;
  isSeasonalAnime?:boolean
}

export interface AnimeRepository {
  save(entity: Anime): Promise<void>;
  findById(id: string): Promise<Anime | null>;
  findAll(options?: AnimeFindAllOptions): Promise<Anime[]>;
}
