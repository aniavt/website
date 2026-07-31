import type { ChapterRepository } from "@domain/repositories/ChapterRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { ChapterError } from "../errors";
import type { ChapterDto, UpdateChapterInput as UpdateChapterBody } from "../dto";
import { toChapterDto } from "../dto";
import { assertPermission } from "@application/shared/auth";
import { saveOrErr } from "@application/shared/saveOrErr";

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

      chapter.applyUpdate({
         number: input.number,
         title: input.title,
         videoURL: input.videoURL,
         coverImageURL: input.coverImageURL,
      });

      const saved = await saveOrErr(this.chapterRepository.save(chapter), "chapter_save_failed");
      if (saved.isError()) return saved;

      return ok(toChapterDto(chapter));
   }
}
