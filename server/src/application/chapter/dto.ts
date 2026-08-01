import type { Chapter } from "@domain/entities/Chapter";
import type { ChapterDto } from "@ania/api-contract/chapter";

export type { ChapterDto, CreateChapterInput, UpdateChapterInput } from "@ania/api-contract/chapter";

export function toChapterDto(entity: Chapter): ChapterDto {
   return {
      id: entity.id,
      animeId: entity.animeId,
      number: entity.number,
      title: entity.title,
      videoURL: entity.videoURL,
      coverImageURL: entity.coverImageURL,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
   };
}
