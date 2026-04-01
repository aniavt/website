import type { Chapter } from "@domain/entities/Chapter";

export interface ChapterRepository {
   save(entity: Chapter): Promise<void>;
   findById(id: string): Promise<Chapter | null>;
   findByAnimeId(animeId: string): Promise<Chapter[]>;
   delete(id: string): Promise<void>;
}
