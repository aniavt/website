import type { Chapter } from "@domain/entities/Chapter";

export interface ChapterDto {
   readonly id: string;
   readonly animeId: string;
   readonly number: number;
   readonly title?: string;
   readonly videoURL?: string;
   readonly coverImageURL?: string;
   readonly createdAt: Date;
   readonly updatedAt: Date;
}

export function toChapterDto(entity: Chapter): ChapterDto {
   return {
      id: entity.id,
      animeId: entity.animeId,
      number: entity.number,
      title: entity.title,
      videoURL: entity.videoURL,
      coverImageURL: entity.coverImageURL,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
   };
}
