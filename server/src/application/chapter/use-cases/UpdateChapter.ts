import type { ChapterRepository } from "@domain/repositories/ChapterRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { ChapterError } from "../errors";
import type { ChapterDto } from "../dto";
import { toChapterDto } from "../dto";

export interface UpdateChapterInput {
   id: string;
   number?: number;
   title?: string;
   videoURL?: string;
   coverImageURL?: string;
}

export class UpdateChapterUseCase {
   constructor(
      private readonly chapterRepository: ChapterRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string, input: UpdateChapterInput): Promise<Result<ChapterDto, ChapterError>> {
      const requester = await this.userRepository.findById(requesterId);
      if (!requester) return err("chapter_not_authorized");
      if (!requester.hasPermission({ type: "anime", permission: AnimePermission.UPDATE_ANIME })) {
         return err("chapter_not_authorized");
      }

      const chapter = await this.chapterRepository.findById(input.id);
      if (!chapter) return err("chapter_not_found");

      if (input.number !== undefined) chapter.number = input.number;
      if (input.title !== undefined) chapter.title = input.title;
      if (input.videoURL !== undefined) chapter.videoURL = input.videoURL;
      if (input.coverImageURL !== undefined) chapter.coverImageURL = input.coverImageURL;
      chapter.updatedAt = new Date();

      try {
         await this.chapterRepository.save(chapter);
      } catch {
         return err("chapter_save_failed");
      }

      return ok(toChapterDto(chapter));
   }
}
