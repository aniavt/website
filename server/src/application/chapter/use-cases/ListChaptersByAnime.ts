import type { ChapterRepository } from "@domain/repositories/ChapterRepository";
import { ok, type Result } from "@lib/result";
import type { ChapterError } from "../errors";
import type { ChapterDto } from "../dto";
import { toChapterDto } from "../dto";

export class ListChaptersByAnimeUseCase {
   constructor(private readonly chapterRepository: ChapterRepository) { }

   async execute(animeId: string): Promise<Result<ChapterDto[], ChapterError>> {
      const chapters = await this.chapterRepository.findByAnimeId(animeId);
      const sorted = chapters.slice().sort((a, b) => a.number - b.number);
      return ok(sorted.map(toChapterDto));
   }
}
