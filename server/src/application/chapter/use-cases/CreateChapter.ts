import type { ChapterRepository } from "@domain/repositories/ChapterRepository";
import type { AnimeRepository } from "@domain/repositories/AnimeRepository";
import type { FileRepository } from "@domain/repositories/FileRepository";
import type { UserRepository } from "@domain/repositories/UserRepository";
import type { IdGenerator } from "@domain/services/IdGenerator";
import { Chapter } from "@domain/entities/Chapter";
import { AnimePermission } from "@domain/value-object/Permissions";
import { err, ok, type Result } from "@lib/result";
import type { ChapterError } from "../errors";
import type { ChapterDto, CreateChapterInput as CreateChapterBody } from "../dto";
import { toChapterDto } from "../dto";
import { assertPermission } from "@application/shared/auth";
import { assertMediaUrl } from "@application/shared/assertMediaUrl";

export type CreateChapterInput = CreateChapterBody & { animeId: string };

export class CreateChapterUseCase {
   constructor(
      private readonly chapterRepository: ChapterRepository,
      private readonly animeRepository: AnimeRepository,
      private readonly userRepository: UserRepository,
      private readonly idGenerator: IdGenerator,
      private readonly fileRepository: FileRepository,
   ) { }

   async execute(requesterId: string, input: CreateChapterInput): Promise<Result<ChapterDto, ChapterError>> {
      const auth = await assertPermission(
         this.userRepository,
         requesterId,
         { type: "anime", permission: AnimePermission.CREATE_ANIME },
         "chapter_not_authorized",
      );
      if (auth.isError()) return auth;

      const anime = await this.animeRepository.findById(input.animeId);
      if (!anime) return err("anime_not_found");

      const cover = await assertMediaUrl(
         this.fileRepository,
         input.coverImageURL,
         "chapter_file_not_found",
      );
      if (cover.isError()) return cover;

      const video = await assertMediaUrl(
         this.fileRepository,
         input.videoURL,
         "chapter_file_not_found",
      );
      if (video.isError()) return video;

      const now = new Date();
      const chapter = new Chapter({
         id: this.idGenerator.generateUUID(),
         animeId: input.animeId,
         number: input.number,
         title: input.title,
         videoURL: input.videoURL,
         coverImageURL: input.coverImageURL,
         createdAt: now,
         updatedAt: now,
      });

      try {
         await this.chapterRepository.save(chapter);
      } catch (error) {
         console.error("chapter_save_failed", error);
         return err("chapter_save_failed");
      }

      return ok(toChapterDto(chapter));
   }
}
