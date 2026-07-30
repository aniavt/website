import type { ChapterRepository } from "@domain/repositories/ChapterRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { ChapterError } from "../errors";
import type { ChapterDto, UpdateChapterInput as UpdateChapterBody } from "../dto";
import { toChapterDto } from "../dto";
import { assertPermission } from "@application/shared/auth";

export type UpdateChapterInput = UpdateChapterBody & { id: string };

export class UpdateChapterUseCase {
   constructor(
      private readonly chapterRepository: ChapterRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string, input: UpdateChapterInput): Promise<Result<ChapterDto, ChapterError>> {
      const auth = await assertPermission(
         this.userRepository,
         requesterId,
         { type: "anime", permission: AnimePermission.UPDATE_ANIME },
         "chapter_not_authorized",
      );
      if (auth.isError()) return auth;

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
