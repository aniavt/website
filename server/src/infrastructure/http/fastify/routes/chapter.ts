import type { FastifyReply, FastifySchema } from "fastify";
import type { IUserUseCases } from "@application/users/IUserUseCases";
import type { IChapterUseCases } from "@application/chapter/IChapterUseCases";
import type { RegisterRouteFn } from "../types";
import { sendChapterError } from "../errors";
import { authenticate } from "../middlewares/auth";

export interface ChapterRoutesDependencies {
   userUseCases: IUserUseCases;
   chapterUseCases: IChapterUseCases;
}

const createChapterSchema: FastifySchema = {
   body: {
      type: "object",
      required: ["number"],
      properties: {
         number: { type: "number" },
         title: { type: "string" },
         videoURL: { type: "string" },
         coverImageURL: { type: "string" },
      },
      additionalProperties: false,
   },
};

const updateChapterSchema: FastifySchema = {
   body: {
      type: "object",
      properties: {
         number: { type: "number" },
         title: { type: "string" },
         videoURL: { type: "string" },
         coverImageURL: { type: "string" },
      },
      additionalProperties: false,
   },
};

export const registerChapterRoutes: RegisterRouteFn<ChapterRoutesDependencies> = (
   app,
   prefixUrl,
   { userUseCases, chapterUseCases },
) => {
   // List chapters for an anime (public)
   app.get<{ Params: { animeId: string } }>(
      prefixUrl("/anime/:animeId/chapters"),
      async (request, reply) => {
         const result = await chapterUseCases.listChaptersByAnime.execute(request.params.animeId);
         if (result.isError()) return sendChapterError(reply, result.error);
         return reply.send(result.data);
      },
   );

   // Create a chapter
   app.post<{ Params: { animeId: string } }>(
      prefixUrl("/anime/:animeId/chapters"),
      { preHandler: authenticate(userUseCases), schema: createChapterSchema },
      async (request, reply) => {
         const body = request.body as {
            number: number;
            title?: string;
            videoURL?: string;
            coverImageURL?: string;
         };
         const result = await chapterUseCases.createChapter.execute(request.user!.id, {
            animeId: request.params.animeId,
            ...body,
         });
         if (result.isError()) return sendChapterError(reply, result.error);
         return reply.status(201).send(result.data);
      },
   );

   // Update a chapter
   app.patch<{ Params: { id: string } }>(
      prefixUrl("/chapters/:id"),
      { preHandler: authenticate(userUseCases), schema: updateChapterSchema },
      async (request, reply) => {
         const body = request.body as {
            number?: number;
            title?: string;
            videoURL?: string;
            coverImageURL?: string;
         };
         const result = await chapterUseCases.updateChapter.execute(request.user!.id, {
            id: request.params.id,
            ...body,
         });
         if (result.isError()) return sendChapterError(reply, result.error);
         return reply.send(result.data);
      },
   );

   // Delete a chapter
   app.delete<{ Params: { id: string } }>(
      prefixUrl("/chapters/:id"),
      { preHandler: authenticate(userUseCases) },
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
