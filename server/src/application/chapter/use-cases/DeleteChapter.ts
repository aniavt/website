import type { ChapterRepository } from "@domain/repositories/ChapterRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { ChapterError } from "../errors";
import { assertPermission } from "@application/shared/auth";

export class DeleteChapterUseCase {
   constructor(
      private readonly chapterRepository: ChapterRepository,
      private readonly userRepository: UserRepository,
   ) { }

   async execute(requesterId: string, chapterId: string): Promise<Result<void, ChapterError>> {
      const auth = await assertPermission(
         this.userRepository,
         requesterId,
         { type: "anime", permission: AnimePermission.DELETE_ANIME },
         "chapter_not_authorized",
      );
      if (auth.isError()) return auth;

      const chapter = await this.chapterRepository.findById(chapterId);
      if (!chapter) return err("chapter_not_found");

      try {
         await this.chapterRepository.delete(chapterId);
      } catch (error) {
         console.error("chapter_delete_failed", error);
         return err("chapter_delete_failed");
      }

      return ok(undefined);
   }
}
