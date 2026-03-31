import type { ChapterRepository } from "@domain/repositories/ChapterRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { ChapterError } from "../errors";

export class DeleteChapterUseCase {
   constructor(
      private readonly chapterRepository: ChapterRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string, chapterId: string): Promise<Result<void, ChapterError>> {
      const requester = await this.userRepository.findById(requesterId);
      if (!requester) return err("chapter_not_authorized");
      if (!requester.hasPermission({ type: "anime", permission: AnimePermission.DELETE_ANIME })) {
         return err("chapter_not_authorized");
      }

      const chapter = await this.chapterRepository.findById(chapterId);
      if (!chapter) return err("chapter_not_found");

      try {
         await this.chapterRepository.delete(chapterId);
      } catch {
         return err("chapter_delete_failed");
      }

      return ok(undefined);
   }
}
