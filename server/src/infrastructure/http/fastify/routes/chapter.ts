import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IChapterUseCases } from "@application/chapter/IChapterUseCases";
import type { UserRepository } from "@domain/repositories/UserRepository";
import {
   CreateChapterInputSchema,
   UpdateChapterInputSchema,
} from "@ania/api-contract/chapter";
import type { RegisterRouteFn } from "../types";
import { sendChapterError } from "../errors";
import { authenticate } from "../middlewares/auth";
import { AnimeIdParamsSchema, IdParamsSchema } from "../route-schemas";

export interface ChapterRoutesDependencies {
   userUseCases: IUserUseCases;
   userRepository: UserRepository;
   chapterUseCases: IChapterUseCases;
}

export const registerChapterRoutes: RegisterRouteFn<ChapterRoutesDependencies> = (
   app,
   prefixUrl,
   { userRepository, chapterUseCases },
) => {
   app.get(
      prefixUrl("/anime/:animeId/chapters"),
      { schema: { params: AnimeIdParamsSchema } },
      async (request, reply) => {
         const result = await chapterUseCases.listChaptersByAnime.execute(request.params.animeId);
         if (result.isError()) return sendChapterError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.post(
      prefixUrl("/anime/:animeId/chapters"),
      {
         preHandler: authenticate(userRepository),
         schema: { params: AnimeIdParamsSchema, body: CreateChapterInputSchema },
      },
      async (request, reply) => {
         const result = await chapterUseCases.createChapter.execute(request.user!.id, {
            animeId: request.params.animeId,
            ...request.body,
         });
         if (result.isError()) return sendChapterError(reply, result.error);
         return reply.status(201).send(result.data);
      },
   );

   app.patch(
      prefixUrl("/chapters/:id"),
      {
         preHandler: authenticate(userRepository),
         schema: { params: IdParamsSchema, body: UpdateChapterInputSchema },
      },
      async (request, reply) => {
         const result = await chapterUseCases.updateChapter.execute(request.user!.id, {
            id: request.params.id,
            ...request.body,
         });
         if (result.isError()) return sendChapterError(reply, result.error);
         return reply.send(result.data);
      },
   );

   app.delete(
      prefixUrl("/chapters/:id"),
      {
         preHandler: authenticate(userRepository),
         schema: { params: IdParamsSchema },
      },
      async (request, reply) => {
         const result = await chapterUseCases.deleteChapter.execute(
            request.user!.id,
            request.params.id,
         );
         if (result.isError()) return sendChapterError(reply, result.error);
         return reply.status(204).send();
      },
   );
};
